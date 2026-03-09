from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TodayFocusViewSet, NoteViewSet, TaskViewSet, UpcomingItemViewSet, AuthViewSet
from weather.views import WeatherViewSet

router = DefaultRouter()
router.register(r'focus', TodayFocusViewSet, basename='focus')
router.register(r'notes', NoteViewSet, basename='notes')
router.register(r'tasks', TaskViewSet, basename='tasks')
router.register(r'upcoming', UpcomingItemViewSet, basename='upcoming')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'weather', WeatherViewSet, basename='weather')

urlpatterns = [
    path('', include(router.urls)),
    path('journalapp/', include('journalapp.urls')),
]
