import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Alert, Spinner } from '../ui';
import type { GroceryList, GroceryItem } from '../../lib/api';
import { groceryAPI } from '../../lib/api';

interface GroceryListDetailProps {
  listId: string;
  onBack: () => void;
}

export default function GroceryListDetail({ listId, onBack }: GroceryListDetailProps) {
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    loadList();
  }, [listId]);

  const loadList = async () => {
    try {
      setLoading(true);
      const data = await groceryAPI.get(listId);
      setList(data);
      setError(null);
    } catch (err) {
      setError('Failed to load grocery list');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const csvUrl = groceryAPI.export(listId);
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = `grocery-list-${list?.title}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!list?.items) return;

    const text = list.items
      .map(item => `${item.name} - ${item.amount} ${item.unit}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  if (loading) {
    return (
      <Card padding="md" className="flex justify-center py-8">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (!list || error) {
    return (
      <Card padding="md">
        <Alert variant="danger">{error || 'Grocery list not found'}</Alert>
        <Button variant="ghost" onClick={onBack} className="mt-3">
          Back to Lists
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card padding="md">
        <CardHeader
          title={list.title}
          action={
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← Back
            </Button>
          }
        />

        {list.date && (
          <p className="text-caption text-surface-400 mt-2">
            Date: {new Date(list.date).toLocaleDateString()}
          </p>
        )}

        <div className="mt-4 pb-4 border-b border-surface-700">
          <p className="text-caption text-surface-400">
            {list.recipes?.length || 0} recipes selected
          </p>
          {list.recipes && list.recipes.length > 0 && (
            <div className="mt-2 space-y-1">
              {list.recipes.map(recipe => (
                <p key={recipe.id} className="text-small text-surface-300">
                  • {recipe.title} ({recipe.servings} servings)
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-caption font-semibold text-surface-200 mb-2">
            Shopping List
          </h3>
          <div className="space-y-1.5">
            {list.items && list.items.length === 0 ? (
              <p className="text-small text-surface-500">No items</p>
            ) : (
              list.items?.map((item: GroceryItem, idx: number) => (
                <div key={item.id || idx} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-small font-medium text-surface-300">
                      {item.name}
                    </p>
                    {item.source_recipes && item.source_recipes.length > 0 && (
                      <p className="text-small text-surface-500">
                        From: {item.source_recipes.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-small text-surface-300 ml-2">
                    {parseFloat(item.amount).toFixed(2)} {item.unit}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-1.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            loading={exporting}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyToClipboard}
          >
            {copiedToClipboard ? 'Copied!' : 'Copy List'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
