import csv
from io import StringIO
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from .models import GroceryList, GroceryItem
from .serializers import (
    GroceryListDetailSerializer,
    GroceryListCreateUpdateSerializer,
    GroceryListListSerializer,
)


class GroceryListViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GroceryList.objects.filter(user=self.request.user).prefetch_related('items', 'recipes')

    def get_serializer_class(self):
        if self.action == 'list':
            return GroceryListListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return GroceryListCreateUpdateSerializer
        return GroceryListDetailSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate aggregated items for a grocery list."""
        grocery_list = self.get_object()

        # Clear existing items
        grocery_list.items.all().delete()

        # Regenerate using serializer logic
        recipes = grocery_list.recipes.all()
        serializer = GroceryListCreateUpdateSerializer()
        serializer._generate_items(grocery_list, recipes)

        return Response({'status': 'items regenerated'})

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export grocery list as CSV."""
        grocery_list = self.get_object()
        items = grocery_list.items.all()

        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Item Name', 'Amount', 'Unit', 'Source Recipes'])

        for item in items:
            writer.writerow([
                item.name,
                str(item.amount),
                item.unit,
                ', '.join(item.source_recipes),
            ])

        # Return as HTTP response
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="grocery-list-{grocery_list.id}.csv"'
        return response
