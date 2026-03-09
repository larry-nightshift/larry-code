from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now
from django.core.cache import cache
import requests

from .models import WeatherSnapshot
from .serializers import WeatherSerializer, WeatherDataSerializer


class WeatherViewSet(viewsets.ViewSet):
    """Weather API that fetches from Open-Meteo and caches results."""
    permission_classes = [IsAuthenticated]

    def get_location_coordinates(self, location: str):
        """Convert location name to coordinates using Open-Meteo Geocoding API."""
        try:
            response = requests.get(
                'https://geocoding-api.open-meteo.com/v1/search',
                params={'name': location, 'count': 1, 'language': 'en'},
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            if data.get('results'):
                result = data['results'][0]
                return result['latitude'], result['longitude'], result.get('name', location)
            return None
        except Exception as e:
            return None

    def fetch_weather(self, lat: float, lon: float) -> dict:
        """Fetch weather data from Open-Meteo API."""
        try:
            response = requests.get(
                'https://api.open-meteo.com/v1/forecast',
                params={
                    'latitude': lat,
                    'longitude': lon,
                    'current': 'temperature_2m,weather_code,wind_speed_10m,precipitation',
                    'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
                    'timezone': 'auto'
                },
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return None

    def weather_code_to_description(self, code: int) -> str:
        """Convert WMO weather code to description."""
        codes = {
            0: 'Clear sky',
            1: 'Partly cloudy',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Foggy',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Heavy drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with hail',
            99: 'Thunderstorm with hail',
        }
        return codes.get(code, 'Unknown')

    def normalize_weather_data(self, location: str, lat: float, lon: float, raw_data: dict) -> dict:
        """Normalize API response to standard format."""
        if not raw_data:
            return None

        try:
            current = raw_data.get('current', {})
            daily = raw_data.get('daily', {})

            weather_code = current.get('weather_code', 0)

            return {
                'location': location,
                'lat': lat,
                'lon': lon,
                'temp': current.get('temperature_2m'),
                'temp_high': daily.get('temperature_2m_max', [None])[0],
                'temp_low': daily.get('temperature_2m_min', [None])[0],
                'wind_speed': current.get('wind_speed_10m', 0),
                'precipitation_probability': daily.get('precipitation_probability_max', [0])[0],
                'description': self.weather_code_to_description(weather_code),
                'fetched_at': now().isoformat(),
            }
        except Exception as e:
            return None

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current weather for a location."""
        location = request.query_params.get('location', 'ottawa')
        if not location:
            return Response({'error': 'location parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check cache first
        cache_key = f'weather_{location}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # Try to get fresh snapshot from DB
        try:
            snapshot = WeatherSnapshot.objects.filter(
                location_name=location
            ).latest('fetched_at')
            if snapshot.is_fresh(cache_minutes=30):
                serializer = WeatherSerializer(snapshot)
                return Response(serializer.data)
        except WeatherSnapshot.DoesNotExist:
            pass

        # Fetch fresh data
        coords = self.get_location_coordinates(location)
        if not coords:
            return Response(
                {'error': f'Could not find location: {location}'},
                status=status.HTTP_404_NOT_FOUND
            )

        lat, lon, normalized_location = coords
        raw_weather = self.fetch_weather(lat, lon)
        if not raw_weather:
            return Response(
                {'error': 'Could not fetch weather data'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        normalized = self.normalize_weather_data(normalized_location, lat, lon, raw_weather)
        if not normalized:
            return Response(
                {'error': 'Could not process weather data'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Save to cache
        WeatherSnapshot.objects.create(
            location_name=location,
            lat=lat,
            lon=lon,
            data=raw_weather,
            fetched_at=now()
        )

        # Cache for 30 minutes
        cache.set(cache_key, normalized, 30 * 60)

        return Response(normalized)
