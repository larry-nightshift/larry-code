import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Contact(models.Model):
    """A contact with basic info and interaction history."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    company = models.CharField(max_length=200, blank=True, null=True)
    tags = models.CharField(
        max_length=500,
        blank=True,
        help_text="Comma-separated tags"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'full_name']),
        ]

    def __str__(self):
        return self.full_name


class Interaction(models.Model):
    """A record of interaction with a contact."""

    MEDIUM_CHOICES = [
        ('call', 'Phone Call'),
        ('email', 'Email'),
        ('in-person', 'In-Person'),
        ('text', 'Text'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='interactions')
    date = models.DateTimeField(default=timezone.now)
    medium = models.CharField(max_length=20, choices=MEDIUM_CHOICES)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['contact', '-date']),
        ]

    def __str__(self):
        return f"{self.contact.full_name} - {self.get_medium_display()} on {self.date.date()}"


class Reminder(models.Model):
    """A follow-up reminder, optionally tied to a contact."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reminders'
    )
    due_at = models.DateTimeField()
    message = models.CharField(max_length=500)
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_at']
        indexes = [
            models.Index(fields=['user', 'done', 'due_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.message} - Due {self.due_at.strftime('%Y-%m-%d %H:%M')}"

    def is_overdue(self):
        """Check if reminder is past due."""
        return not self.done and timezone.now() > self.due_at

    def days_until_due(self):
        """Get number of days until due."""
        if self.done:
            return None
        delta = (self.due_at.date() - timezone.now().date()).days
        return max(0, delta)
