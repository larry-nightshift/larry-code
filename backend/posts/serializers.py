import markdown
import bleach
from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    """Serializer for reading posts with rendered HTML."""

    body_html = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'slug',
            'body_markdown',
            'body_html',
            'excerpt',
            'metadata',
            'published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'body_html']

    def get_body_html(self, obj):
        """Render markdown to HTML and sanitize."""
        if not obj.body_markdown:
            return ''
        html = markdown.markdown(obj.body_markdown)
        # Sanitize HTML to prevent XSS
        allowed_tags = [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table',
            'thead', 'tbody', 'tr', 'th', 'td'
        ]
        allowed_attrs = {
            'a': ['href', 'title'],
            'img': ['src', 'alt', 'title'],
        }
        sanitized = bleach.clean(
            html,
            tags=allowed_tags,
            attributes=allowed_attrs,
            strip=True
        )
        return sanitized


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating posts."""

    class Meta:
        model = Post
        fields = [
            'title',
            'slug',
            'body_markdown',
            'excerpt',
            'metadata',
            'published',
        ]

    def validate_slug(self, value):
        """Validate slug is unique or belongs to the current post."""
        request = self.context.get('request')
        queryset = Post.objects.filter(slug=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('A post with this slug already exists.')

        return value

    def validate_body_markdown(self, value):
        """Ensure body_markdown is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Body cannot be empty.')
        return value

    def validate_title(self, value):
        """Ensure title is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Title cannot be empty.')
        return value
