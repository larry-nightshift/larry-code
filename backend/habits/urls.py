from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HabitViewSet, HabitCheckinViewSet, TodayView, HabitCalendarView, InsightsView

router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'checkins', HabitCheckinViewSet, basename='checkin')

urlpatterns = [
    path('', include(router.urls)),
    path('today/', TodayView.as_view(), name='today'),
    path('habits/<str:habit_id>/calendar/', HabitCalendarView.as_view(), name='calendar'),
    path('insights/', InsightsView.as_view(), name='insights'),
]
