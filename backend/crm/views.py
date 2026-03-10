from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import Contact, Interaction, Reminder
from .serializers import (
    ContactListSerializer,
    ContactDetailSerializer,
    ContactCreateUpdateSerializer,
    InteractionSerializer,
    InteractionCreateUpdateSerializer,
    ReminderSerializer,
    ReminderCreateUpdateSerializer,
)


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ContactViewSet(viewsets.ModelViewSet):
    """ViewSet for Contact CRUD operations."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'email', 'tags']

    def get_queryset(self):
        """Filter contacts by current user."""
        return Contact.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action in ['create', 'update', 'partial_update']:
            return ContactCreateUpdateSerializer
        elif self.action == 'retrieve':
            return ContactDetailSerializer
        return ContactListSerializer

    def perform_create(self, serializer):
        """Set current user when creating contact."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def interactions(self, request, pk=None):
        """Get interactions for a contact or create one."""
        contact = self.get_object()

        if request.method == 'POST':
            serializer = InteractionCreateUpdateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(contact=contact)
                return Response(
                    InteractionSerializer(serializer.instance).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # GET: List interactions
        interactions = contact.interactions.all()
        serializer = InteractionSerializer(interactions, many=True)
        return Response(serializer.data)


class InteractionViewSet(viewsets.ModelViewSet):
    """ViewSet for Interaction CRUD operations."""

    permission_classes = [IsAuthenticated]
    serializer_class = InteractionSerializer

    def get_queryset(self):
        """Filter interactions for contacts owned by current user."""
        return Interaction.objects.filter(contact__user=self.request.user)

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action in ['create', 'update', 'partial_update']:
            return InteractionCreateUpdateSerializer
        return InteractionSerializer

    def perform_create(self, serializer):
        """Validate contact belongs to user before creating."""
        contact_id = self.request.data.get('contact')
        if contact_id:
            try:
                contact = Contact.objects.get(id=contact_id, user=self.request.user)
                serializer.save(contact=contact)
            except Contact.DoesNotExist:
                raise ValidationError('Contact not found.')
        else:
            raise ValidationError('Contact is required.')


class ReminderViewSet(viewsets.ModelViewSet):
    """ViewSet for Reminder CRUD operations."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        """Filter reminders by current user."""
        queryset = Reminder.objects.filter(user=self.request.user)

        # Filter by due_in parameter
        due_in = self.request.query_params.get('due_in')
        if due_in:
            try:
                days = int(due_in)
                cutoff = timezone.now() + timedelta(days=days)
                queryset = queryset.filter(
                    due_at__lte=cutoff,
                    done=False
                )
            except (ValueError, TypeError):
                pass

        # Filter by status: overdue, due_today, due_this_week, all
        status_filter = self.request.query_params.get('status')
        if status_filter == 'overdue':
            queryset = queryset.filter(due_at__lt=timezone.now(), done=False)
        elif status_filter == 'due_today':
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start + timedelta(days=1)
            queryset = queryset.filter(due_at__gte=today_start, due_at__lt=today_end, done=False)
        elif status_filter == 'due_this_week':
            today = timezone.now().date()
            week_end = today + timedelta(days=7)
            queryset = queryset.filter(
                due_at__date__gte=today,
                due_at__date__lt=week_end,
                done=False
            )

        return queryset.order_by('due_at')

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action in ['create', 'update', 'partial_update']:
            return ReminderCreateUpdateSerializer
        return ReminderSerializer

    def perform_create(self, serializer):
        """Set current user when creating reminder."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def mark_done(self, request, pk=None):
        """Mark a reminder as done."""
        reminder = self.get_object()
        reminder.done = True
        reminder.save()
        return Response(ReminderSerializer(reminder).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def snooze(self, request, pk=None):
        """Snooze a reminder by specified days."""
        reminder = self.get_object()
        days = request.data.get('days', 1)
        try:
            days = int(days)
            reminder.due_at += timedelta(days=days)
            reminder.save()
            return Response(ReminderSerializer(reminder).data)
        except (ValueError, TypeError):
            return Response(
                {'error': 'days must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
