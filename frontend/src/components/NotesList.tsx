import { useState, useEffect } from 'react';
import { notesAPI } from '../lib/api';
import type { Note } from '../lib/api';

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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Notes</h2>

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
          placeholder="Note title (optional)"
          className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Note content"
          className="w-full p-2 border border-gray-300 rounded mb-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreate}
          disabled={loading || !newBody.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Create Note
        </button>
      </div>

      {loading && notes.length === 0 ? (
        <div className="text-center text-gray-400">Loading notes...</div>
      ) : (
        <div>
          {pinnedNotes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Pinned
              </h3>
              <div className="space-y-3">
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
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Notes
              </h3>
              <div className="space-y-3">
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
            <p className="text-center text-gray-400">
              No notes yet. Create one above!
            </p>
          )}
        </div>
      )}
    </div>
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
    <div className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
      {note.title && <h4 className="font-semibold text-gray-900">{note.title}</h4>}
      <p className="text-gray-700 text-sm">{note.body}</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onPin(note)}
          className={`px-2 py-1 text-xs rounded ${
            note.pinned
              ? 'bg-yellow-200 text-yellow-800'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {note.pinned ? '📌 Pinned' : 'Pin'}
        </button>
        <button
          onClick={() => onArchive(note)}
          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
        >
          Archive
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
