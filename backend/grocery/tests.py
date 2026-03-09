from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from .models import GroceryList, GroceryItem
from .aggregation import aggregate_ingredients, convert_amount, get_canonical_unit
from recipes.models import Recipe, Ingredient


class UnitConversionTest(TestCase):
    """Test unit conversion and normalization."""

    def test_canonical_unit_tsp(self):
        """Test canonicalizing teaspoon variants."""
        self.assertEqual(get_canonical_unit('tsp'), 'tsp')
        self.assertEqual(get_canonical_unit('teaspoon'), 'tsp')
        self.assertEqual(get_canonical_unit('Teaspoon'), 'tsp')

    def test_canonical_unit_cup(self):
        """Test canonicalizing cup variants."""
        self.assertEqual(get_canonical_unit('cup'), 'cup')
        self.assertEqual(get_canonical_unit('Cup'), 'cup')
        self.assertEqual(get_canonical_unit('c'), 'cup')

    def test_convert_ml_to_l(self):
        """Test converting milliliters to liters."""
        amount, is_approx = convert_amount(Decimal('1000'), 'ml', 'l')
        self.assertEqual(amount, Decimal('1'))
        self.assertFalse(is_approx)

    def test_convert_tsp_to_tbsp(self):
        """Test converting teaspoons to tablespoons."""
        amount, is_approx = convert_amount(Decimal('3'), 'tsp', 'tbsp')
        # Should be approximately 1 tbsp
        self.assertAlmostEqual(float(amount), 1.0, places=1)
        self.assertFalse(is_approx)

    def test_convert_incompatible_units(self):
        """Test that incompatible units remain unconverted."""
        amount, is_approx = convert_amount(Decimal('100'), 'g', 'tbsp')
        self.assertEqual(amount, Decimal('100'))  # No conversion
        self.assertFalse(is_approx)


class AggregationTest(TestCase):
    """Test ingredient aggregation logic."""

    def test_aggregate_same_ingredient_same_unit(self):
        """Test aggregating same ingredient with same unit."""
        ingredients = [
            {'name': 'flour', 'amount': Decimal('200'), 'unit': 'g', 'source_recipes': ['recipe1']},
            {'name': 'flour', 'amount': Decimal('100'), 'unit': 'g', 'source_recipes': ['recipe2']},
        ]
        result = aggregate_ingredients(ingredients)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['name'], 'flour')
        self.assertEqual(result[0]['amount'], Decimal('300'))
        self.assertEqual(result[0]['unit'], 'g')

    def test_aggregate_different_ingredients(self):
        """Test that different ingredients stay separate."""
        ingredients = [
            {'name': 'flour', 'amount': Decimal('200'), 'unit': 'g', 'source_recipes': ['recipe1']},
            {'name': 'sugar', 'amount': Decimal('100'), 'unit': 'g', 'source_recipes': ['recipe2']},
        ]
        result = aggregate_ingredients(ingredients)
        self.assertEqual(len(result), 2)

    def test_aggregate_case_insensitive(self):
        """Test that aggregation is case-insensitive."""
        ingredients = [
            {'name': 'Flour', 'amount': Decimal('200'), 'unit': 'g', 'source_recipes': ['recipe1']},
            {'name': 'flour', 'amount': Decimal('100'), 'unit': 'g', 'source_recipes': ['recipe2']},
        ]
        result = aggregate_ingredients(ingredients)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['amount'], Decimal('300'))


class GroceryListAPITest(APITestCase):
    """Test Grocery List API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create test recipes
        self.recipe1 = Recipe.objects.create(user=self.user, title='Cake', servings=8)
        Ingredient.objects.create(
            recipe=self.recipe1,
            name='flour',
            amount=Decimal('200'),
            unit='g',
        )
        Ingredient.objects.create(
            recipe=self.recipe1,
            name='sugar',
            amount=Decimal('100'),
            unit='g',
        )

        self.recipe2 = Recipe.objects.create(user=self.user, title='Bread', servings=2)
        Ingredient.objects.create(
            recipe=self.recipe2,
            name='flour',
            amount=Decimal('300'),
            unit='g',
        )

    def test_create_grocery_list(self):
        """Test creating a grocery list from recipes."""
        payload = {
            'title': 'Weekly Shopping',
            'recipe_ids': [str(self.recipe1.id), str(self.recipe2.id)],
            'date': '2024-03-09',
        }
        response = self.client.post('/api/grocery/lists/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GroceryList.objects.count(), 1)

    def test_grocery_list_aggregates_ingredients(self):
        """Test that grocery list properly aggregates ingredients."""
        payload = {
            'title': 'Shopping List',
            'recipe_ids': [str(self.recipe1.id), str(self.recipe2.id)],
        }
        response = self.client.post('/api/grocery/lists/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        grocery_list = GroceryList.objects.first()
        items = grocery_list.items.all()

        # Should have 2 items: flour (aggregated) and sugar
        self.assertEqual(items.count(), 2)

        # Check flour is aggregated
        flour = items.get(name='flour')
        self.assertEqual(flour.amount, Decimal('500'))  # 200 + 300

    def test_get_grocery_list_detail(self):
        """Test getting grocery list detail."""
        grocery_list = GroceryList.objects.create(user=self.user, title='My List')
        grocery_list.recipes.set([self.recipe1])
        GroceryItem.objects.create(
            grocery_list=grocery_list,
            name='flour',
            amount=Decimal('200'),
            unit='g',
        )

        response = self.client.get(f'/api/grocery/lists/{grocery_list.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'My List')
        self.assertEqual(len(response.data['items']), 1)

    def test_export_csv(self):
        """Test exporting grocery list as CSV."""
        grocery_list = GroceryList.objects.create(user=self.user, title='Export Test')
        GroceryItem.objects.create(
            grocery_list=grocery_list,
            name='flour',
            amount=Decimal('500'),
            unit='g',
            source_recipes=['recipe1', 'recipe2'],
        )

        response = self.client.get(f'/api/grocery/lists/{grocery_list.id}/export/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('flour', response.content.decode())
