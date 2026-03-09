from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GroceryListViewSet

router = DefaultRouter()
router.register(r'lists', GroceryListViewSet, basename='grocery-list')

urlpatterns = [
    path('', include(router.urls)),
]
