import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class GroceryList(models.Model):
    """A list of groceries aggregated from recipes."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, blank=False)
    recipes = models.ManyToManyField('recipes.Recipe', blank=True)
    date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class GroceryItem(models.Model):
    """An item in a grocery list, aggregated from recipe ingredients."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    grocery_list = models.ForeignKey(GroceryList, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200, blank=False)
    amount = models.DecimalField(max_digits=10, decimal_places=3)
    unit = models.CharField(max_length=50, blank=False)
    source_recipes = models.JSONField(default=list, blank=True)  # List of recipe IDs
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.amount} {self.unit} of {self.name}"
