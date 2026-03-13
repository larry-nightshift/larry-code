from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from .models import Link, Tag, Collection, ReadingQueueItem
from .utils import normalize_url


class URLNormalizationTest(TestCase):
    """Test URL normalization."""

    def test_normalize_url_removes_tracking_params(self):
        url = 'https://example.com/page?utm_source=test&utm_medium=social&id=123'
        normalized, hostname = normalize_url(url)
        self.assertNotIn('utm_source', normalized)
        self.assertIn('id=123', normalized)
        self.assertEqual(hostname, 'example.com')

    def test_normalize_url_lowercase_hostname(self):
        url = 'https://Example.COM/page'
        normalized, hostname = normalize_url(url)
        self.assertEqual(hostname, 'example.com')
        self.assertIn('example.com', normalized)

    def test_normalize_url_removes_trailing_slash(self):
        url = 'https://example.com/page/'
        normalized, _ = normalize_url(url)
        self.assertFalse(normalized.endswith('/page/'))


class LinkAPITest(APITestCase):
    """Test Link API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='test123')
        self.client.force_authenticate(user=self.user)

    def test_create_link(self):
        data = {
            'url': 'https://example.com/article',
            'title': 'Example Article',
            'description': 'A test article'
        }
        response = self.client.post('/api/links/links/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Link.objects.count(), 1)
        self.assertEqual(Link.objects.first().user, self.user)

    def test_duplicate_url_returns_409(self):
        Link.objects.create(
            user=self.user,
            url='https://example.com/article',
            title='Original',
            url_normalized='https://example.com/article',
            hostname='example.com'
        )
        data = {
            'url': 'https://example.com/article',
            'title': 'Duplicate'
        }
        response = self.client.post('/api/links/links/', data)
        self.assertEqual(response.status_code, 409)
        self.assertIn('existing_link', response.data)

    def test_list_links_filtered_by_user(self):
        other_user = User.objects.create_user(username='other', password='test123')
        Link.objects.create(
            user=self.user,
            url='https://example.com/article1',
            title='User Article',
            url_normalized='https://example.com/article1',
            hostname='example.com'
        )
        Link.objects.create(
            user=other_user,
            url='https://example.com/article2',
            title='Other Article',
            url_normalized='https://example.com/article2',
            hostname='example.com'
        )
        response = self.client.get('/api/links/links/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'User Article')

    def test_search_links(self):
        Link.objects.create(
            user=self.user,
            url='https://example.com/article',
            title='Example Article',
            url_normalized='https://example.com/article',
            hostname='example.com'
        )
        response = self.client.get('/api/links/links/?q=Example')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)

    def test_delete_link(self):
        link = Link.objects.create(
            user=self.user,
            url='https://example.com/article',
            title='Article',
            url_normalized='https://example.com/article',
            hostname='example.com'
        )
        response = self.client.delete(f'/api/links/links/{link.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Link.objects.count(), 0)


class TagAPITest(APITestCase):
    """Test Tag API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='test123')
        self.client.force_authenticate(user=self.user)

    def test_create_tag(self):
        data = {'name': 'Important', 'color': '#FF5733'}
        response = self.client.post('/api/links/tags/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Tag.objects.count(), 1)
        self.assertEqual(Tag.objects.first().user, self.user)

    def test_tag_name_normalized_on_create(self):
        data = {'name': '  Important  '}
        response = self.client.post('/api/links/tags/', data)
        self.assertEqual(response.status_code, 201)
        tag = Tag.objects.first()
        self.assertEqual(tag.name_normalized, 'important')


class ReadingQueueAPITest(APITestCase):
    """Test Reading Queue API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='test123')
        self.client.force_authenticate(user=self.user)
        self.link = Link.objects.create(
            user=self.user,
            url='https://example.com/article',
            title='Article',
            url_normalized='https://example.com/article',
            hostname='example.com'
        )

    def test_queue_link(self):
        data = {'link_id': str(self.link.id)}
        response = self.client.post('/api/links/queue/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ReadingQueueItem.objects.count(), 1)
        queue_item = ReadingQueueItem.objects.first()
        self.assertEqual(queue_item.status, 'QUEUED')
        self.assertEqual(queue_item.priority, 3)

    def test_queue_link_idempotent(self):
        # Create first time
        data = {'link_id': str(self.link.id), 'priority': 4}
        response1 = self.client.post('/api/links/queue/', data)
        self.assertEqual(response1.status_code, 201)

        # Queue again - should update priority
        data = {'link_id': str(self.link.id), 'priority': 5}
        response2 = self.client.post('/api/links/queue/', data)
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(ReadingQueueItem.objects.count(), 1)
        self.assertEqual(ReadingQueueItem.objects.first().priority, 5)

    def test_update_queue_status(self):
        queue_item = ReadingQueueItem.objects.create(
            user=self.user,
            link=self.link,
            status='QUEUED'
        )
        data = {'status': 'DONE'}
        response = self.client.patch(f'/api/links/queue/{queue_item.id}/', data)
        self.assertEqual(response.status_code, 200)
        queue_item.refresh_from_db()
        self.assertEqual(queue_item.status, 'DONE')
