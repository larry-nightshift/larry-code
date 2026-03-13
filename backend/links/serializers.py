from rest_framework import serializers
from .models import Link, Tag, LinkTag, Collection, ReadingQueueItem
from .utils import normalize_url, fetch_metadata


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        return value.strip()

    def create(self, validated_data):
        validated_data['name_normalized'] = validated_data['name'].lower().strip()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'name' in validated_data:
            validated_data['name_normalized'] = validated_data['name'].lower().strip()
        return super().update(instance, validated_data)


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['id', 'name', 'description', 'is_archived', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LinkTagSerializer(serializers.ModelSerializer):
    tag = TagSerializer(read_only=True)

    class Meta:
        model = LinkTag
        fields = ['id', 'tag']


class LinkListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view."""
    tags = serializers.SerializerMethodField()
    queue_status = serializers.SerializerMethodField()
    queue_priority = serializers.SerializerMethodField()

    class Meta:
        model = Link
        fields = [
            'id', 'url', 'title', 'description', 'hostname',
            'favicon_url', 'preview_image_url', 'collection',
            'tags', 'queue_status', 'queue_priority', 'created_at'
        ]

    def get_tags(self, obj):
        tags = obj.tag_items.all()
        return TagSerializer([item.tag for item in tags], many=True).data

    def get_queue_status(self, obj):
        try:
            return obj.queue_item.status
        except:
            return None

    def get_queue_priority(self, obj):
        try:
            return obj.queue_item.priority
        except:
            return None


class LinkDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all fields for detail view."""
    tags = serializers.SerializerMethodField()
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.none(),
        many=True,
        source='tag_items',
        write_only=True
    )
    queue_item = serializers.SerializerMethodField()

    class Meta:
        model = Link
        fields = [
            'id', 'url', 'title', 'description', 'notes', 'hostname',
            'favicon_url', 'site_name', 'preview_image_url',
            'collection', 'tags', 'tag_ids', 'queue_item', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'hostname', 'created_at', 'updated_at']

    def get_tags(self, obj):
        tags = obj.tag_items.all()
        return TagSerializer([item.tag for item in tags], many=True).data

    def get_queue_item(self, obj):
        try:
            qi = obj.queue_item
            return {
                'id': str(qi.id),
                'status': qi.status,
                'priority': qi.priority,
                'queued_at': qi.queued_at,
                'due_date': qi.due_date,
                'finished_at': qi.finished_at,
            }
        except:
            return None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the queryset for tag_ids to the current user's tags
        if self.context and 'request' in self.context:
            user = self.context['request'].user
            self.fields['tag_ids'].queryset = Tag.objects.filter(user=user)

    def validate_url(self, value):
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("URL must start with http:// or https://")
        return value

    def create(self, validated_data):
        url = validated_data['url']
        normalized, hostname = normalize_url(url)
        validated_data['url_normalized'] = normalized
        validated_data['hostname'] = hostname

        # If title is not provided, try to fetch metadata
        if not validated_data.get('title'):
            metadata = fetch_metadata(url)
            if metadata.get('title'):
                validated_data['title'] = metadata['title']
            if metadata.get('site_name'):
                validated_data['site_name'] = metadata['site_name']
            if metadata.get('image_url'):
                validated_data['preview_image_url'] = metadata['image_url']
            if metadata.get('favicon_url'):
                validated_data['favicon_url'] = metadata['favicon_url']

        tag_items = validated_data.pop('tag_items', [])
        instance = super().create(validated_data)

        # Add tags
        for tag in tag_items:
            LinkTag.objects.create(link=instance, tag=tag)

        return instance

    def update(self, instance, validated_data):
        tag_items = validated_data.pop('tag_items', None)

        instance = super().update(instance, validated_data)

        # Update tags if provided
        if tag_items is not None:
            LinkTag.objects.filter(link=instance).delete()
            for tag in tag_items:
                LinkTag.objects.create(link=instance, tag=tag)

        return instance


class ReadingQueueItemSerializer(serializers.ModelSerializer):
    link = LinkListSerializer(read_only=True)

    class Meta:
        model = ReadingQueueItem
        fields = ['id', 'link', 'status', 'priority', 'queued_at', 'due_date', 'finished_at']
        read_only_fields = ['id', 'link', 'queued_at']


class ReadingQueueItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingQueueItem
        fields = ['status', 'priority', 'due_date', 'finished_at']
