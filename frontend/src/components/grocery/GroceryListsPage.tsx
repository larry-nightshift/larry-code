import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Alert, Spinner, Dialog } from '../ui';
import type { GroceryList } from '../../lib/api';
import { groceryAPI } from '../../lib/api';
import GroceryListForm from './GroceryListForm';
import GroceryListDetail from './GroceryListDetail';

export default function GroceryListsPage() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setLoading(true);
      const data = await groceryAPI.list();
      setLists(data);
      setError(null);
    } catch (err) {
      setError('Failed to load grocery lists');
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSubmit = async () => {
    handleFormClose();
    loadLists();
  };

  const handleDelete = async (id: string) => {
    try {
      await groceryAPI.delete(id);
      setLists(lists.filter(l => l.id !== id));
    } catch (err) {
      setError('Failed to delete grocery list');
    }
  };

  if (selectedList) {
    return (
      <GroceryListDetail
        listId={selectedList.id}
        onBack={() => {
          setSelectedList(null);
          loadLists();
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card padding="md">
        <CardHeader
          title="Grocery Lists"
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              New List
            </Button>
          }
        />

        <div className="space-y-3 mt-3">
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
          ) : lists.length === 0 ? (
            <p className="text-center text-surface-500 text-caption py-4">
              No grocery lists yet. Create one above!
            </p>
          ) : (
            <div className="space-y-2">
              {lists.map(list => (
                <Card
                  key={list.id}
                  variant="outlined"
                  padding="md"
                  hoverable
                >
                  <div
                    onClick={() => setSelectedList(list)}
                    className="cursor-pointer"
                  >
                    <h3 className="text-body font-semibold">{list.title}</h3>
                    <p className="text-small text-surface-500 mt-1">
                      {list.recipes?.length || 0} recipes
                      {list.date && ` • ${list.date}`}
                    </p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedList(list)}
                    >
                      View
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(list.id)}
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
        title="New Grocery List"
      >
        <GroceryListForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      </Dialog>
    </div>
  );
}
