import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Location(models.Model):
    """User-defined locations to organize inventory items."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'is_archived']),
        ]

    def __str__(self):
        return self.name


class Item(models.Model):
    """Household asset or item to track."""

    CATEGORY_CHOICES = [
        ('APPLIANCE', 'Appliance'),
        ('ELECTRONICS', 'Electronics'),
        ('COMPUTER', 'Computer'),
        ('PHONE_TABLET', 'Phone/Tablet'),
        ('TOOL', 'Tool'),
        ('FURNITURE', 'Furniture'),
        ('VEHICLE', 'Vehicle'),
        ('MISC', 'Miscellaneous'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SOLD', 'Sold'),
        ('DISCARDED', 'Discarded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    brand = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    vendor = models.CharField(max_length=100, blank=True)
    location = models.ForeignKey(Location, null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status', 'is_archived']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return self.name


class Warranty(models.Model):
    """Warranty coverage for an item."""

    WARRANTY_TYPE_CHOICES = [
        ('MANUFACTURER', 'Manufacturer'),
        ('EXTENDED', 'Extended'),
        ('STORE', 'Store'),
        ('OTHER', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='warranties')
    provider = models.CharField(max_length=100, blank=True)
    warranty_type = models.CharField(max_length=20, choices=WARRANTY_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    terms = models.TextField(blank=True)
    claim_instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['end_date']
        indexes = [
            models.Index(fields=['item', 'end_date']),
        ]

    def __str__(self):
        return f"{self.item.name} - {self.warranty_type}"

    def clean(self):
        """Validate end_date >= start_date."""
        from django.core.exceptions import ValidationError
        if self.end_date < self.start_date:
            raise ValidationError('End date must be after start date.')


class Attachment(models.Model):
    """Receipt or document attachment for an item."""

    ATTACHMENT_TYPE_CHOICES = [
        ('URL', 'URL'),
        ('FILE', 'File'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='attachments')
    attachment_type = models.CharField(max_length=10, choices=ATTACHMENT_TYPE_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    url = models.URLField(blank=True)
    file = models.FileField(upload_to='inventory_attachments/%Y/%m/', blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title or f"{self.item.name} - {self.attachment_type}"


class ServiceEvent(models.Model):
    """Maintenance or service event for an item."""

    EVENT_TYPE_CHOICES = [
        ('REPAIR', 'Repair'),
        ('MAINTENANCE', 'Maintenance'),
        ('INSTALL', 'Install'),
        ('INSPECTION', 'Inspection'),
        ('OTHER', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='service_events')
    occurred_at = models.DateTimeField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    vendor = models.CharField(max_length=100, blank=True)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-occurred_at']
        indexes = [
            models.Index(fields=['item', '-occurred_at']),
        ]

    def __str__(self):
        return f"{self.item.name} - {self.event_type or 'Service'} ({self.occurred_at.date()})"
