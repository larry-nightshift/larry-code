import { useState, useEffect } from 'react';
import { Input, Button, Alert, Spinner } from '../ui';
import type { Recipe } from '../../lib/api';
import { recipesAPI, groceryAPI } from '../../lib/api';
import { useForm } from '../../hooks/useForm';

interface GroceryListFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export default function GroceryListForm({ onSubmit, onCancel }: GroceryListFormProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { getFieldProps, values, validate } = useForm({
    title: {
      initialValue: '',
      rules: { required: 'List name is required' },
      strategy: 'blur',
    },
    date: {
      initialValue: new Date().toISOString().split('T')[0],
      rules: {},
      strategy: 'blur',
    },
  });

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const data = await recipesAPI.list();
      setRecipes(data);
    } catch (err) {
      setError('Failed to load recipes');
    } finally {
      setLoadingRecipes(false);
    }
  };

  const toggleRecipe = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (selectedRecipes.size === 0) {
      setError('Select at least one recipe');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await groceryAPI.create({
        title: values.title,
        recipe_ids: Array.from(selectedRecipes),
        date: values.date || undefined,
      });

      onSubmit();
    } catch (err) {
      setError('Failed to create grocery list');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Input
        {...getFieldProps('title')}
        label="List Name"
        placeholder="e.g., Weekly Shopping"
      />

      <Input
        {...getFieldProps('date')}
        label="Date"
        type="date"
      />

      <div>
        <label className="block text-caption font-medium text-surface-200 mb-1.5">
          Select Recipes
        </label>

        {loadingRecipes ? (
          <Spinner size="md" />
        ) : recipes.length === 0 ? (
          <p className="text-small text-surface-500">
            No recipes available. Create a recipe first.
          </p>
        ) : (
          <div className="space-y-1.5 border border-surface-700 rounded p-2">
            {recipes.map(recipe => (
              <label
                key={recipe.id}
                className="flex items-center gap-2 p-2 hover:bg-surface-800 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRecipes.has(recipe.id!)}
                  onChange={() => toggleRecipe(recipe.id!)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-small font-medium text-surface-200">
                    {recipe.title}
                  </p>
                  <p className="text-small text-surface-500">
                    {recipe.servings} servings
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1.5 pt-3 border-t border-surface-700">
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={saving}
          fullWidth
        >
          Create List
        </Button>
        <Button variant="ghost" onClick={onCancel} fullWidth>
          Cancel
        </Button>
      </div>
    </div>
  );
}
