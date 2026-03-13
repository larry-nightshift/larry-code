import { useState } from 'react';
import type { Link } from '../../api/linksService';
import { Badge, Button, Dialog } from '../ui';

interface LinkCardProps {
  link: Link;
  onDelete: () => void;
  onQueue: () => void;
  onUnqueue: () => void;
}

export default function LinkCard({
  link,
  onDelete,
  onQueue,
  onUnqueue,
}: LinkCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const isQueued = !!link.queue_status;
  const displayUrl = new URL(link.url).hostname || link.url;

  return (
    <>
      <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 hover:border-surface-600 transition-colors">
        <div className="flex gap-3">
          {/* Favicon */}
          {link.favicon_url && (
            <img
              src={link.favicon_url}
              alt=""
              className="w-8 h-8 rounded flex-shrink-0 mt-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-body font-medium text-surface-100 mb-0.5 truncate">
              {link.title || 'Untitled'}
            </h3>

            {/* Description */}
            {link.description && (
              <p className="text-caption text-surface-400 mb-1 line-clamp-2">
                {link.description}
              </p>
            )}

            {/* URL */}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caption text-primary-400 hover:text-primary-300 block mb-1.5 truncate"
            >
              {displayUrl}
            </a>

            {/* Tags */}
            {link.tags && link.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {link.tags.map((tag) => (
                  <Badge key={tag.id} variant="default" size="sm">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Queue Status */}
            {isQueued && (
              <div className="flex items-center gap-2 text-caption">
                <Badge
                  variant={
                    link.queue_status === 'DONE'
                      ? 'success'
                      : link.queue_status === 'READING'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                >
                  {link.queue_status}
                </Badge>
                {link.queue_priority && (
                  <span className="text-surface-500">
                    Priority: {link.queue_priority}/5
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              ↗
            </a>
            <button
              onClick={isQueued ? onUnqueue : onQueue}
              className={`text-sm px-2 py-1 rounded text-center ${
                isQueued
                  ? 'text-warning-400 hover:text-warning-300'
                  : 'text-primary-400 hover:text-primary-300'
              }`}
              title={isQueued ? 'Unqueue' : 'Queue'}
            >
              {isQueued ? '✓' : '+'}
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="text-sm text-danger-400 hover:text-danger-300"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Link"
      >
        <p className="text-surface-300 mb-4">
          Are you sure you want to delete this link?
        </p>
        <p className="font-semibold text-surface-100 mb-4">
          {link.title || link.url}
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </>
  );
}
