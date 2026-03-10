import os
import io
import zipfile
import markdown
import bleach
from datetime import datetime
from django.http import FileResponse
from django.template.loader import render_to_string
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Post
from .serializers import PostSerializer, PostCreateUpdateSerializer


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations on posts.
    - GET /api/posts/ -> list all user's posts
    - POST /api/posts/ -> create new post
    - GET /api/posts/{id}/ -> get specific post
    - PATCH /api/posts/{id}/ -> update post
    - DELETE /api/posts/{id}/ -> delete post
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter posts by current user."""
        return Post.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Use different serializers for read vs write."""
        if self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
        return PostSerializer

    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        """Associate post with current user."""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Update the post."""
        serializer.save()


class SiteExportView(viewsets.ViewSet):
    """
    Export all published posts as a static HTML site and return as ZIP.
    POST /api/posts/export/ -> download ZIP file
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export all published posts as HTML and return ZIP."""
        user = request.user
        published_posts = Post.objects.filter(user=user, published=True).order_by('-created_at')

        if not published_posts.exists():
            return Response(
                {'error': 'No published posts to export.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Create index.html
            posts_list = []
            for post in published_posts:
                posts_list.append({
                    'title': post.title,
                    'slug': post.slug,
                    'excerpt': post.excerpt,
                    'created_at': post.created_at.strftime('%Y-%m-%d'),
                })

            index_html = render_to_string('posts/index.html', {
                'posts': posts_list,
            })
            zip_file.writestr('index.html', index_html)

            # Create individual post pages
            for post in published_posts:
                post_html = render_to_string('posts/post.html', {
                    'post': {
                        'title': post.title,
                        'slug': post.slug,
                        'body_html': _render_post_html(post.body_markdown),
                        'created_at': post.created_at.strftime('%Y-%m-%d'),
                    },
                })
                filename = f'posts/{post.slug}.html'
                zip_file.writestr(filename, post_html)

            # Create CSS file
            css_content = render_to_string('posts/style.css')
            zip_file.writestr('style.css', css_content)

        # Prepare ZIP for download
        zip_buffer.seek(0)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'site_{timestamp}.zip'

        return FileResponse(
            zip_buffer,
            as_attachment=True,
            filename=filename,
            content_type='application/zip'
        )


def _render_post_html(markdown_text):
    """Render markdown to safe HTML."""
    if not markdown_text:
        return ''
    html = markdown.markdown(markdown_text)
    allowed_tags = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table',
        'thead', 'tbody', 'tr', 'th', 'td'
    ]
    allowed_attrs = {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title'],
    }
    return bleach.clean(
        html,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True
    )
