from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from .models import Recipe, Ingredient


class RecipeModelTest(TestCase):
    """Test Recipe model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_create_recipe(self):
        """Test creating a recipe."""
        recipe = Recipe.objects.create(
            user=self.user,
            title='Chocolate Cake',
            description='A simple cake',
            servings=8,
        )
        self.assertEqual(recipe.title, 'Chocolate Cake')
        self.assertEqual(recipe.servings, 8)
        self.assertEqual(recipe.user, self.user)

    def test_recipe_str(self):
        """Test recipe string representation."""
        recipe = Recipe.objects.create(
            user=self.user,
            title='Test Recipe',
            servings=4,
        )
        self.assertEqual(str(recipe), 'Test Recipe (4 servings)')


class IngredientModelTest(TestCase):
    """Test Ingredient model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.recipe = Recipe.objects.create(
            user=self.user,
            title='Test Recipe',
            servings=4,
        )

    def test_create_ingredient(self):
        """Test creating an ingredient."""
        ingredient = Ingredient.objects.create(
            recipe=self.recipe,
            name='flour',
            amount=Decimal('200'),
            unit='g',
        )
        self.assertEqual(ingredient.name, 'flour')
        self.assertEqual(ingredient.amount, Decimal('200'))
        self.assertEqual(ingredient.unit, 'g')


class RecipeAPITest(APITestCase):
    """Test Recipe API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_recipe_with_ingredients(self):
        """Test creating a recipe via API with ingredients."""
        payload = {
            'title': 'Pancakes',
            'description': 'Fluffy pancakes',
            'servings': 4,
            'ingredients': [
                {'name': 'flour', 'amount': '200', 'unit': 'g'},
                {'name': 'milk', 'amount': '300', 'unit': 'ml'},
                {'name': 'eggs', 'amount': '2', 'unit': 'whole'},
            ],
        }
        response = self.client.post('/api/recipes/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Recipe.objects.count(), 1)
        recipe = Recipe.objects.first()
        self.assertEqual(recipe.ingredients.count(), 3)

    def test_list_recipes(self):
        """Test listing recipes."""
        Recipe.objects.create(user=self.user, title='Recipe 1', servings=4)
        Recipe.objects.create(user=self.user, title='Recipe 2', servings=2)

        response = self.client.get('/api/recipes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_recipe_detail(self):
        """Test getting recipe detail with ingredients."""
        recipe = Recipe.objects.create(user=self.user, title='Test', servings=4)
        Ingredient.objects.create(
            recipe=recipe,
            name='flour',
            amount=Decimal('200'),
            unit='g',
        )

        response = self.client.get(f'/api/recipes/{recipe.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test')
        self.assertEqual(len(response.data['ingredients']), 1)

    def test_update_recipe(self):
        """Test updating a recipe."""
        recipe = Recipe.objects.create(user=self.user, title='Old Title', servings=4)
        payload = {
            'title': 'New Title',
            'description': 'Updated',
            'servings': 6,
            'ingredients': [
                {'name': 'butter', 'amount': '100', 'unit': 'g'},
            ],
        }
        response = self.client.patch(f'/api/recipes/{recipe.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        recipe.refresh_from_db()
        self.assertEqual(recipe.title, 'New Title')
        self.assertEqual(recipe.servings, 6)

    def test_delete_recipe(self):
        """Test deleting a recipe."""
        recipe = Recipe.objects.create(user=self.user, title='To Delete', servings=4)
        response = self.client.delete(f'/api/recipes/{recipe.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Recipe.objects.count(), 0)

    def test_search_recipes(self):
        """Test searching recipes by title."""
        Recipe.objects.create(user=self.user, title='Chocolate Cake', servings=4)
        Recipe.objects.create(user=self.user, title='Vanilla Cake', servings=4)
        Recipe.objects.create(user=self.user, title='Bread', servings=2)

        response = self.client.get('/api/recipes/search/?q=cake')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
