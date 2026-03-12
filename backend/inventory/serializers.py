from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import Location, Item, Warranty, Attachment, ServiceEvent


class LocationSerializer(serializers.ModelSerializer):
    """Serializer for locations."""

    class Meta:
        model = Location
        fields = ['id', 'name', 'notes', 'is_archived', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WarrantySerializer(serializers.ModelSerializer):
    """Serializer for warranties with computed fields."""

    is_active = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Warranty
        fields = [
            'id', 'item', 'provider', 'warranty_type', 'start_date', 'end_date',
            'terms', 'claim_instructions', 'is_active', 'days_remaining', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_active', 'days_remaining']

    def get_is_active(self, obj):
        """Check if warranty is currently active."""
        today = timezone.now().date()
        return obj.start_date <= today <= obj.end_date

    def get_days_remaining(self, obj):
        """Calculate days until warranty expires."""
        today = timezone.now().date()
        if today > obj.end_date:
            return None
        return (obj.end_date - today).days

    def validate(self, data):
        """Validate warranty dates."""
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError('End date must be after start date.')
        return data


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializer for attachments."""

    class Meta:
        model = Attachment
        fields = ['id', 'item', 'attachment_type', 'title', 'url', 'file', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        """Validate URL and FILE mutual exclusivity."""
        attachment_type = data.get('attachment_type')
        url = data.get('url')
        file = data.get('file')

        if attachment_type == 'URL':
            if not url:
                raise serializers.ValidationError({'url': 'URL is required for URL attachments.'})
            if file:
                raise serializers.ValidationError({'file': 'File should be empty for URL attachments.'})
        elif attachment_type == 'FILE':
            if not file:
                raise serializers.ValidationError({'file': 'File is required for FILE attachments.'})
            if url:
                raise serializers.ValidationError({'url': 'URL should be empty for FILE attachments.'})

        return data


class ServiceEventSerializer(serializers.ModelSerializer):
    """Serializer for service events."""

    class Meta:
        model = ServiceEvent
        fields = ['id', 'item', 'occurred_at', 'event_type', 'cost', 'vendor', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ItemDetailSerializer(serializers.ModelSerializer):
    """Detailed item serializer with nested relationships."""

    location_name = serializers.CharField(source='location.name', read_only=True)
    warranties = WarrantySerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    service_events = ServiceEventSerializer(many=True, read_only=True)
    next_warranty_expiry = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'category', 'brand', 'model_number', 'serial_number',
            'purchase_date', 'purchase_price', 'vendor', 'location', 'location_name',
            'notes', 'status', 'is_archived', 'warranties', 'attachments', 'service_events',
            'next_warranty_expiry', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'warranties', 'attachments', 'service_events']

    def get_next_warranty_expiry(self, obj):
        """Get the nearest warranty expiry date."""
        today = timezone.now().date()
        future_warranties = obj.warranties.filter(end_date__gte=today).order_by('end_date')
        if future_warranties.exists():
            return future_warranties.first().end_date
        return None


class ItemListSerializer(serializers.ModelSerializer):
    """Lightweight item serializer for list views."""

    location_name = serializers.CharField(source='location.name', read_only=True)
    next_warranty_expiry = serializers.SerializerMethodField()
    active_warranty_count = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'category', 'brand', 'purchase_date', 'location', 'location_name',
            'status', 'next_warranty_expiry', 'active_warranty_count', 'created_at'
        ]
        read_only_fields = fields

    def get_next_warranty_expiry(self, obj):
        """Get the nearest warranty expiry date."""
        today = timezone.now().date()
        future_warranties = obj.warranties.filter(end_date__gte=today).order_by('end_date')
        if future_warranties.exists():
            return future_warranties.first().end_date
        return None

    def get_active_warranty_count(self, obj):
        """Count active warranties."""
        today = timezone.now().date()
        return obj.warranties.filter(start_date__lte=today, end_date__gte=today).count()


class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating items."""

    class Meta:
        model = Item
        fields = [
            'name', 'category', 'brand', 'model_number', 'serial_number',
            'purchase_date', 'purchase_price', 'vendor', 'location', 'notes', 'status'
        ]

    def validate_name(self, value):
        """Ensure name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Name cannot be empty.')
        return value

    def validate_category(self, value):
        """Ensure category is valid."""
        if not value:
            raise serializers.ValidationError('Category is required.')
        return value
