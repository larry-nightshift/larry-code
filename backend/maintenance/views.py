from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from datetime import date
from django.db.models import Q
from django.utils.dateparse import parse_date

from .models import Asset, MaintenanceTask, MaintenanceRecord
from .serializers import (
    AssetSerializer,
    MaintenanceTaskSerializer,
    MaintenanceRecordSerializer,
    DueTaskSerializer,
)
from .services.recurrence import compute_next_due_date_from_strategy, compute_status


class AssetViewSet(viewsets.ModelViewSet):
    """CRUD operations for assets."""

    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter assets by current user."""
        queryset = Asset.objects.filter(user=self.request.user)

        # Filter by archived status
        archived = self.request.query_params.get("archived")
        if archived is not None:
            archived_bool = archived.lower() == "true"
            queryset = queryset.filter(is_archived=archived_bool)

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        # Search by name
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(location__icontains=search)
            )

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        """Create asset for current user."""
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete by archiving."""
        instance.is_archived = True
        instance.save()

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive an asset."""
        asset = self.get_object()
        asset.is_archived = True
        asset.save()
        return Response({"status": "asset archived"})

    @action(detail=True, methods=["post"])
    def unarchive(self, request, pk=None):
        """Unarchive an asset."""
        asset = self.get_object()
        asset.is_archived = False
        asset.save()
        return Response({"status": "asset unarchived"})


class MaintenanceTaskViewSet(viewsets.ModelViewSet):
    """CRUD operations for maintenance tasks."""

    serializer_class = MaintenanceTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter tasks by current user."""
        queryset = MaintenanceTask.objects.filter(user=self.request.user)

        # Filter by archived status
        archived = self.request.query_params.get("archived")
        if archived is not None:
            archived_bool = archived.lower() == "true"
            queryset = queryset.filter(is_archived=archived_bool)

        # Filter by active status
        active = self.request.query_params.get("active")
        if active is not None:
            active_bool = active.lower() == "true"
            queryset = queryset.filter(is_active=active_bool)

        # Filter by status
        task_status = self.request.query_params.get("status")
        if task_status:
            today = date.today()
            if task_status == "OVERDUE":
                queryset = queryset.filter(next_due_date__lt=today)
            elif task_status == "DUE_SOON":
                # Show as due soon within grace window or 7 days
                from datetime import timedelta

                soon_threshold = today + timedelta(days=7)
                queryset = queryset.filter(next_due_date__lte=soon_threshold, next_due_date__gte=today)
            elif task_status == "UPCOMING":
                from datetime import timedelta

                thirty_days = today + timedelta(days=30)
                queryset = queryset.filter(next_due_date__gt=today, next_due_date__lte=thirty_days)

        # Filter by asset
        asset_id = self.request.query_params.get("asset_id")
        if asset_id:
            queryset = queryset.filter(asset_id=asset_id)

        # Search by title
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset.order_by("next_due_date", "-created_at")

    def perform_create(self, serializer):
        """Create task for current user."""
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete by archiving."""
        instance.is_archived = True
        instance.save()

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive a task."""
        task = self.get_object()
        task.is_archived = True
        task.save()
        return Response({"status": "task archived"})

    @action(detail=True, methods=["post"])
    def unarchive(self, request, pk=None):
        """Unarchive a task."""
        task = self.get_object()
        task.is_archived = False
        task.save()
        return Response({"status": "task unarchived"})


class MaintenanceRecordViewSet(viewsets.ViewSet):
    """Create and list maintenance records."""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get maintenance records for user."""
        records = MaintenanceRecord.objects.filter(user=request.user)

        # Filter by task
        task_id = request.query_params.get("task_id")
        if task_id:
            records = records.filter(task_id=task_id)

        # Filter by asset
        asset_id = request.query_params.get("asset_id")
        if asset_id:
            records = records.filter(task__asset_id=asset_id)

        # Filter by date range
        from_date_str = request.query_params.get("from")
        if from_date_str:
            try:
                from_date = parse_date(from_date_str)
                records = records.filter(completed_date__gte=from_date)
            except (ValueError, TypeError):
                pass

        to_date_str = request.query_params.get("to")
        if to_date_str:
            try:
                to_date = parse_date(to_date_str)
                records = records.filter(completed_date__lte=to_date)
            except (ValueError, TypeError):
                pass

        serializer = MaintenanceRecordSerializer(records, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Create a completion record and update task due date."""
        task_id = request.data.get("task_id")
        completed_date_str = request.data.get("completed_date")

        if not task_id or not completed_date_str:
            return Response(
                {"error": "task_id and completed_date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            completed_date = parse_date(completed_date_str)
            if not completed_date:
                raise ValueError("Invalid date format")
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            task = MaintenanceTask.objects.get(id=task_id, user=request.user)
        except MaintenanceTask.DoesNotExist:
            return Response(
                {"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Prevent recording on archived tasks
        if task.is_archived:
            return Response(
                {"error": "Cannot record completion on archived task"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the record
        record = MaintenanceRecord.objects.create(
            user=request.user,
            task=task,
            completed_date=completed_date,
            notes=request.data.get("notes", ""),
            cost=request.data.get("cost"),
            performed_by=request.data.get("performed_by", ""),
            attachment_url=request.data.get("attachment_url", ""),
        )

        # Update task's last_completed_date and recompute next_due_date
        task.last_completed_date = completed_date
        task.next_due_date = compute_next_due_date_from_strategy(task, today=completed_date)
        task.save()

        # Return updated task
        serializer = MaintenanceTaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DueView(APIView):
    """Get tasks organized by due status."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get tasks grouped by status (overdue, due soon, upcoming)."""
        target_date_str = request.query_params.get("date")
        if target_date_str:
            try:
                today = parse_date(target_date_str)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            today = date.today()

        # Get active, non-archived tasks
        tasks = MaintenanceTask.objects.filter(
            user=request.user, is_active=True, is_archived=False
        ).select_related("asset")

        # Organize by status
        overdue = []
        due_soon = []
        upcoming = []

        for task in tasks:
            if task.next_due_date is None:
                continue

            task_status = compute_status(task.next_due_date, today=today, grace_days=task.grace_days)

            serialized = DueTaskSerializer(task).data
            if task_status == "OVERDUE":
                overdue.append(serialized)
            elif task_status == "DUE_SOON":
                due_soon.append(serialized)
            elif task_status == "UPCOMING":
                upcoming.append(serialized)

        # Sort each group by due date
        overdue.sort(key=lambda x: x["next_due_date"])
        due_soon.sort(key=lambda x: x["next_due_date"])
        upcoming.sort(key=lambda x: x["next_due_date"])

        return Response(
            {
                "today": str(today),
                "overdue": overdue,
                "due_soon": due_soon,
                "upcoming": upcoming,
            }
        )
