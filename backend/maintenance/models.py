import uuid
from django.db import models
from django.conf import settings
from datetime import date


class Asset(models.Model):
    """Home asset or equipment requiring maintenance."""

    CATEGORY_CHOICES = [
        ("HVAC", "HVAC"),
        ("KITCHEN", "Kitchen"),
        ("PLUMBING", "Plumbing"),
        ("ELECTRICAL", "Electrical"),
        ("VEHICLE", "Vehicle"),
        ("OUTDOOR", "Outdoor"),
        ("OTHER", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="maintenance_assets"
    )
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    location = models.CharField(max_length=200, blank=True, default="")
    manufacturer = models.CharField(max_length=200, blank=True, default="")
    model_number = models.CharField(max_length=200, blank=True, default="")
    serial_number = models.CharField(max_length=200, blank=True, default="")
    purchase_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_archived", "category"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.category})"


class MaintenanceTask(models.Model):
    """Recurring maintenance task template."""

    RECURRENCE_EVERY_N_DAYS = "EVERY_N_DAYS"
    RECURRENCE_EVERY_N_WEEKS = "EVERY_N_WEEKS"
    RECURRENCE_EVERY_N_MONTHS = "EVERY_N_MONTHS"
    RECURRENCE_EVERY_N_YEARS = "EVERY_N_YEARS"

    RECURRENCE_CHOICES = [
        (RECURRENCE_EVERY_N_DAYS, "Every N days"),
        (RECURRENCE_EVERY_N_WEEKS, "Every N weeks"),
        (RECURRENCE_EVERY_N_MONTHS, "Every N months"),
        (RECURRENCE_EVERY_N_YEARS, "Every N years"),
    ]

    STRATEGY_FROM_START_DATE = "FROM_START_DATE"
    STRATEGY_FROM_LAST_COMPLETION = "FROM_LAST_COMPLETION"

    STRATEGY_CHOICES = [
        (STRATEGY_FROM_START_DATE, "From start date"),
        (STRATEGY_FROM_LAST_COMPLETION, "From last completion"),
    ]

    PRIORITY_LOW = "LOW"
    PRIORITY_MEDIUM = "MEDIUM"
    PRIORITY_HIGH = "HIGH"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH, "High"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="maintenance_tasks"
    )
    asset = models.ForeignKey(
        Asset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="maintenance_tasks",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    recurrence_type = models.CharField(max_length=20, choices=RECURRENCE_CHOICES)
    interval = models.PositiveSmallIntegerField()  # >= 1
    start_date = models.DateField()
    due_strategy = models.CharField(max_length=30, choices=STRATEGY_CHOICES)
    grace_days = models.PositiveSmallIntegerField(default=0)
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM
    )
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    last_completed_date = models.DateField(null=True, blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_archived", "is_active", "next_due_date"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.user.username})"

    def clean(self):
        """Validate task fields."""
        from django.core.exceptions import ValidationError

        if self.interval < 1:
            raise ValidationError({"interval": "Interval must be at least 1"})


class MaintenanceRecord(models.Model):
    """Completion history for a maintenance task."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="maintenance_records",
    )
    task = models.ForeignKey(
        MaintenanceTask, on_delete=models.CASCADE, related_name="records"
    )
    completed_date = models.DateField()
    notes = models.TextField(blank=True, default="")
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    performed_by = models.CharField(max_length=200, blank=True, default="")
    attachment_url = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-completed_date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "completed_date"]),
            models.Index(fields=["task", "completed_date"]),
        ]

    def __str__(self):
        return f"{self.task.title} - {self.completed_date}"
