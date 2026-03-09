import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Alert, Spinner, Input, Dialog } from '../ui';
import type { Recipe } from '../../lib/api';
import { recipesAPI } from '../../lib/api';
import RecipeForm from './RecipeForm';

export default function RecipesList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await recipesAPI.list();
      setRecipes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await recipesAPI.search(query);
        setRecipes(results);
      } catch (err) {
        setError('Failed to search recipes');
      }
    } else {
      loadRecipes();
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecipe(null);
  };

  const handleFormSubmit = async () => {
    handleFormClose();
    loadRecipes();
  };

  const handleDelete = async (id: string) => {
    try {
      await recipesAPI.delete(id);
      setRecipes(recipes.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete recipe');
    }
  };

  return (
    <div className="space-y-3">
      <Card padding="md">
        <CardHeader
          title="Recipes"
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingRecipe(null);
                setShowForm(true);
              }}
            >
              Add Recipe
            </Button>
          }
        />
        <div className="space-y-3 mt-3">
          <Input
            label="Search recipes"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={handleSearch}
          />

          {error && (
            <Alert
              variant="danger"
              dismissible
              onDismiss={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-center text-surface-500 text-caption py-4">
              No recipes yet. Create one above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipes.map(recipe => (
                <Card
                  key={recipe.id}
                  variant="outlined"
                  padding="md"
                  hoverable
                  className="cursor-pointer"
                >
                  <div
                    onClick={() => {
                      setEditingRecipe(recipe);
                      setShowForm(true);
                    }}
                  >
                    <h3 className="text-body font-semibold">{recipe.title}</h3>
                    {recipe.description && (
                      <p className="text-caption text-surface-400 mt-1">
                        {recipe.description}
                      </p>
                    )}
                    <p className="text-small text-surface-500 mt-2">
                      {recipe.servings} servings
                      {recipe.ingredients && ` • ${recipe.ingredients.length} ingredients`}
                    </p>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRecipe(recipe);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(recipe.id!)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Dialog
        open={showForm}
        onClose={handleFormClose}
        title={editingRecipe ? 'Edit Recipe' : 'New Recipe'}
      >
        <RecipeForm
          recipe={editingRecipe}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      </Dialog>
    </div>
  );
}
