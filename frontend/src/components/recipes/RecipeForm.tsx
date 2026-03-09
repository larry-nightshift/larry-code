import { useState } from 'react';
import { Input, Textarea, Button, Select, Alert } from '../ui';
import type { Recipe, Ingredient } from '../../lib/api';
import { recipesAPI } from '../../lib/api';
import { useForm } from '../../hooks/useForm';

interface RecipeFormProps {
  recipe?: Recipe | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const COMMON_UNITS = [
  'whole',
  'tsp',
  'tbsp',
  'cup',
  'ml',
  'l',
  'g',
  'kg',
];

export default function RecipeForm({ recipe, onSubmit, onCancel }: RecipeFormProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients || [{ name: '', amount: '', unit: 'g' }]
  );
  const [directions, setDirections] = useState<string[]>(recipe?.directions || ['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getFieldProps, values, validate } = useForm({
    title: {
      initialValue: recipe?.title || '',
      rules: { required: 'Recipe name is required' },
      strategy: 'blur',
    },
    description: {
      initialValue: recipe?.description || '',
      rules: {},
      strategy: 'blur',
    },
    servings: {
      initialValue: String(recipe?.servings || 4),
      rules: {
        required: 'Servings is required',
        pattern: { value: /^\d+$/, message: 'Must be a whole number' },
      },
      strategy: 'blur',
    },
  });

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: 'g' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleAddDirection = () => {
    setDirections([...directions, '']);
  };

  const handleRemoveDirection = (index: number) => {
    setDirections(directions.filter((_, i) => i !== index));
  };

  const handleUpdateDirection = (index: number, value: string) => {
    const updated = [...directions];
    updated[index] = value;
    setDirections(updated);
  };

  const validateIngredients = (): boolean => {
    for (const ing of ingredients) {
      if (!ing.name.trim()) {
        setError('All ingredients must have a name');
        return false;
      }
      if (!ing.amount) {
        setError('All ingredients must have an amount');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!validateIngredients()) return;

    try {
      setLoading(true);
      setError(null);

      const recipeData = {
        title: values.title,
        description: values.description,
        servings: parseInt(values.servings),
        ingredients: ingredients.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          note: ing.note || '',
        })),
        directions: directions.filter(d => d.trim()),
      };

      if (recipe?.id) {
        await recipesAPI.update(recipe.id, recipeData);
      } else {
        await recipesAPI.create(recipeData);
      }

      onSubmit();
    } catch (err) {
      setError('Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Input {...getFieldProps('title')} label="Recipe Name" placeholder="e.g., Chocolate Cake" />

      <Textarea
        {...getFieldProps('description')}
        label="Description"
        placeholder="Add notes about this recipe..."
        rows={2}
      />

      <Input
        {...getFieldProps('servings')}
        label="Servings"
        placeholder="4"
        type="number"
      />

      <div>
        <label className="block text-caption font-medium text-surface-200 mb-1.5">
          Ingredients
        </label>
        <div className="space-y-1.5">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-1.5 items-end">
              <Input
                placeholder="Ingredient name"
                value={ing.name}
                onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                size="sm"
                fullWidth={false}
                className="flex-1"
              />
              <Input
                placeholder="Amount"
                value={ing.amount}
                onChange={(e) => handleUpdateIngredient(idx, 'amount', e.target.value)}
                size="sm"
                fullWidth={false}
                className="w-20"
              />
              <Select
                options={COMMON_UNITS.map(u => ({ value: u, label: u }))}
                value={ing.unit}
                onChange={(value) => handleUpdateIngredient(idx, 'unit', value)}
                size="sm"
                fullWidth={false}
                className="w-24"
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemoveIngredient(idx)}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddIngredient}
            fullWidth
          >
            + Add Ingredient
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-caption font-medium text-surface-200 mb-1.5">
          Directions
        </label>
        <div className="space-y-1.5">
          {directions.map((dir, idx) => (
            <div key={idx} className="flex gap-1.5 items-end">
              <Input
                placeholder={`Step ${idx + 1}`}
                value={dir}
                onChange={(e) => handleUpdateDirection(idx, e.target.value)}
                size="sm"
                fullWidth={true}
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemoveDirection(idx)}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddDirection}
            fullWidth
          >
            + Add Step
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 pt-3 border-t border-surface-700">
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          fullWidth
        >
          {recipe ? 'Update Recipe' : 'Create Recipe'}
        </Button>
        <Button variant="ghost" onClick={onCancel} fullWidth>
          Cancel
        </Button>
      </div>
    </div>
  );
}
