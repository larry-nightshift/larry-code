from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Empty router for now; feature apps will include their own urls under api/ via this file.
router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
