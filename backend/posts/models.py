import uuid
from django.db import models
from django.conf import settings


class Post(models.Model):
    """A markdown post that can be published or kept as draft."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    body_markdown = models.TextField()
    excerpt = models.TextField(blank=True, max_length=500)
    metadata = models.JSONField(default=dict, blank=True)  # Tags, date, etc.
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['published', '-created_at']),
        ]

    def __str__(self):
        return self.title
