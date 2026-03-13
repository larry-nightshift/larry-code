from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LinkViewSet, TagViewSet, CollectionViewSet, ReadingQueueViewSet

router = DefaultRouter()
router.register(r'links', LinkViewSet, basename='link')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'collections', CollectionViewSet, basename='collection')
router.register(r'queue', ReadingQueueViewSet, basename='queue')

urlpatterns = [
    path('', include(router.urls)),
]
