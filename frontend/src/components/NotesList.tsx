import { useState, useEffect } from 'react';
import { notesAPI } from '../lib/api';
import type { Note } from '../lib/api';
import { Button, Card, CardHeader, Input, Textarea, Badge, Alert } from './ui';

export function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notesAPI.list();
      setNotes(data || []);
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newBody.trim()) return;

    try {
      setLoading(true);
      await notesAPI.create(newTitle, newBody);
      setNewTitle('');
      setNewBody('');
      await loadNotes();
    } catch (err) {
      setError('Failed to create note');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await notesAPI.update(note.id, { pinned: !note.pinned });
      await loadNotes();
    } catch (err) {
      setError('Failed to update note');
      console.error(err);
    }
  };

  const handleToggleArchive = async (note: Note) => {
    try {
      await notesAPI.update(note.id, { archived: !note.archived });
      await loadNotes();
    } catch (err) {
      setError('Failed to update note');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notesAPI.delete(id);
      await loadNotes();
    } catch (err) {
      setError('Failed to delete note');
      console.error(err);
    }
  };

  const activeNotes = notes.filter((n) => !n.archived);
  const pinnedNotes = activeNotes.filter((n) => n.pinned);
  const unpinnedNotes = activeNotes.filter((n) => !n.pinned);

  return (
    <Card variant="gradient" padding="md" className="animate-fade-in">
      <CardHeader title="Notes" />

      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">
          {error}
        </Alert>
      )}

      {/* Add note form */}
      <Card variant="outlined" padding="sm" className="mb-3">
        <div className="space-y-1.5">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title (optional)"
          />
          <Textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Note content"
            rows={2}
          />
          <Button
            onClick={handleCreate}
            disabled={loading || !newBody.trim()}
            size="sm"
            fullWidth
          >
            Create Note
          </Button>
        </div>
      </Card>

      {loading && notes.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && (
            <div>
              <h3 className="text-caption font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                Pinned
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {pinnedNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onPin={handleTogglePin}
                    onArchive={handleToggleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {unpinnedNotes.length > 0 && (
            <div>
              <h3 className="text-caption font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                Notes
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {unpinnedNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onPin={handleTogglePin}
                    onArchive={handleToggleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {activeNotes.length === 0 && (
            <p className="text-center text-surface-500 text-caption py-4">
              No notes yet. Create one above!
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function NoteItem({
  note,
  onPin,
  onArchive,
  onDelete,
}: {
  note: Note;
  onPin: (note: Note) => void;
  onArchive: (note: Note) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card variant="outlined" padding="sm" hoverable className="group">
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            {note.title && (
              <h4 className="font-medium text-body text-surface-100 truncate">{note.title}</h4>
            )}
            {note.pinned && (
              <Badge variant="warning" size="sm">Pinned</Badge>
            )}
          </div>
          <p className="text-caption text-surface-300 line-clamp-3">{note.body}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant={note.pinned ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => onPin(note)}
        >
          {note.pinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onArchive(note)}>
          Archive
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(note.id)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
