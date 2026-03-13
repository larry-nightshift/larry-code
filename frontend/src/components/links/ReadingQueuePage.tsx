import { useEffect, useState, useCallback } from 'react';
import { linksService } from '../../api/linksService';
import type { ReadingQueueItem } from '../../api/linksService';
import { Button, Alert, Badge, Card, CardHeader, Select, Dialog, Spinner } from '../ui';

export default function ReadingQueuePage() {
  const [queue, setQueue] = useState<ReadingQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('QUEUED');
  const [sortBy, setSortBy] = useState('-priority');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPriority, setEditPriority] = useState(3);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await linksService.getQueue({
        status: statusFilter,
        sort: sortBy,
        page,
        page_size: 20,
      });

      setQueue(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, page]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setError(null);
      await linksService.updateQueueItem(id, { status });
      setStatusFilter(status); // Auto-switch to new status
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleUpdatePriority = async (id: string) => {
    try {
      setError(null);
      await linksService.updateQueueItem(id, { priority: editPriority });
      setEditingId(null);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };

  const handleDeleteQueueItem = async (id: string) => {
    try {
      setError(null);
      await linksService.deleteQueueItem(id);
      setDeleteId(null);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete queue item');
    }
  };

  const totalPages = Math.ceil(totalCount / 20);
  const statusOptions = [
    { value: 'QUEUED', label: 'Queued' },
    { value: 'READING', label: 'Reading' },
    { value: 'DONE', label: 'Done' },
    { value: 'SKIPPED', label: 'Skipped' },
  ];

  const sortOptions = [
    { value: '-priority', label: 'Priority (High to Low)' },
    { value: 'priority', label: 'Priority (Low to High)' },
    { value: '-queued_at', label: 'Newest First' },
    { value: 'queued_at', label: 'Oldest First' },
    { value: 'due_date', label: 'Due Date' },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <Alert
          variant="danger"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card padding="md">
        <CardHeader title="Reading Queue" />
        <div className="grid grid-cols-2 gap-2">
          <Select
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Sort by"
            options={sortOptions}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {/* Queue Items */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : queue.length === 0 ? (
        <Card padding="md">
          <p className="text-center text-surface-500">
            No items in queue. Add links to your reading list!
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {queue.map((item) => (
              <div
                key={item.id}
                className="bg-surface-800 border border-surface-700 rounded-lg p-3 hover:border-surface-600 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Link Title */}
                    <h3 className="text-body font-medium text-surface-100 mb-0.5 truncate">
                      {item.link.title || 'Untitled'}
                    </h3>

                    {/* URL */}
                    <a
                      href={item.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-caption text-primary-400 hover:text-primary-300 block mb-2 truncate"
                    >
                      {new URL(item.link.url).hostname}
                    </a>

                    {/* Priority and Status */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-caption text-surface-500">Priority:</span>
                        <Badge variant="default" size="sm">
                          {item.priority}/5
                        </Badge>
                      </div>
                      <Badge
                        variant={
                          item.status === 'DONE'
                            ? 'success'
                            : item.status === 'READING'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <a
                      href={item.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-400 hover:text-primary-300"
                      title="Open link"
                    >
                      ↗
                    </a>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditPriority(item.priority);
                      }}
                      className="text-sm text-secondary-400 hover:text-secondary-300"
                      title="Edit priority"
                    >
                      ⚙
                    </button>
                    {item.status !== 'DONE' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            item.id,
                            item.status === 'QUEUED' ? 'READING' : 'DONE'
                          )
                        }
                        className="text-sm text-success-400 hover:text-success-300"
                        title={
                          item.status === 'QUEUED' ? 'Start reading' : 'Mark done'
                        }
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="text-sm text-danger-400 hover:text-danger-300"
                      title="Remove from queue"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Edit Priority Form */}
                {editingId === item.id && (
                  <div className="mt-3 pt-3 border-t border-surface-700 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-caption text-surface-400 mb-1">
                        Priority (1-5)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={editPriority}
                        onChange={(e) =>
                          setEditPriority(parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-1 pt-5">
                      <button
                        onClick={() => handleUpdatePriority(item.id)}
                        className="text-sm text-success-400 hover:text-success-300"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-danger-400 hover:text-danger-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-caption text-surface-400 flex items-center">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Dialog */}
      {deleteId && (
        <Dialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          title="Remove from Queue"
        >
          <p className="text-surface-300 mb-4">
            Remove this link from your reading queue?
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => handleDeleteQueueItem(deleteId)}
            >
              Remove
            </Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
