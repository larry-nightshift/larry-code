from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from .models import Post


class PostModelTestCase(TestCase):
    """Test cases for Post model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_create_post(self):
        """Test creating a post."""
        post = Post.objects.create(
            user=self.user,
            title='Test Post',
            slug='test-post',
            body_markdown='# Hello\n\nThis is a test post.',
            excerpt='This is a test post.',
            published=True
        )
        self.assertEqual(post.title, 'Test Post')
        self.assertEqual(post.slug, 'test-post')
        self.assertTrue(post.published)

    def test_post_str(self):
        """Test Post __str__ method."""
        post = Post.objects.create(
            user=self.user,
            title='Test Post',
            slug='test-post',
            body_markdown='Test content'
        )
        self.assertEqual(str(post), 'Test Post')

    def test_post_default_not_published(self):
        """Test that posts default to unpublished."""
        post = Post.objects.create(
            user=self.user,
            title='Draft Post',
            slug='draft-post',
            body_markdown='Draft content'
        )
        self.assertFalse(post.published)


class PostAPITestCase(APITestCase):
    """Test cases for Post API endpoints."""

    def setUp(self):
        """Set up test data and client."""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_posts(self):
        """Test GET /api/posts/ - list all posts."""
        Post.objects.create(
            user=self.user,
            title='Post 1',
            slug='post-1',
            body_markdown='Content 1'
        )
        Post.objects.create(
            user=self.user,
            title='Post 2',
            slug='post-2',
            body_markdown='Content 2'
        )

        response = self.client.get('/api/posts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_post(self):
        """Test POST /api/posts/ - create a new post."""
        data = {
            'title': 'New Post',
            'slug': 'new-post',
            'body_markdown': '# Title\n\nContent here.',
            'excerpt': 'This is a new post.',
            'published': False
        }

        response = self.client.post('/api/posts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Post')
        self.assertEqual(response.data['slug'], 'new-post')

    def test_get_post_detail(self):
        """Test GET /api/posts/{id}/ - get specific post."""
        post = Post.objects.create(
            user=self.user,
            title='Detail Post',
            slug='detail-post',
            body_markdown='# Test\n\nContent.'
        )

        response = self.client.get(f'/api/posts/{post.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Detail Post')
        self.assertIn('body_html', response.data)

    def test_update_post(self):
        """Test PATCH /api/posts/{id}/ - update post."""
        post = Post.objects.create(
            user=self.user,
            title='Original Title',
            slug='original-slug',
            body_markdown='Original content'
        )

        data = {'title': 'Updated Title', 'published': True}
        response = self.client.patch(f'/api/posts/{post.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
        self.assertTrue(response.data['published'])

    def test_delete_post(self):
        """Test DELETE /api/posts/{id}/ - delete post."""
        post = Post.objects.create(
            user=self.user,
            title='To Delete',
            slug='to-delete',
            body_markdown='Content'
        )

        response = self.client.delete(f'/api/posts/{post.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(id=post.id).exists())

    def test_export_site_no_published_posts(self):
        """Test POST /api/site/export/ - no published posts."""
        response = self.client.post('/api/site/export/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_export_site_with_published_posts(self):
        """Test POST /api/site/export/ - with published posts."""
        Post.objects.create(
            user=self.user,
            title='Published Post 1',
            slug='published-1',
            body_markdown='# Content\n\nPost 1',
            excerpt='Excerpt 1',
            published=True
        )
        Post.objects.create(
            user=self.user,
            title='Published Post 2',
            slug='published-2',
            body_markdown='# Content\n\nPost 2',
            excerpt='Excerpt 2',
            published=True
        )

        response = self.client.post('/api/site/export/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/zip')

    def test_slug_uniqueness(self):
        """Test that slug must be unique."""
        Post.objects.create(
            user=self.user,
            title='First Post',
            slug='unique-slug',
            body_markdown='Content'
        )

        data = {
            'title': 'Second Post',
            'slug': 'unique-slug',
            'body_markdown': 'Content'
        }
        response = self.client.post('/api/posts/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_isolation(self):
        """Test that users can only see their own posts."""
        other_user = User.objects.create_user(
            username='otheruser',
            password='otherpass123'
        )

        post_user1 = Post.objects.create(
            user=self.user,
            title='User 1 Post',
            slug='user1-post',
            body_markdown='Content'
        )
        post_user2 = Post.objects.create(
            user=other_user,
            title='User 2 Post',
            slug='user2-post',
            body_markdown='Content'
        )

        response = self.client.get('/api/posts/')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(post_user1.id))

    def test_markdown_rendering(self):
        """Test that markdown is properly rendered to HTML."""
        post = Post.objects.create(
            user=self.user,
            title='Markdown Test',
            slug='markdown-test',
            body_markdown='# Heading\n\n**Bold** text'
        )

        response = self.client.get(f'/api/posts/{post.id}/')
        html = response.data['body_html']
        self.assertIn('<h1>Heading</h1>', html)
        self.assertIn('<strong>Bold</strong>', html)
