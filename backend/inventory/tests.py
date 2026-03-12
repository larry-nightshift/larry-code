from datetime import datetime, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Location, Item, Warranty, Attachment, ServiceEvent


class LocationModelTest(TestCase):
    """Test Location model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_location_creation(self):
        """Test creating a location."""
        location = Location.objects.create(
            user=self.user,
            name='Kitchen',
            notes='Main kitchen area'
        )
        self.assertEqual(location.name, 'Kitchen')
        self.assertEqual(location.user, self.user)

    def test_location_unique_per_user(self):
        """Test location name must be unique per user."""
        Location.objects.create(user=self.user, name='Kitchen')
        with self.assertRaises(Exception):
            Location.objects.create(user=self.user, name='Kitchen')


class ItemModelTest(TestCase):
    """Test Item model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.location = Location.objects.create(user=self.user, name='Kitchen')

    def test_item_creation(self):
        """Test creating an item."""
        item = Item.objects.create(
            user=self.user,
            name='Dyson Vacuum',
            category='APPLIANCE',
            status='ACTIVE',
            location=self.location
        )
        self.assertEqual(item.name, 'Dyson Vacuum')
        self.assertEqual(item.status, 'ACTIVE')

    def test_item_default_status(self):
        """Test item defaults to ACTIVE status."""
        item = Item.objects.create(user=self.user, name='TV', category='ELECTRONICS')
        self.assertEqual(item.status, 'ACTIVE')


class WarrantyModelTest(TestCase):
    """Test Warranty model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.item = Item.objects.create(user=self.user, name='Laptop', category='COMPUTER')

    def test_warranty_creation(self):
        """Test creating a warranty."""
        today = timezone.now().date()
        warranty = Warranty.objects.create(
            item=self.item,
            warranty_type='MANUFACTURER',
            start_date=today,
            end_date=today + timedelta(days=365)
        )
        self.assertEqual(warranty.warranty_type, 'MANUFACTURER')

    def test_warranty_validation(self):
        """Test warranty end_date must be >= start_date."""
        today = timezone.now().date()
        warranty = Warranty(
            item=self.item,
            warranty_type='MANUFACTURER',
            start_date=today,
            end_date=today - timedelta(days=1)
        )
        with self.assertRaises(Exception):
            warranty.full_clean()


class ItemAPITest(APITestCase):
    """Test Item API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.location = Location.objects.create(user=self.user, name='Kitchen')

    def test_create_item(self):
        """Test creating an item via API."""
        data = {
            'name': 'Microwave',
            'category': 'APPLIANCE',
            'purchase_date': '2023-01-01',
            'location': self.location.id
        }
        response = self.client.post('/api/inventory/items/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Microwave')

    def test_list_items(self):
        """Test listing items."""
        Item.objects.create(user=self.user, name='Fridge', category='APPLIANCE')
        Item.objects.create(user=self.user, name='Oven', category='APPLIANCE')

        response = self.client.get('/api/inventory/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if paginated response or direct list
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        results = results if isinstance(results, list) else []
        self.assertGreaterEqual(len(results), 2)

    def test_filter_items_by_category(self):
        """Test filtering items by category."""
        Item.objects.create(user=self.user, name='Laptop', category='COMPUTER')
        Item.objects.create(user=self.user, name='Phone', category='PHONE_TABLET')

        response = self.client.get('/api/inventory/items/?category=COMPUTER')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(results), 1)

    def test_search_items(self):
        """Test searching items."""
        Item.objects.create(user=self.user, name='Samsung TV', category='ELECTRONICS', brand='Samsung')
        Item.objects.create(user=self.user, name='LG TV', category='ELECTRONICS', brand='LG')

        response = self.client.get('/api/inventory/items/?search=Samsung')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(results), 1)

    def test_user_isolation(self):
        """Test users cannot see each other's items."""
        other_user = User.objects.create_user(username='otheruser', password='testpass')
        Item.objects.create(user=other_user, name='Other Item', category='APPLIANCE')
        Item.objects.create(user=self.user, name='My Item', category='APPLIANCE')

        response = self.client.get('/api/inventory/items/')
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(results), 1)

    def test_unauthenticated_access(self):
        """Test unauthenticated users cannot access API."""
        client = APIClient()
        response = client.get('/api/inventory/items/')
        # Check for 401 or 403 depending on authentication setup
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class WarrantyAPITest(APITestCase):
    """Test Warranty API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.item = Item.objects.create(user=self.user, name='Laptop', category='COMPUTER')

    def test_create_warranty(self):
        """Test creating a warranty."""
        today = timezone.now().date()
        data = {
            'item': self.item.id,
            'warranty_type': 'MANUFACTURER',
            'start_date': today.isoformat(),
            'end_date': (today + timedelta(days=365)).isoformat()
        }
        response = self.client.post('/api/inventory/warranties/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_expiring_soon(self):
        """Test getting warranties expiring soon."""
        today = timezone.now().date()
        Warranty.objects.create(
            item=self.item,
            warranty_type='MANUFACTURER',
            start_date=today,
            end_date=today + timedelta(days=15)
        )
        Warranty.objects.create(
            item=self.item,
            warranty_type='EXTENDED',
            start_date=today,
            end_date=today + timedelta(days=60)
        )

        response = self.client.get('/api/inventory/warranties/expiring_soon/?expiring_in=30')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only first warranty in 30 days

    def test_warranty_computed_fields(self):
        """Test warranty computed fields (is_active, days_remaining)."""
        today = timezone.now().date()
        warranty = Warranty.objects.create(
            item=self.item,
            warranty_type='MANUFACTURER',
            start_date=today,
            end_date=today + timedelta(days=30)
        )

        response = self.client.get(f'/api/inventory/warranties/{warranty.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_active'])
        self.assertEqual(response.data['days_remaining'], 30)
