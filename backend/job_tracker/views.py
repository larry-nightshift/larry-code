from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q, Count
from datetime import timedelta
import csv
import json
from io import StringIO

from .models import (
    Company,
    Application,
    Contact,
    ApplicationContact,
    Activity,
    Reminder,
    InterviewPrepNote,
)
from .serializers import (
    CompanySerializer,
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ContactSerializer,
    ApplicationContactSerializer,
    ActivitySerializer,
    ReminderSerializer,
    InterviewPrepNoteSerializer,
    DashboardSerializer,
)


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "industry", "location"]
    ordering_fields = ["name", "-created_at"]
    ordering = ["name"]

    def get_queryset(self):
        return Company.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["role_title", "company__name", "notes"]
    ordering_fields = ["applied_date", "priority", "-updated_at", "status"]
    ordering = ["-updated_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ApplicationDetailSerializer
        return ApplicationListSerializer

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user).select_related(
            "company"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)

        # Status filter
        status_param = self.request.query_params.get("status")
        if status_param:
            statuses = status_param.split(",")
            queryset = queryset.filter(status__in=statuses)

        # Company filter
        company_id = self.request.query_params.get("company_id")
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        # Priority filter
        priority = self.request.query_params.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)

        # Location type filter
        location_type = self.request.query_params.get("location_type")
        if location_type:
            queryset = queryset.filter(location_type=location_type)

        # Date range filters
        applied_after = self.request.query_params.get("applied_after")
        if applied_after:
            queryset = queryset.filter(applied_date__gte=applied_after)

        applied_before = self.request.query_params.get("applied_before")
        if applied_before:
            queryset = queryset.filter(applied_date__lte=applied_before)

        # Has upcoming reminder
        has_reminder = self.request.query_params.get("has_reminder")
        if has_reminder == "true":
            queryset = queryset.filter(
                reminders__is_completed=False
            ).distinct()

        return queryset

    @action(detail=True, methods=["post"])
    def add_contact(self, request, pk=None):
        """Link a contact to this application."""
        application = self.get_object()
        contact_id = request.data.get("contact_id")

        if not contact_id:
            return Response(
                {"error": "contact_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            contact = Contact.objects.get(id=contact_id, user=request.user)
        except Contact.DoesNotExist:
            return Response(
                {"error": "Contact not found"}, status=status.HTTP_404_NOT_FOUND
            )

        app_contact, created = ApplicationContact.objects.get_or_create(
            application=application, contact=contact
        )

        if created:
            return Response(
                ContactSerializer(contact).data, status=status.HTTP_201_CREATED
            )
        return Response(
            {"detail": "Contact already linked to this application"},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["delete"])
    def remove_contact(self, request, pk=None):
        """Remove a contact from this application."""
        application = self.get_object()
        contact_id = request.data.get("contact_id")

        if not contact_id:
            return Response(
                {"error": "contact_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ApplicationContact.objects.get(
                application=application, contact_id=contact_id
            ).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ApplicationContact.DoesNotExist:
            return Response(
                {"error": "Contact link not found"}, status=status.HTTP_404_NOT_FOUND
            )


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "email", "company__name"]
    ordering_fields = ["name", "-created_at"]
    ordering = ["name"]

    def get_queryset(self):
        queryset = Contact.objects.filter(user=self.request.user)

        company_id = self.request.query_params.get("company_id")
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    ordering_fields = ["-activity_date", "-created_at"]
    ordering = ["-activity_date", "-created_at"]

    def get_queryset(self):
        application_id = self.kwargs.get("application_id")
        return Activity.objects.filter(
            application_id=application_id, user=self.request.user
        )

    def perform_create(self, serializer):
        application_id = self.kwargs.get("application_id")
        try:
            application = Application.objects.get(
                id=application_id, user=self.request.user
            )
        except Application.DoesNotExist:
            raise serializers.ValidationError("Application not found")

        serializer.save(user=self.request.user, application=application)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    ordering_fields = ["reminder_date", "-created_at"]
    ordering = ["reminder_date"]

    def get_queryset(self):
        queryset = Reminder.objects.filter(user=self.request.user)

        # Filter by completion status
        is_completed = self.request.query_params.get("is_completed")
        if is_completed == "true":
            queryset = queryset.filter(is_completed=True)
        elif is_completed == "false":
            queryset = queryset.filter(is_completed=False)

        # Filter by application
        application_id = self.request.query_params.get("application_id")
        if application_id:
            queryset = queryset.filter(application_id=application_id)

        # Filter by date range
        due_before = self.request.query_params.get("due_before")
        if due_before:
            queryset = queryset.filter(reminder_date__lte=due_before)

        due_after = self.request.query_params.get("due_after")
        if due_after:
            queryset = queryset.filter(reminder_date__gte=due_after)

        return queryset

    def perform_create(self, serializer):
        application_id = self.kwargs.get("application_id")
        if application_id:
            try:
                application = Application.objects.get(
                    id=application_id, user=self.request.user
                )
            except Application.DoesNotExist:
                raise serializers.ValidationError("Application not found")
            serializer.save(user=self.request.user, application=application)
        else:
            serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark reminder as completed."""
        reminder = self.get_object()
        reminder.is_completed = True
        reminder.completed_at = timezone.now()
        reminder.save()
        return Response(ReminderSerializer(reminder).data)


class InterviewPrepNoteViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewPrepNoteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    ordering_fields = ["category", "-updated_at"]
    ordering = ["category", "-updated_at"]

    def get_queryset(self):
        application_id = self.kwargs.get("application_id")
        queryset = InterviewPrepNote.objects.filter(
            application_id=application_id, user=self.request.user
        )

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        return queryset

    def perform_create(self, serializer):
        application_id = self.kwargs.get("application_id")
        try:
            application = Application.objects.get(
                id=application_id, user=self.request.user
            )
        except Application.DoesNotExist:
            raise serializers.ValidationError("Application not found")

        serializer.save(user=self.request.user, application=application)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


class DashboardAPIView(viewsets.ViewSet):
    """Aggregated dashboard view."""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def overview(self, request):
        """Get dashboard overview data."""
        user = request.user

        # Pipeline counts
        pipeline_counts = {}
        for status_choice, status_label in Application.STATUS_CHOICES:
            count = Application.objects.filter(user=user, status=status_choice).count()
            pipeline_counts[status_choice] = count

        # Upcoming reminders (next 7 days)
        today = timezone.now().date()
        upcoming_date = today + timedelta(days=7)
        upcoming_reminders = Reminder.objects.filter(
            user=user,
            is_completed=False,
            reminder_date__gte=today,
            reminder_date__lte=upcoming_date,
        ).order_by("reminder_date")

        # Recent activities
        recent_activities = Activity.objects.filter(user=user).order_by(
            "-activity_date"
        )[:10]

        # Stats
        total_applications = Application.objects.filter(user=user).count()
        active_statuses = [
            Application.STATUS_WISHLIST,
            Application.STATUS_APPLIED,
            Application.STATUS_PHONE_SCREEN,
            Application.STATUS_INTERVIEW,
            Application.STATUS_OFFER,
        ]
        active_count = Application.objects.filter(
            user=user, status__in=active_statuses
        ).count()

        # Response rate: (moved past APPLIED) / (total with applied_date)
        applied_count = Application.objects.filter(
            user=user, applied_date__isnull=False
        ).count()
        moved_past = Application.objects.filter(
            user=user,
            applied_date__isnull=False,
        ).exclude(status=Application.STATUS_APPLIED).count()
        response_rate = (moved_past / applied_count * 100) if applied_count > 0 else 0

        # Avg days in pipeline
        active_apps = Application.objects.filter(
            user=user, status__in=active_statuses, applied_date__isnull=False
        )
        if active_apps.exists():
            total_days = sum(
                (timezone.now().date() - app.applied_date).days
                for app in active_apps
            )
            avg_days = total_days / active_apps.count()
        else:
            avg_days = 0

        stats = {
            "total_applications": total_applications,
            "active_count": active_count,
            "response_rate": round(response_rate, 1),
            "avg_days_in_pipeline": round(avg_days, 1),
        }

        data = {
            "pipeline_counts": pipeline_counts,
            "upcoming_reminders": ReminderSerializer(upcoming_reminders, many=True).data,
            "recent_activities": ActivitySerializer(recent_activities, many=True).data,
            "stats": stats,
        }

        return Response(data)


class ExportViewSet(viewsets.ViewSet):
    """Export data as JSON or CSV."""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def json(self, request):
        """Export all data as JSON."""
        user = request.user

        applications = Application.objects.filter(user=user).prefetch_related(
            "company", "activities", "reminders", "prep_notes", "contacts"
        )

        data = {
            "export_date": timezone.now().isoformat(),
            "applications": [],
        }

        for app in applications:
            app_data = {
                "id": str(app.id),
                "company": {
                    "id": str(app.company.id),
                    "name": app.company.name,
                },
                "role_title": app.role_title,
                "job_url": app.job_url,
                "salary_min": app.salary_min,
                "salary_max": app.salary_max,
                "salary_currency": app.salary_currency,
                "location_type": app.location_type,
                "status": app.status,
                "priority": app.priority,
                "source": app.source,
                "applied_date": str(app.applied_date) if app.applied_date else None,
                "notes": app.notes,
                "activities": [
                    {
                        "id": str(act.id),
                        "type": act.activity_type,
                        "title": act.title,
                        "description": act.description,
                        "date": act.activity_date.isoformat(),
                        "is_system": act.is_system,
                    }
                    for act in app.activities.all()
                ],
                "reminders": [
                    {
                        "id": str(rem.id),
                        "date": str(rem.reminder_date),
                        "title": rem.title,
                        "notes": rem.notes,
                        "is_completed": rem.is_completed,
                    }
                    for rem in app.reminders.all()
                ],
                "prep_notes": [
                    {
                        "id": str(note.id),
                        "category": note.category,
                        "title": note.title,
                        "content": note.content,
                    }
                    for note in app.prep_notes.all()
                ],
                "contacts": [
                    {
                        "id": str(ac.contact.id),
                        "name": ac.contact.name,
                        "email": ac.contact.email,
                        "role": ac.contact.role_at_company,
                    }
                    for ac in app.contacts.all()
                ],
                "created_at": app.created_at.isoformat(),
                "updated_at": app.updated_at.isoformat(),
            }
            data["applications"].append(app_data)

        response_data = json.dumps(data, indent=2)
        return Response(response_data, content_type="application/json")

    @action(detail=False, methods=["get"])
    def csv(self, request):
        """Export applications as CSV."""
        user = request.user
        applications = Application.objects.filter(user=user).select_related("company")

        output = StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(
            [
                "Company",
                "Role",
                "Status",
                "Priority",
                "Location Type",
                "Salary Min",
                "Salary Max",
                "Currency",
                "Applied Date",
                "Source",
                "Job URL",
            ]
        )

        # Rows
        for app in applications:
            writer.writerow(
                [
                    app.company.name,
                    app.role_title,
                    app.get_status_display(),
                    app.priority,
                    app.get_location_type_display() or "",
                    app.salary_min or "",
                    app.salary_max or "",
                    app.salary_currency,
                    app.applied_date or "",
                    app.source or "",
                    app.job_url or "",
                ]
            )

        response_data = output.getvalue()
        return Response(response_data, content_type="text/csv")
