from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from django.utils.timezone import now

from .models import WeatherSnapshot

User = get_user_model()


class WeatherSnapshotModelTest(TestCase):
    def setUp(self):
        self.snapshot = WeatherSnapshot.objects.create(
            location_name='Ottawa',
            lat=45.4215,
            lon=-75.6972,
            data={'temp': 20},
            fetched_at=now()
        )

    def test_create_weather_snapshot(self):
        self.assertEqual(self.snapshot.location_name, 'Ottawa')
        self.assertEqual(self.snapshot.lat, 45.4215)
        self.assertIsNotNone(self.snapshot.fetched_at)

    def test_is_fresh_true(self):
        """Test that recent snapshot is considered fresh."""
        self.assertTrue(self.snapshot.is_fresh(cache_minutes=30))

    def test_is_fresh_false(self):
        """Test that old snapshot is not fresh."""
        from datetime import timedelta
        old_snapshot = WeatherSnapshot.objects.create(
            location_name='Toronto',
            lat=43.6532,
            lon=-79.3832,
            data={'temp': 15},
            fetched_at=now() - timedelta(hours=1)
        )
        self.assertFalse(old_snapshot.is_fresh(cache_minutes=30))


class WeatherAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_access_denied(self):
        """Unauthenticated users cannot access weather."""
        client = APIClient()
        response = client.get('/api/weather/current/?location=ottawa')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    @patch('weather.views.WeatherViewSet.get_location_coordinates')
    @patch('weather.views.WeatherViewSet.fetch_weather')
    def test_get_weather_success(self, mock_fetch, mock_coords):
        """Test successful weather fetch."""
        mock_coords.return_value = (45.4215, -75.6972, 'Ottawa')
        mock_fetch.return_value = {
            'current': {
                'temperature_2m': 20,
                'weather_code': 0,
                'wind_speed_10m': 10,
                'precipitation': 0
            },
            'daily': {
                'temperature_2m_max': [25],
                'temperature_2m_min': [15],
                'precipitation_probability_max': [10]
            }
        }

        response = self.client.get('/api/weather/current/?location=ottawa')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['location'], 'Ottawa')
        self.assertEqual(response.data['temp'], 20)
        self.assertEqual(response.data['temp_high'], 25)
        self.assertEqual(response.data['temp_low'], 15)

    @patch('weather.views.WeatherViewSet.get_location_coordinates')
    def test_location_not_found(self, mock_coords):
        """Test handling of invalid location."""
        mock_coords.return_value = None

        response = self.client.get('/api/weather/current/?location=invalidlocation')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)

    @patch('weather.views.WeatherViewSet.get_location_coordinates')
    @patch('weather.views.WeatherViewSet.fetch_weather')
    def test_weather_fetch_failure(self, mock_fetch, mock_coords):
        """Test handling of API failure."""
        # Use a unique location that won't exist in DB
        mock_coords.return_value = (45.4215, -75.6972, 'TestLocationFailure')
        mock_fetch.return_value = None

        response = self.client.get('/api/weather/current/?location=testlocationfailure')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('error', response.data)

    def test_default_location_ottawa(self):
        """Test default location is ottawa."""
        with patch('weather.views.WeatherViewSet.get_location_coordinates') as mock_coords:
            with patch('weather.views.WeatherViewSet.fetch_weather') as mock_fetch:
                mock_coords.return_value = (45.4215, -75.6972, 'Ottawa')
                mock_fetch.return_value = {
                    'current': {'temperature_2m': 20, 'weather_code': 0, 'wind_speed_10m': 10, 'precipitation': 0},
                    'daily': {'temperature_2m_max': [25], 'temperature_2m_min': [15], 'precipitation_probability_max': [10]}
                }

                response = self.client.get('/api/weather/current/')
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                mock_coords.assert_called_with('ottawa')


class AuthAPITest(APITestCase):
    def setUp(self):
        self.username = 'testuser'
        self.password = 'testpass123'
        self.user = User.objects.create_user(username=self.username, password=self.password)
        self.client = APIClient()

    def test_login_success(self):
        """Test successful login."""
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.username)
        self.assertEqual(response.data['id'], self.user.id)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_missing_fields(self):
        """Test login with missing fields."""
        response = self.client.post('/api/auth/login/', {
            'username': self.username
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_success(self):
        """Test successful logout."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_unauthenticated(self):
        """Test logout without authentication."""
        response = self.client.post('/api/auth/logout/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_me_success(self):
        """Test get current user info."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.username)
        self.assertEqual(response.data['id'], self.user.id)

    def test_get_me_unauthenticated(self):
        """Test get user info without authentication."""
        response = self.client.get('/api/auth/me/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_session_created_after_login(self):
        """Test that session is created after login."""
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Session cookie should be set
        self.assertIn('sessionid', self.client.cookies)
