import { useState, useEffect } from 'react';
import { focusAPI } from '../lib/api';
import type { FocusData } from '../lib/api';
import { Button, Card, CardHeader, Textarea, Alert } from './ui';

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
      <Card variant="gradient" padding="md">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="gradient" padding="md" className="animate-fade-in">
      <CardHeader
        title="Today's Focus"
        action={
          !isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">
          {error}
        </Alert>
      )}

      {!isEditing ? (
        <div className="rounded-lg bg-surface-800/50 border border-surface-700/50 p-2 min-h-[80px]">
          {focus?.text ? (
            <p className="text-body text-surface-200">{focus.text}</p>
          ) : (
            <p className="text-body text-surface-500 italic">
              No focus set for today. Click edit to add one.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's your main focus for today?"
            rows={3}
          />
          <div className="flex gap-1.5">
            <Button onClick={handleSave} loading={loading} size="sm">
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
