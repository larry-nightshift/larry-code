import { useState, useEffect } from 'react';
import { upcomingAPI } from '../lib/api';
import type { UpcomingItem } from '../lib/api';

export function UpcomingWidget() {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 border border-gray-300 rounded-lg">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Event title"
          className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="datetime-local"
          value={newStartsAt}
          onChange={(e) => setNewStartsAt(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="w-full p-2 border border-gray-300 rounded mb-2 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreate}
          disabled={loading || !newTitle.trim() || !newStartsAt}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Add Event
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center text-gray-400">Loading upcoming items...</div>
      ) : (
        <div>
          {nextItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Upcoming ({nextItems.length})
              </h3>
              <div className="space-y-3">
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
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Past ({pastItems.length})
              </h3>
              <div className="space-y-3">
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
            <p className="text-center text-gray-400">
              No upcoming items. Add one above!
            </p>
          )}
        </div>
      )}
    </div>
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
      className={`p-3 border border-gray-300 rounded-lg ${
        isPast ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{item.title}</h4>
          <p className="text-sm text-gray-600">
            {formatDateTime(item.starts_at)}
          </p>
          {item.notes && (
            <p className="text-sm text-gray-700 mt-1">{item.notes}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded hover:bg-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
