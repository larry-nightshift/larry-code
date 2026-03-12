from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Location, Item, Warranty, Attachment, ServiceEvent
from .serializers import (
    LocationSerializer,
    ItemDetailSerializer,
    ItemListSerializer,
    ItemCreateUpdateSerializer,
    WarrantySerializer,
    AttachmentSerializer,
    ServiceEventSerializer,
)


class LocationViewSet(viewsets.ModelViewSet):
    """ViewSet for location management."""

    permission_classes = [IsAuthenticated]
    serializer_class = LocationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_archived']

    def get_queryset(self):
        """Filter locations by current user."""
        return Location.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Associate location with current user."""
        serializer.save(user=self.request.user)


class ItemViewSet(viewsets.ModelViewSet):
    """ViewSet for item management."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'category', 'location']
    search_fields = ['name', 'brand', 'model_number', 'serial_number', 'vendor']

    def get_queryset(self):
        """Filter items by current user and prefetch related data."""
        queryset = Item.objects.filter(user=self.request.user).select_related('location').prefetch_related(
            'warranties', 'attachments', 'service_events'
        )
        # Filter by status unless explicitly archived
        if not self.request.query_params.get('show_archived'):
            queryset = queryset.filter(is_archived=False)
        # Default to ACTIVE status unless otherwise specified
        if not self.request.query_params.get('status'):
            queryset = queryset.filter(status='ACTIVE')
        return queryset

    def get_serializer_class(self):
        """Use different serializers for list vs detail."""
        if self.action == 'list':
            return ItemListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ItemCreateUpdateSerializer
        return ItemDetailSerializer

    def perform_create(self, serializer):
        """Associate item with current user."""
        serializer.save(user=self.request.user)


class WarrantyViewSet(viewsets.ModelViewSet):
    """ViewSet for warranty management."""

    permission_classes = [IsAuthenticated]
    serializer_class = WarrantySerializer
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        """Filter warranties by current user's items."""
        user_items = Item.objects.filter(user=self.request.user).values_list('id', flat=True)
        return Warranty.objects.filter(item_id__in=user_items)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get warranties expiring within N days (default 30)."""
        days = int(request.query_params.get('expiring_in', 30))
        today = timezone.now().date()
        expiry_date = today + timedelta(days=days)

        user_items = Item.objects.filter(user=request.user).values_list('id', flat=True)
        warranties = Warranty.objects.filter(
            item_id__in=user_items,
            end_date__gte=today,
            end_date__lte=expiry_date
        ).select_related('item').order_by('end_date')

        serializer = WarrantySerializer(warranties, many=True)
        return Response(serializer.data)


class AttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for attachment management."""

    permission_classes = [IsAuthenticated]
    serializer_class = AttachmentSerializer

    def get_queryset(self):
        """Filter attachments by current user's items."""
        user_items = Item.objects.filter(user=self.request.user).values_list('id', flat=True)
        return Attachment.objects.filter(item_id__in=user_items)

    def perform_create(self, serializer):
        """Validate that item belongs to current user."""
        item = serializer.validated_data.get('item')
        if item.user != self.request.user:
            return Response(
                {'error': 'You do not have permission to add attachments to this item.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()


class ServiceEventViewSet(viewsets.ModelViewSet):
    """ViewSet for service events."""

    permission_classes = [IsAuthenticated]
    serializer_class = ServiceEventSerializer

    def get_queryset(self):
        """Filter service events by current user's items."""
        user_items = Item.objects.filter(user=self.request.user).values_list('id', flat=True)
        return ServiceEvent.objects.filter(item_id__in=user_items)

    def perform_create(self, serializer):
        """Validate that item belongs to current user."""
        item = serializer.validated_data.get('item')
        if item.user != self.request.user:
            return Response(
                {'error': 'You do not have permission to add service events to this item.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()


class InventoryDashboardView(viewsets.ViewSet):
    """Dashboard view with widgets for inventory overview."""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard data with expiring warranties, recent items, and recent services."""
        user = request.user
        days = int(request.query_params.get('expiring_in', 30))

        # Expiring warranties
        today = timezone.now().date()
        expiry_date = today + timedelta(days=days)
        expiring_warranties = Warranty.objects.filter(
            item__user=user,
            end_date__gte=today,
            end_date__lte=expiry_date
        ).select_related('item').order_by('end_date')[:10]

        # Recently added items
        recent_items = Item.objects.filter(
            user=user,
            status='ACTIVE',
            is_archived=False
        ).select_related('location')[:10]

        # Recently serviced items (last 10 service events)
        recent_services = ServiceEvent.objects.filter(
            item__user=user
        ).select_related('item').order_by('-occurred_at')[:10]

        return Response({
            'expiring_warranties': WarrantySerializer(expiring_warranties, many=True).data,
            'recent_items': ItemListSerializer(recent_items, many=True).data,
            'recent_service_events': ServiceEventSerializer(recent_services, many=True).data,
        })
