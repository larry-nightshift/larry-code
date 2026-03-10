from rest_framework import serializers
from .models import Contact, Interaction, Reminder


class InteractionSerializer(serializers.ModelSerializer):
    """Serializer for Interaction."""

    medium_display = serializers.CharField(source='get_medium_display', read_only=True)

    class Meta:
        model = Interaction
        fields = [
            'id',
            'contact',
            'date',
            'medium',
            'medium_display',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class InteractionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating Interaction."""

    class Meta:
        model = Interaction
        fields = ['date', 'medium', 'notes']

    def validate_notes(self, value):
        """Ensure notes are not just whitespace."""
        if value and not value.strip():
            raise serializers.ValidationError('Notes cannot be empty or whitespace.')
        return value


class ContactListSerializer(serializers.ModelSerializer):
    """Serializer for listing contacts (minimal info)."""

    class Meta:
        model = Contact
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'company',
            'tags',
            'created_at',
            'updated_at',
        ]


class ContactDetailSerializer(serializers.ModelSerializer):
    """Serializer for contact detail (includes interactions)."""

    interactions = InteractionSerializer(many=True, read_only=True)
    interaction_count = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'company',
            'tags',
            'notes',
            'interactions',
            'interaction_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'interactions', 'interaction_count']

    def get_interaction_count(self, obj):
        return obj.interactions.count()


class ContactCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating contacts."""

    class Meta:
        model = Contact
        fields = [
            'full_name',
            'email',
            'phone',
            'company',
            'tags',
            'notes',
        ]

    def validate_full_name(self, value):
        """Ensure full_name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Full name is required.')
        return value.strip()

    def validate_email(self, value):
        """Validate email format if provided."""
        if value and '@' not in value:
            raise serializers.ValidationError('Invalid email address.')
        return value


class ReminderSerializer(serializers.ModelSerializer):
    """Serializer for Reminder."""

    contact_name = serializers.CharField(source='contact.full_name', read_only=True, allow_null=True)
    is_overdue = serializers.SerializerMethodField()
    days_until_due = serializers.SerializerMethodField()

    class Meta:
        model = Reminder
        fields = [
            'id',
            'contact',
            'contact_name',
            'due_at',
            'message',
            'done',
            'is_overdue',
            'days_until_due',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_overdue', 'days_until_due', 'contact_name']

    def get_is_overdue(self, obj):
        return obj.is_overdue()

    def get_days_until_due(self, obj):
        return obj.days_until_due()


class ReminderCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating Reminder."""

    class Meta:
        model = Reminder
        fields = [
            'contact',
            'due_at',
            'message',
            'done',
        ]

    def validate_message(self, value):
        """Ensure message is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Message is required.')
        return value.strip()

    def validate_due_at(self, value):
        """Validate due_at datetime."""
        if not value:
            raise serializers.ValidationError('Due date is required.')
        return value
