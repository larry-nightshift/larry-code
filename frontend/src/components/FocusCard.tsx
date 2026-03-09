import { useState, useEffect } from 'react';
import { focusAPI } from '../lib/api';
import type { FocusData } from '../lib/api';

export function FocusCard() {
  const [focus, setFocus] = useState<FocusData | null>(null);
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFocus();
  }, []);

  const loadFocus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await focusAPI.getToday();
      if (data) {
        setFocus(data);
        setText(data.text);
      } else {
        setFocus(null);
        setText('');
      }
    } catch (err) {
      setError('Failed to load focus');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await focusAPI.setToday(text);
      setFocus(data);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save focus');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setText(focus?.text || '');
    setIsEditing(false);
  };

  if (loading && !focus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Focus</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {!isEditing ? (
        <div>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg min-h-24">
            {focus?.text ? (
              <p className="text-gray-800 text-lg">{focus.text}</p>
            ) : (
              <p className="text-gray-400 italic">
                No focus set for today. Click edit to add one.
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's your main focus for today?"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
