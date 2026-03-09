import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { upcomingAPI } from '../lib/api';
import type { UpcomingItem } from '../lib/api';
import { Card, CardHeader, Button, Input, Textarea, Badge, Spinner, Alert } from './ui';

export function UpcomingWidget() {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await upcomingAPI.list();
      setItems(data || []);
    } catch (err) {
      setError('Failed to load upcoming items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newStartsAt) return;

    try {
      setLoading(true);
      await upcomingAPI.create(newTitle, newStartsAt, newNotes || undefined);
      setNewTitle('');
      setNewStartsAt('');
      setNewNotes('');
      setShowForm(false);
      await loadItems();
    } catch (err) {
      setError('Failed to create upcoming item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await upcomingAPI.delete(id);
      await loadItems();
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  const formatDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const upcomingItems = items.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );

  const now = new Date();
  const nextItems = upcomingItems.filter(
    (item) => new Date(item.starts_at) > now
  );
  const pastItems = upcomingItems.filter(
    (item) => new Date(item.starts_at) <= now
  );

  return (
    <Card variant="gradient">
      <CardHeader
        title="Upcoming"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={16} className="mr-0.5" />
            Add Event
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">
          {error}
        </Alert>
      )}

      {/* Add event form */}
      {showForm && (
        <Card variant="outlined" padding="sm" className="mb-2">
          <div className="space-y-1.5">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Event title"
              size="sm"
            />
            <Input
              type="datetime-local"
              value={newStartsAt}
              onChange={(e) => setNewStartsAt(e.target.value)}
              size="sm"
            />
            <Textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              size="sm"
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={loading || !newTitle.trim() || !newStartsAt}
                loading={loading}
              >
                Add Event
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-5">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-2">
          {nextItems.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar size={14} className="text-primary-400" />
                <h3 className="text-caption font-medium text-surface-400">
                  Upcoming ({nextItems.length})
                </h3>
              </div>
              <div className="space-y-1">
                {nextItems.map((item) => (
                  <UpcomingItemRow
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    formatDateTime={formatDateTime}
                  />
                ))}
              </div>
            </div>
          )}

          {pastItems.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Clock size={14} className="text-surface-500" />
                <h3 className="text-caption font-medium text-surface-500">
                  Past ({pastItems.length})
                </h3>
              </div>
              <div className="space-y-1">
                {pastItems.map((item) => (
                  <UpcomingItemRow
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    formatDateTime={formatDateTime}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <p className="text-center text-surface-500 py-4 text-caption">
              No upcoming items. Add one above!
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function UpcomingItemRow({
  item,
  onDelete,
  formatDateTime,
  isPast = false,
}: {
  item: UpcomingItem;
  onDelete: (id: number) => void;
  formatDateTime: (dateTime: string) => string;
  isPast?: boolean;
}) {
  return (
    <div
      className={`p-1.5 rounded-lg border transition-base ${
        isPast
          ? 'border-surface-700/50 bg-surface-800/30 opacity-60'
          : 'border-surface-700 bg-surface-800/50 hover:border-surface-600'
      }`}
    >
      <div className="flex justify-between items-start gap-1">
        <div className="flex-1 min-w-0">
          <h4 className="text-caption font-medium text-surface-200 truncate">{item.title}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge variant={isPast ? 'default' : 'primary'} size="sm">
              {formatDateTime(item.starts_at)}
            </Badge>
          </div>
          {item.notes && (
            <p className="text-small text-surface-500 mt-0.5 line-clamp-2">{item.notes}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item.id)}
          className="text-danger-400 hover:text-danger-300 hover:bg-danger-500/10 flex-shrink-0"
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}
