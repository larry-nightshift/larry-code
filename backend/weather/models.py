from django.db import models
from django.utils.timezone import now


class WeatherSnapshot(models.Model):
    """Cache weather data from Open-Meteo API."""
    location_name = models.CharField(max_length=200)
    lat = models.FloatField()
    lon = models.FloatField()
    data = models.JSONField()
    fetched_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['location_name', '-fetched_at']),
        ]

    def is_fresh(self, cache_minutes=30):
        """Check if cache is fresh (within cache_minutes)."""
        from datetime import timedelta
        return (now() - self.fetched_at) < timedelta(minutes=cache_minutes)
