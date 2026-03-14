from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TodayFocusViewSet, NoteViewSet, TaskViewSet, UpcomingItemViewSet, AuthViewSet
from weather.views import WeatherViewSet
from posts.views import PostViewSet, SiteExportView

router = DefaultRouter()
router.register(r'focus', TodayFocusViewSet, basename='focus')
router.register(r'notes', NoteViewSet, basename='notes')
router.register(r'tasks', TaskViewSet, basename='tasks')
router.register(r'upcoming', UpcomingItemViewSet, basename='upcoming')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'weather', WeatherViewSet, basename='weather')
router.register(r'posts', PostViewSet, basename='posts')

urlpatterns = [
    path('', include(router.urls)),
    path('journalapp/', include('journalapp.urls')),
    path('recipes/', include('recipes.urls')),
    path('grocery/', include('grocery.urls')),
    path('habits/', include('habits.urls')),
    path('maintenance/', include('maintenance.urls')),
    path('site/', include('posts.urls')),
    path('crm/', include('crm.urls')),
    path('workouts/', include('workouts.urls')),
    path('inventory/', include('inventory.urls')),
    path('links/', include('links.urls')),
    path('job_tracker/', include('job_tracker.urls')),
]
