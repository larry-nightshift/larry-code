from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LocationViewSet,
    ItemViewSet,
    WarrantyViewSet,
    AttachmentViewSet,
    ServiceEventViewSet,
    InventoryDashboardView,
)

router = DefaultRouter()
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'warranties', WarrantyViewSet, basename='warranty')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'service-events', ServiceEventViewSet, basename='service-event')
router.register(r'dashboard', InventoryDashboardView, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
