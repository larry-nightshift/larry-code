from rest_framework import serializers
from decimal import Decimal
from .models import GroceryList, GroceryItem
from recipes.models import Recipe
from recipes.serializers import RecipeListSerializer
from .aggregation import aggregate_ingredients, convert_amount


class GroceryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroceryItem
        fields = ['id', 'name', 'amount', 'unit', 'source_recipes']


class GroceryListDetailSerializer(serializers.ModelSerializer):
    items = GroceryItemSerializer(many=True, read_only=True)
    recipes = RecipeListSerializer(many=True, read_only=True)

    class Meta:
        model = GroceryList
        fields = ['id', 'title', 'recipes', 'date', 'items', 'created_at', 'updated_at']


class GroceryListCreateUpdateSerializer(serializers.ModelSerializer):
    recipe_ids = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        write_only=True,
        many=True,
        required=True,
        source='recipes'
    )

    class Meta:
        model = GroceryList
        fields = ['title', 'recipe_ids', 'date']

    def create(self, validated_data):
        recipes = validated_data.pop('recipes')
        grocery_list = GroceryList.objects.create(**validated_data)
        grocery_list.recipes.set(recipes)

        # Generate aggregated items
        self._generate_items(grocery_list, recipes)

        return grocery_list

    def update(self, instance, validated_data):
        recipes = validated_data.pop('recipes', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if recipes is not None:
            instance.recipes.set(recipes)
            # Clear existing items and regenerate
            instance.items.all().delete()
            self._generate_items(instance, recipes)

        return instance

    def _generate_items(self, grocery_list, recipes):
        """Generate aggregated grocery items from recipes."""
        # Collect all ingredients from selected recipes
        all_ingredients = []

        for recipe in recipes:
            for ingredient in recipe.ingredients.all():
                # Scale ingredient to recipe servings (recipes should be pre-scaled by frontend)
                all_ingredients.append({
                    'name': ingredient.name,
                    'amount': ingredient.amount,
                    'unit': ingredient.unit,
                    'source_recipes': [str(recipe.id)],
                })

        # Aggregate
        aggregated = aggregate_ingredients(all_ingredients)

        # Create GroceryItems
        for item_data in aggregated:
            GroceryItem.objects.create(
                grocery_list=grocery_list,
                name=item_data['name'],
                amount=item_data['amount'],
                unit=item_data['unit'],
                source_recipes=item_data.get('source_recipes', []),
            )


class GroceryListListSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroceryList
        fields = ['id', 'title', 'date', 'created_at']
