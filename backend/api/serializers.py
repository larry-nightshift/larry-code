from rest_framework import serializers
from .models import TodayFocus, Note, Task, UpcomingItem


class TodayFocusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TodayFocus
        fields = ['id', 'user', 'date', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'user', 'title', 'body', 'pinned', 'archived', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'user', 'text', 'status', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UpcomingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = UpcomingItem
        fields = ['id', 'user', 'title', 'starts_at', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
