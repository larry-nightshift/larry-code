from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now
from datetime import date

from .models import TodayFocus, Note, Task, UpcomingItem
from .serializers import TodayFocusSerializer, NoteSerializer, TaskSerializer, UpcomingItemSerializer


class TodayFocusViewSet(viewsets.ModelViewSet):
    serializer_class = TodayFocusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TodayFocus.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'put'], url_path='today')
    def today(self, request):
        today_date = date.today()
        try:
            focus = TodayFocus.objects.get(user=request.user, date=today_date)
        except TodayFocus.DoesNotExist:
            focus = None

        if request.method == 'GET':
            if focus is None:
                return Response(status=status.HTTP_204_NO_CONTENT)
            serializer = self.get_serializer(focus)
            return Response(serializer.data)

        elif request.method == 'PUT':
            if focus is None:
                focus = TodayFocus(user=request.user, date=today_date)
            serializer = self.get_serializer(focus, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user, date=today_date)
            return Response(serializer.data)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


class UpcomingItemViewSet(viewsets.ModelViewSet):
    serializer_class = UpcomingItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UpcomingItem.objects.filter(user=self.request.user).order_by('starts_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)
