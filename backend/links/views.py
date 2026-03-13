from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
import json
import csv
from io import StringIO
import uuid as uuid_lib

from .models import Link, Tag, Collection, ReadingQueueItem, LinkTag
from .serializers import (
    LinkDetailSerializer, LinkListSerializer, TagSerializer,
    CollectionSerializer, ReadingQueueItemSerializer,
    ReadingQueueItemUpdateSerializer
)


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class LinkViewSet(viewsets.ModelViewSet):
    """
    Viewset for managing links.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LinkDetailSerializer
        return LinkListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Link.objects.filter(user=user).prefetch_related('tag_items')

        # Search
        search_query = self.request.query_params.get('q', '')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(url__icontains=search_query) |
                Q(notes__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        # Filter by tags
        tag_ids = self.request.query_params.getlist('tag')
        if tag_ids:
            for tag_id in tag_ids:
                queryset = queryset.filter(tag_items__tag_id=tag_id)

        # Filter by collection
        collection_id = self.request.query_params.get('collection_id')
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)

        # Filter by hostname
        hostname = self.request.query_params.get('hostname')
        if hostname:
            queryset = queryset.filter(hostname=hostname)

        # Filter by queue status
        queued = self.request.query_params.get('queued')
        if queued:
            if queued.lower() == 'true':
                queryset = queryset.filter(queue_item__isnull=False)
            elif queued.lower() == 'false':
                queryset = queryset.filter(queue_item__isnull=True)

        queue_status = self.request.query_params.get('queue_status')
        if queue_status:
            queryset = queryset.filter(queue_item__status=queue_status)

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        """Create a new link."""
        serializer = LinkDetailSerializer(data=request.data, context={'request': request})

        # Check for duplicate URL
        if 'url' in request.data:
            from .utils import normalize_url
            normalized, _ = normalize_url(request.data['url'])
            existing = Link.objects.filter(
                user=request.user,
                url_normalized=normalized
            ).first()

            if existing:
                return Response(
                    {
                        'detail': 'Link already exists',
                        'existing_link': LinkListSerializer(existing).data
                    },
                    status=status.HTTP_409_CONFLICT
                )

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """Update a link."""
        instance = self.get_object()
        serializer = LinkDetailSerializer(instance, data=request.data, partial=True, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Delete a link."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export all links as JSON."""
        links = self.get_queryset()
        data = LinkListSerializer(links, many=True).data
        return Response({'links': data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def import_links(self, request):
        """Import links from JSON."""
        try:
            links_data = request.data.get('links', [])
            created = 0
            errors = []

            for idx, link_data in enumerate(links_data):
                serializer = LinkDetailSerializer(data=link_data, context={'request': request})
                if serializer.is_valid():
                    serializer.save(user=request.user)
                    created += 1
                else:
                    errors.append({'row': idx, 'errors': serializer.errors})

            return Response({
                'created': created,
                'errors': errors,
                'total_rows': len(links_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class TagViewSet(viewsets.ModelViewSet):
    """Viewset for managing tags."""
    permission_classes = [IsAuthenticated]
    serializer_class = TagSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create a new tag."""
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CollectionViewSet(viewsets.ModelViewSet):
    """Viewset for managing collections."""
    permission_classes = [IsAuthenticated]
    serializer_class = CollectionSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return Collection.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create a new collection."""
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReadingQueueViewSet(viewsets.ModelViewSet):
    """Viewset for reading queue operations."""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    queryset = ReadingQueueItem.objects.none()

    def list(self, request):
        """List queued items."""
        queryset = ReadingQueueItem.objects.filter(user=request.user).prefetch_related('link')

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Sort
        sort = request.query_params.get('sort', '-priority')
        if sort in ['-priority', 'priority', 'due_date', '-due_date', 'queued_at', '-queued_at']:
            queryset = queryset.order_by(sort)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)

        serializer = ReadingQueueItemSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def create(self, request):
        """Queue a link (idempotent)."""
        link_id = request.data.get('link_id')

        try:
            link = Link.objects.get(id=link_id, user=request.user)
        except Link.DoesNotExist:
            return Response(
                {'detail': 'Link not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        queue_item, created = ReadingQueueItem.objects.get_or_create(
            user=request.user,
            link=link,
            defaults={
                'status': 'QUEUED',
                'priority': request.data.get('priority', 3)
            }
        )

        if not created:
            # Update if already exists
            queue_item.priority = request.data.get('priority', queue_item.priority)
            queue_item.save()

        serializer = ReadingQueueItemSerializer(queue_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def update(self, request, pk=None, partial=False):
        """Update a queue item."""
        try:
            queue_item = ReadingQueueItem.objects.get(id=pk, user=request.user)
        except ReadingQueueItem.DoesNotExist:
            return Response(
                {'detail': 'Queue item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReadingQueueItemUpdateSerializer(queue_item, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(ReadingQueueItemSerializer(queue_item).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """Unqueue a link."""
        try:
            queue_item = ReadingQueueItem.objects.get(id=pk, user=request.user)
        except ReadingQueueItem.DoesNotExist:
            return Response(
                {'detail': 'Queue item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        queue_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def unqueue_link(self, request):
        """Unqueue a link by link_id."""
        link_id = request.data.get('link_id')

        try:
            queue_item = ReadingQueueItem.objects.get(link_id=link_id, user=request.user)
            queue_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ReadingQueueItem.DoesNotExist:
            return Response(
                {'detail': 'Queue item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
