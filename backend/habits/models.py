import uuid
from django.db import models
from django.conf import settings


class Habit(models.Model):
    SCHEDULE_DAILY = "DAILY"
    SCHEDULE_WEEKLY = "WEEKLY"
    SCHEDULE_CHOICES = [
        (SCHEDULE_DAILY, "Daily"),
        (SCHEDULE_WEEKLY, "Weekly"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="habits"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    schedule_type = models.CharField(max_length=10, choices=SCHEDULE_CHOICES)
    weekly_target = models.PositiveSmallIntegerField(null=True, blank=True)
    start_date = models.DateField()
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    color = models.CharField(max_length=20, blank=True, default="primary-500")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["user", "is_archived", "is_active"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.username})"

    def clean(self):
        """Validate weekly_target when schedule_type is WEEKLY."""
        from django.core.exceptions import ValidationError

        if self.schedule_type == self.SCHEDULE_WEEKLY:
            if self.weekly_target is None:
                raise ValidationError(
                    {"weekly_target": "Weekly target is required for weekly habits"}
                )
            if not (1 <= self.weekly_target <= 7):
                raise ValidationError(
                    {"weekly_target": "Weekly target must be between 1 and 7"}
                )
        elif self.weekly_target is not None:
            self.weekly_target = None


class HabitCheckin(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habit_checkins",
    )
    habit = models.ForeignKey(
        Habit, on_delete=models.CASCADE, related_name="checkins"
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("habit", "date")
        indexes = [
            models.Index(fields=["user", "date"]),
            models.Index(fields=["habit", "date"]),
            models.Index(fields=["user", "habit"]),
        ]

    def __str__(self):
        return f"{self.habit.name} - {self.date}"

    def clean(self):
        """Validate that check-in date is not before habit start date."""
        from django.core.exceptions import ValidationError

        if self.date < self.habit.start_date:
            raise ValidationError(
                {
                    "date": f"Check-in date cannot be before habit start date ({self.habit.start_date})"
                }
            )
