from rest_framework import serializers
from datetime import date
from .models import Asset, MaintenanceTask, MaintenanceRecord
from .services.recurrence import compute_next_due_date_from_strategy, compute_status


class AssetSerializer(serializers.ModelSerializer):
    """Serializer for Asset model."""

    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "category",
            "location",
            "manufacturer",
            "model_number",
            "serial_number",
            "purchase_date",
            "notes",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for MaintenanceRecord model."""

    class Meta:
        model = MaintenanceRecord
        fields = [
            "id",
            "task",
            "completed_date",
            "notes",
            "cost",
            "performed_by",
            "attachment_url",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MaintenanceTaskSerializer(serializers.ModelSerializer):
    """Serializer for MaintenanceTask model (CRUD operations)."""

    class Meta:
        model = MaintenanceTask
        fields = [
            "id",
            "asset",
            "title",
            "description",
            "recurrence_type",
            "interval",
            "start_date",
            "due_strategy",
            "grace_days",
            "priority",
            "is_active",
            "is_archived",
            "last_completed_date",
            "next_due_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "last_completed_date", "next_due_date", "created_at", "updated_at"]

    def validate_interval(self, value):
        """Ensure interval is at least 1."""
        if value < 1:
            raise serializers.ValidationError("Interval must be at least 1")
        return value

    def create(self, validated_data):
        """Create task and compute initial next_due_date."""
        task = MaintenanceTask.objects.create(**validated_data)
        # Compute initial next due date
        task.next_due_date = compute_next_due_date_from_strategy(task)
        task.save()
        return task

    def update(self, instance, validated_data):
        """Update task and recompute next_due_date."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Recompute next due date after update
        instance.next_due_date = compute_next_due_date_from_strategy(instance)
        instance.save()
        return instance


class DueTaskSerializer(serializers.ModelSerializer):
    """Serializer for MaintenanceTask with computed status (read-only)."""

    status = serializers.SerializerMethodField()
    asset_name = serializers.CharField(source="asset.name", read_only=True, allow_null=True)
    asset_category = serializers.CharField(source="asset.category", read_only=True, allow_null=True)

    class Meta:
        model = MaintenanceTask
        fields = [
            "id",
            "asset",
            "asset_name",
            "asset_category",
            "title",
            "description",
            "priority",
            "next_due_date",
            "status",
            "grace_days",
            "last_completed_date",
        ]
        read_only_fields = fields

    def get_status(self, obj):
        """Compute status based on next_due_date and grace_days."""
        if obj.next_due_date is None:
            return "SCHEDULED"
        return compute_status(obj.next_due_date, grace_days=obj.grace_days)
