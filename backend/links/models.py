import uuid
from django.db import models
from django.conf import settings


class Link(models.Model):
    """A saved link with metadata and optional collection/tags."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    url = models.URLField(max_length=2000)
    url_normalized = models.CharField(max_length=2000, db_index=True)
    title = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    hostname = models.CharField(max_length=255, blank=True, db_index=True)
    favicon_url = models.URLField(max_length=2000, blank=True)
    site_name = models.CharField(max_length=255, blank=True)
    preview_image_url = models.URLField(max_length=2000, blank=True)
    collection = models.ForeignKey(
        'Collection',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='links'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'url_normalized']),
            models.Index(fields=['user', 'hostname']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'url_normalized'],
                name='unique_user_link'
            ),
        ]

    def __str__(self):
        return self.title or self.url


class Tag(models.Model):
    """A tag that can be applied to links."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    name_normalized = models.CharField(max_length=100, db_index=True)
    color = models.CharField(
        max_length=7,
        blank=True,
        help_text="Hex color code (e.g. #FF5733)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'name_normalized']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'name_normalized'],
                name='unique_user_tag'
            ),
        ]

    def __str__(self):
        return self.name


class LinkTag(models.Model):
    """Through table for Link-Tag many-to-many relationship."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    link = models.ForeignKey(Link, on_delete=models.CASCADE, related_name='tag_items')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='link_items')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['link', 'tag'],
                name='unique_link_tag'
            ),
        ]

    def __str__(self):
        return f"{self.link.title} - {self.tag.name}"


class Collection(models.Model):
    """A collection is an optional grouping of links."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'name']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'name'],
                name='unique_user_collection'
            ),
        ]

    def __str__(self):
        return self.name


class ReadingQueueItem(models.Model):
    """A link in the reading queue with status and priority."""

    STATUS_CHOICES = [
        ('QUEUED', 'Queued'),
        ('READING', 'Reading'),
        ('DONE', 'Done'),
        ('SKIPPED', 'Skipped'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    link = models.OneToOneField(
        Link,
        on_delete=models.CASCADE,
        related_name='queue_item'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='QUEUED'
    )
    priority = models.PositiveSmallIntegerField(default=3)  # 1-5 scale
    queued_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-priority', 'due_date', '-queued_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', '-priority']),
        ]

    def __str__(self):
        return f"{self.link.title} - {self.get_status_display()}"
