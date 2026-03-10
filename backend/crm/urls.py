from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactViewSet, InteractionViewSet, ReminderViewSet

router = DefaultRouter()
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'interactions', InteractionViewSet, basename='interaction')
router.register(r'reminders', ReminderViewSet, basename='reminder')

urlpatterns = [
    path('', include(router.urls)),
]
