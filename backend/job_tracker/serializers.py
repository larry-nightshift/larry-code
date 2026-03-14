from rest_framework import serializers
from .models import (
    Company,
    Application,
    Contact,
    ApplicationContact,
    Activity,
    Reminder,
    InterviewPrepNote,
)
from django.utils import timezone
from datetime import timedelta


class CompanySerializer(serializers.ModelSerializer):
    application_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "website",
            "industry",
            "location",
            "notes",
            "application_count",
            "created_at",
            "updated_at",
        ]

    def get_application_count(self, obj):
        return obj.applications.count()


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "role_at_company",
            "linkedin_url",
            "notes",
            "company",
            "created_at",
            "updated_at",
        ]


class ApplicationContactSerializer(serializers.ModelSerializer):
    contact = ContactSerializer(read_only=True)
    contact_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ApplicationContact
        fields = ["contact", "contact_id", "created_at"]

    def create(self, validated_data):
        contact_id = validated_data.pop("contact_id")
        application = self.context["application"]
        return ApplicationContact.objects.create(
            application=application, contact_id=contact_id
        )


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            "id",
            "activity_type",
            "title",
            "description",
            "activity_date",
            "is_system",
            "created_at",
        ]


class ReminderSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()
    days_until_due = serializers.SerializerMethodField()

    class Meta:
        model = Reminder
        fields = [
            "id",
            "application",
            "reminder_date",
            "title",
            "notes",
            "is_completed",
            "completed_at",
            "is_overdue",
            "days_until_due",
            "created_at",
        ]

    def get_is_overdue(self, obj):
        if obj.is_completed:
            return False
        return obj.reminder_date < timezone.now().date()

    def get_days_until_due(self, obj):
        if obj.is_completed:
            return None
        delta = obj.reminder_date - timezone.now().date()
        return delta.days


class InterviewPrepNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewPrepNote
        fields = [
            "id",
            "application",
            "category",
            "title",
            "content",
            "created_at",
            "updated_at",
        ]


class ApplicationListSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all())
    location_type_display = serializers.CharField(
        source="get_location_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    active_reminders_count = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "company",
            "company_name",
            "role_title",
            "status",
            "status_display",
            "priority",
            "location_type",
            "location_type_display",
            "salary_min",
            "salary_max",
            "salary_currency",
            "applied_date",
            "source",
            "active_reminders_count",
            "created_at",
            "updated_at",
        ]

    def get_active_reminders_count(self, obj):
        return obj.reminders.filter(is_completed=False).count()


class ApplicationDetailSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True)
    contacts = ApplicationContactSerializer(read_only=True, many=True)
    recent_activities = serializers.SerializerMethodField()
    active_reminders = serializers.SerializerMethodField()
    prep_notes_count = serializers.SerializerMethodField()
    location_type_display = serializers.CharField(
        source="get_location_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Application
        fields = [
            "id",
            "company",
            "company_id",
            "role_title",
            "job_url",
            "salary_min",
            "salary_max",
            "salary_currency",
            "location_type",
            "location_type_display",
            "status",
            "status_display",
            "priority",
            "source",
            "applied_date",
            "notes",
            "contacts",
            "recent_activities",
            "active_reminders",
            "prep_notes_count",
            "created_at",
            "updated_at",
        ]

    def get_recent_activities(self, obj):
        activities = obj.activities.all()[:5]
        return ActivitySerializer(activities, many=True).data

    def get_active_reminders(self, obj):
        reminders = obj.reminders.filter(is_completed=False)
        return ReminderSerializer(reminders, many=True).data

    def get_prep_notes_count(self, obj):
        return obj.prep_notes.count()

    def validate_salary(self, data):
        salary_min = data.get("salary_min")
        salary_max = data.get("salary_max")
        if salary_min is not None and salary_max is not None:
            if salary_min > salary_max:
                raise serializers.ValidationError("Min salary cannot exceed max salary")
        return data


class DashboardSerializer(serializers.Serializer):
    pipeline_counts = serializers.DictField()
    upcoming_reminders = ReminderSerializer(many=True)
    recent_activities = ActivitySerializer(many=True)
    stats = serializers.DictField()
