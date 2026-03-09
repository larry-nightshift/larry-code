from rest_framework import serializers
from .models import WeatherSnapshot


class WeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherSnapshot
        fields = ['location_name', 'lat', 'lon', 'data', 'fetched_at']
        read_only_fields = ['fetched_at']


class WeatherDataSerializer(serializers.Serializer):
    """Serializer for weather API response."""
    location = serializers.CharField()
    temp = serializers.FloatField()
    temp_high = serializers.FloatField()
    temp_low = serializers.FloatField()
    wind_speed = serializers.FloatField()
    precipitation_probability = serializers.IntegerField()
    description = serializers.CharField()
