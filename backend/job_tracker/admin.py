from django.contrib import admin
from .models import (
    Company,
    Application,
    Contact,
    ApplicationContact,
    Activity,
    Reminder,
    InterviewPrepNote,
)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "industry", "location", "user")
    list_filter = ("created_at", "user")
    search_fields = ("name", "industry")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("role_title", "company", "status", "priority", "user")
    list_filter = ("status", "priority", "location_type", "created_at", "user")
    search_fields = ("role_title", "company__name")
    readonly_fields = ("id", "created_at", "updated_at")
    fieldsets = (
        (
            "Basic Info",
            {
                "fields": ("id", "user", "company", "role_title", "status", "priority")
            },
        ),
        (
            "Details",
            {
                "fields": (
                    "job_url",
                    "salary_min",
                    "salary_max",
                    "salary_currency",
                    "location_type",
                    "source",
                    "applied_date",
                )
            },
        ),
        ("Notes", {"fields": ("notes",), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "email", "role_at_company", "user")
    list_filter = ("company", "user", "created_at")
    search_fields = ("name", "email", "company__name")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(ApplicationContact)
class ApplicationContactAdmin(admin.ModelAdmin):
    list_display = ("contact", "application", "created_at")
    list_filter = ("created_at",)
    search_fields = ("contact__name", "application__role_title")
    readonly_fields = ("id", "created_at")


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "application", "activity_type", "activity_date", "is_system")
    list_filter = ("activity_type", "is_system", "activity_date", "user")
    search_fields = ("title", "application__role_title")
    readonly_fields = ("id", "created_at")


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ("title", "application", "reminder_date", "is_completed", "user")
    list_filter = ("is_completed", "reminder_date", "user")
    search_fields = ("title", "application__role_title")
    readonly_fields = ("id", "created_at")


@admin.register(InterviewPrepNote)
class InterviewPrepNoteAdmin(admin.ModelAdmin):
    list_display = ("title", "application", "category", "user")
    list_filter = ("category", "user", "created_at")
    search_fields = ("title", "application__role_title")
    readonly_fields = ("id", "created_at", "updated_at")
