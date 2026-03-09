from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Recipe, Ingredient
from .serializers import (
    RecipeListSerializer,
    RecipeDetailSerializer,
    RecipeCreateUpdateSerializer,
)


class RecipeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = []  # Can add search later if needed

    def get_queryset(self):
        return Recipe.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return RecipeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return RecipeCreateUpdateSerializer
        return RecipeDetailSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search recipes by title."""
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        recipes = self.get_queryset().filter(Q(title__icontains=query))
        serializer = RecipeListSerializer(recipes, many=True)
        return Response(serializer.data)
