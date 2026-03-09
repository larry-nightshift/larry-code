import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class Recipe(models.Model):
    """A recipe with ingredients and directions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, blank=False)
    description = models.TextField(blank=True)
    servings = models.IntegerField(default=1)
    directions = models.JSONField(default=list, blank=True)  # List of step strings
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.servings} servings)"


class Ingredient(models.Model):
    """An ingredient in a recipe."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    name = models.CharField(max_length=200, blank=False)
    amount = models.DecimalField(max_digits=10, decimal_places=3)
    unit = models.CharField(max_length=50, blank=False)  # e.g. "g", "cup", "tsp"
    note = models.CharField(max_length=200, blank=True)  # e.g. "sifted"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.amount} {self.unit} of {self.name}"
