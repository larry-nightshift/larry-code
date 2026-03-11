from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExerciseViewSet, RoutineViewSet, WorkoutViewSet, PersonalRecordViewSet, ProgressViewSet

router = DefaultRouter()
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'routines', RoutineViewSet, basename='routine')
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'prs', PersonalRecordViewSet, basename='personal-record')
router.register(r'progress', ProgressViewSet, basename='progress')

urlpatterns = [
    path('', include(router.urls)),
]
