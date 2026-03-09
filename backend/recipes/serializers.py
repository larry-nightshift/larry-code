from rest_framework import serializers
from .models import Recipe, Ingredient


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'amount', 'unit', 'note']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value


class RecipeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ['id', 'title', 'servings', 'created_at']


class RecipeDetailSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'description', 'servings', 'directions', 'ingredients', 'created_at', 'updated_at']

    def validate_servings(self, value):
        if value <= 0:
            raise serializers.ValidationError("Servings must be positive.")
        return value


class RecipeCreateUpdateSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True, write_only=True, required=True)

    class Meta:
        model = Recipe
        fields = ['title', 'description', 'servings', 'directions', 'ingredients']

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients')
        recipe = Recipe.objects.create(**validated_data)
        for ingredient_data in ingredients_data:
            Ingredient.objects.create(recipe=recipe, **ingredient_data)
        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ingredients_data is not None:
            instance.ingredients.all().delete()
            for ingredient_data in ingredients_data:
                Ingredient.objects.create(recipe=instance, **ingredient_data)

        return instance
