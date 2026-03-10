from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, MaintenanceTaskViewSet, MaintenanceRecordViewSet, DueView

router = DefaultRouter()
router.register(r'assets', AssetViewSet, basename='asset')
router.register(r'tasks', MaintenanceTaskViewSet, basename='task')
router.register(r'records', MaintenanceRecordViewSet, basename='record')

urlpatterns = [
    path('', include(router.urls)),
    path('due/', DueView.as_view(), name='due'),
]
