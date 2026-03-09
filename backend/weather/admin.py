from django.contrib import admin
from .models import WeatherSnapshot


@admin.register(WeatherSnapshot)
class WeatherSnapshotAdmin(admin.ModelAdmin):
    list_display = ['location_name', 'lat', 'lon', 'fetched_at', 'created_at']
    list_filter = ['location_name', 'fetched_at']
    search_fields = ['location_name']
    readonly_fields = ['created_at', 'updated_at', 'data']
