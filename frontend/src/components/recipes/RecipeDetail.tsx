import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Alert, Spinner, Input, Dialog } from '../ui';
import type { Recipe, Ingredient } from '../../lib/api';
import { recipesAPI, groceryAPI } from '../../lib/api';

interface RecipeDetailProps {
  recipeId: string;
  onBack: () => void;
}

interface ScaledIngredient extends Ingredient {
  originalAmount: string;
}

export default function RecipeDetail({ recipeId, onBack }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desiredServings, setDesiredServings] = useState<string>('');
  const [scaledIngredients, setScaledIngredients] = useState<ScaledIngredient[]>([]);
  const [showGroceryDialog, setShowGroceryDialog] = useState(false);
  const [groceryTitle, setGroceryTitle] = useState('');
  const [savingGrocery, setSavingGrocery] = useState(false);
  const [groceryError, setGroceryError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  useEffect(() => {
    if (recipe && desiredServings) {
      scaleIngredients();
    }
  }, [recipe, desiredServings]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const data = await recipesAPI.get(recipeId);
      setRecipe(data);
      setDesiredServings(String(data.servings));
      setError(null);
    } catch (err) {
      setError('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const scaleIngredients = () => {
    if (!recipe) return;

    const scale = parseInt(desiredServings) / recipe.servings;
    const scaled = (recipe.ingredients || []).map((ing: Ingredient) => ({
      ...ing,
      originalAmount: ing.amount,
      amount: String(parseFloat(ing.amount) * scale),
    }));
    setScaledIngredients(scaled);
  };

  const handleAddToGrocery = async () => {
    if (!groceryTitle.trim()) {
      setGroceryError('Grocery list title is required');
      return;
    }

    try {
      setSavingGrocery(true);
      setGroceryError(null);

      // Create grocery list with this recipe
      await groceryAPI.create({
        title: groceryTitle,
        recipe_ids: [recipeId],
      });

      setShowGroceryDialog(false);
      setGroceryTitle('');
      alert('Recipe added to grocery list!');
    } catch (err) {
      setGroceryError('Failed to add to grocery list');
    } finally {
      setSavingGrocery(false);
    }
  };

  if (loading) {
    return (
      <Card padding="md" className="flex justify-center py-8">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (!recipe || error) {
    return (
      <Card padding="md">
        <Alert variant="danger">{error || 'Recipe not found'}</Alert>
        <Button variant="ghost" onClick={onBack} className="mt-3">
          Back to Recipes
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card padding="md">
        <CardHeader
          title={recipe.title}
          action={<Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>}
        />

        {recipe.description && (
          <p className="text-caption text-surface-400 mt-2">{recipe.description}</p>
        )}

        <div className="mt-4 pb-4 border-b border-surface-700">
          <label className="block text-caption font-medium text-surface-200 mb-1.5">
            Adjust Servings
          </label>
          <div className="flex items-center gap-3">
            <Input
              value={desiredServings}
              onChange={(e) => setDesiredServings(e.target.value)}
              type="number"
              size="sm"
              fullWidth={false}
              className="w-20"
            />
            <span className="text-caption text-surface-400">
              (Original: {recipe.servings} servings)
            </span>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-caption font-semibold text-surface-200 mb-2">
            Ingredients
          </h3>
          <div className="space-y-1.5">
            {scaledIngredients.length === 0 ? (
              <p className="text-small text-surface-500">No ingredients</p>
            ) : (
              scaledIngredients.map((ing, idx) => (
                <div key={idx} className="text-small text-surface-300">
                  <span className="font-medium">
                    {parseFloat(ing.amount).toFixed(2)} {ing.unit}
                  </span>
                  {' '}
                  {ing.name}
                  {ing.note && <span className="text-surface-500"> ({ing.note})</span>}
                </div>
              ))
            )}
          </div>
        </div>

        {recipe.directions && recipe.directions.length > 0 && (
          <div className="mt-4">
            <h3 className="text-caption font-semibold text-surface-200 mb-2">
              Directions
            </h3>
            <ol className="space-y-1.5 list-decimal list-inside">
              {recipe.directions.map((dir, idx) => (
                <li key={idx} className="text-small text-surface-300">
                  {dir}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-4 flex gap-1.5">
          <Button
            variant="primary"
            onClick={() => {
              setGroceryTitle(recipe.title);
              setShowGroceryDialog(true);
            }}
          >
            Add to Grocery List
          </Button>
        </div>
      </Card>

      <Dialog
        open={showGroceryDialog}
        onClose={() => setShowGroceryDialog(false)}
        title="Add to Grocery List"
      >
        <div className="space-y-3">
          {groceryError && (
            <Alert
              variant="danger"
              dismissible
              onDismiss={() => setGroceryError(null)}
            >
              {groceryError}
            </Alert>
          )}

          <Input
            label="Grocery List Name"
            placeholder="e.g., Weekly Shopping"
            value={groceryTitle}
            onChange={(e) => setGroceryTitle(e.target.value)}
          />

          <div className="flex gap-1.5 pt-3 border-t border-surface-700">
            <Button
              variant="primary"
              onClick={handleAddToGrocery}
              loading={savingGrocery}
              fullWidth
            >
              Add to List
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowGroceryDialog(false)}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
