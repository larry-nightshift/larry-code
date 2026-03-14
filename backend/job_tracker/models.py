import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Company(models.Model):
    """Company that user is applying to."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_tracker_companies"
    )
    name = models.CharField(max_length=200)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["user", "name"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["user", "name"], name="unique_company_per_user")
        ]

    def __str__(self):
        return self.name


class Application(models.Model):
    """Job application at a company."""

    STATUS_WISHLIST = "WISHLIST"
    STATUS_APPLIED = "APPLIED"
    STATUS_PHONE_SCREEN = "PHONE_SCREEN"
    STATUS_INTERVIEW = "INTERVIEW"
    STATUS_OFFER = "OFFER"
    STATUS_ACCEPTED = "ACCEPTED"
    STATUS_REJECTED = "REJECTED"
    STATUS_WITHDRAWN = "WITHDRAWN"
    STATUS_GHOSTED = "GHOSTED"

    STATUS_CHOICES = [
        (STATUS_WISHLIST, "Wishlist"),
        (STATUS_APPLIED, "Applied"),
        (STATUS_PHONE_SCREEN, "Phone Screen"),
        (STATUS_INTERVIEW, "Interview"),
        (STATUS_OFFER, "Offer"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_WITHDRAWN, "Withdrawn"),
        (STATUS_GHOSTED, "Ghosted"),
    ]

    LOCATION_ONSITE = "ONSITE"
    LOCATION_REMOTE = "REMOTE"
    LOCATION_HYBRID = "HYBRID"

    LOCATION_CHOICES = [
        (LOCATION_ONSITE, "On-site"),
        (LOCATION_REMOTE, "Remote"),
        (LOCATION_HYBRID, "Hybrid"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_tracker_applications"
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="applications")
    role_title = models.CharField(max_length=300)
    job_url = models.URLField(blank=True)
    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    salary_currency = models.CharField(max_length=3, default="CAD")
    location_type = models.CharField(max_length=10, choices=LOCATION_CHOICES, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_WISHLIST)
    priority = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    source = models.CharField(max_length=200, blank=True)
    applied_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.role_title} at {self.company.name}"

    def clean(self):
        """Validate salary constraints."""
        from django.core.exceptions import ValidationError

        if self.salary_min is not None and self.salary_max is not None:
            if self.salary_min > self.salary_max:
                raise ValidationError({"salary_min": "Min salary cannot exceed max salary"})


class Contact(models.Model):
    """Person at a company (recruiter, hiring manager, etc.)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_tracker_contacts"
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    role_at_company = models.CharField(max_length=200, blank=True)
    linkedin_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["user", "company"]),
        ]

    def __str__(self):
        return self.name


class ApplicationContact(models.Model):
    """M2M through table linking applications to contacts."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="contacts"
    )
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("application", "contact")
        ordering = ["contact__name"]

    def __str__(self):
        return f"{self.contact.name} on {self.application.role_title}"


class Activity(models.Model):
    """Timeline entry for an application."""

    TYPE_NOTE = "NOTE"
    TYPE_APPLIED = "APPLIED"
    TYPE_EMAIL_SENT = "EMAIL_SENT"
    TYPE_EMAIL_RECEIVED = "EMAIL_RECEIVED"
    TYPE_PHONE_CALL = "PHONE_CALL"
    TYPE_INTERVIEW = "INTERVIEW"
    TYPE_FOLLOW_UP = "FOLLOW_UP"
    TYPE_OFFER = "OFFER"
    TYPE_OTHER = "OTHER"

    ACTIVITY_TYPE_CHOICES = [
        (TYPE_NOTE, "Note"),
        (TYPE_APPLIED, "Applied"),
        (TYPE_EMAIL_SENT, "Email Sent"),
        (TYPE_EMAIL_RECEIVED, "Email Received"),
        (TYPE_PHONE_CALL, "Phone Call"),
        (TYPE_INTERVIEW, "Interview"),
        (TYPE_FOLLOW_UP, "Follow Up"),
        (TYPE_OFFER, "Offer"),
        (TYPE_OTHER, "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_tracker_activities"
    )
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="activities"
    )
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    activity_date = models.DateTimeField()
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-activity_date", "-created_at"]
        indexes = [
            models.Index(fields=["application", "-activity_date"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} on {self.application.role_title}"


class Reminder(models.Model):
    """Follow-up reminder for an application."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_tracker_reminders"
    )
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="reminders"
    )
    reminder_date = models.DateField()
    title = models.CharField(max_length=300)
    notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["reminder_date"]
        indexes = [
            models.Index(fields=["user", "is_completed", "reminder_date"]),
            models.Index(fields=["user", "-reminder_date"]),
        ]

    def __str__(self):
        return f"{self.title} on {self.reminder_date}"


class InterviewPrepNote(models.Model):
    """Interview preparation notes."""

    CATEGORY_COMPANY_RESEARCH = "COMPANY_RESEARCH"
    CATEGORY_ROLE_NOTES = "ROLE_NOTES"
    CATEGORY_QUESTIONS_TO_ASK = "QUESTIONS_TO_ASK"
    CATEGORY_TECH_PREP = "TECH_PREP"
    CATEGORY_BEHAVIORAL = "BEHAVIORAL"
    CATEGORY_OTHER = "OTHER"

    CATEGORY_CHOICES = [
        (CATEGORY_COMPANY_RESEARCH, "Company Research"),
        (CATEGORY_ROLE_NOTES, "Role Notes"),
        (CATEGORY_QUESTIONS_TO_ASK, "Questions to Ask"),
        (CATEGORY_TECH_PREP, "Tech Prep"),
        (CATEGORY_BEHAVIORAL, "Behavioral"),
        (CATEGORY_OTHER, "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_tracker_prep_notes"
    )
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="prep_notes"
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=300)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "-updated_at"]
        indexes = [
            models.Index(fields=["application", "category"]),
            models.Index(fields=["user", "-updated_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"
