import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, Alert, Spinner, Badge } from '../ui';
import {
  getReminders,
  markReminderDone,
  snoozeReminder,
  deleteReminder,
} from '../../lib/crmService';
import type { Reminder } from '../../lib/crmService';

export function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'due_today' | 'due_this_week'>('all');

  const loadReminders = async (status?: string) => {
    try {
      setError(null);
      const data = await getReminders(status);
      setReminders(data.results || []);
    } catch (err) {
      setError('Failed to load reminders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders(statusFilter === 'all' ? undefined : statusFilter);
  }, [statusFilter]);

  const handleMarkDone = async (id: string) => {
    try {
      const updated = await markReminderDone(id);
      setReminders(reminders.map(r => r.id === id ? updated : r));
    } catch (err) {
      setError('Failed to mark reminder done');
      console.error(err);
    }
  };

  const handleSnooze = async (id: string, days: number) => {
    try {
      const updated = await snoozeReminder(id, days);
      setReminders(reminders.map(r => r.id === id ? updated : r));
    } catch (err) {
      setError('Failed to snooze reminder');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      await deleteReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete reminder');
      console.error(err);
    }
  };

  const statusOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'overdue' as const, label: 'Overdue' },
    { value: 'due_today' as const, label: 'Due Today' },
    { value: 'due_this_week' as const, label: 'This Week' },
  ];

  return (
    <div className="space-y-3 max-w-2xl">
      {error && (
        <Alert
          variant="danger"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Card variant="gradient" padding="md">
        <CardHeader title="Reminders" />
        <div className="flex gap-1 flex-wrap">
          {statusOptions.map(option => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : reminders.length === 0 ? (
        <Card variant="default" padding="md">
          <p className="text-center text-surface-500 py-4">
            {statusFilter === 'all'
              ? 'No reminders yet'
              : `No ${statusFilter.replace('_', ' ')} reminders`}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <Card
              key={reminder.id}
              variant={reminder.is_overdue ? 'outlined' : 'default'}
              padding="md"
              className={reminder.is_overdue ? 'border-danger-500/50 bg-danger-500/10' : ''}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={reminder.done}
                      onChange={() => handleMarkDone(reminder.id)}
                      className="w-4 h-4 rounded bg-surface-800 border-surface-600"
                    />
                    <p className={`font-medium ${reminder.done ? 'line-through text-surface-500' : 'text-surface-100'}`}>
                      {reminder.message}
                    </p>
                    {reminder.contact_name && (
                      <Badge variant="info" size="sm">
                        {reminder.contact_name}
                      </Badge>
                    )}
                    {reminder.is_overdue && (
                      <Badge variant="danger" size="sm">
                        Overdue
                      </Badge>
                    )}
                  </div>
                  <p className="text-surface-400 text-small">
                    Due: {new Date(reminder.due_at).toLocaleDateString()}
                  </p>
                </div>

                {!reminder.done && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSnooze(reminder.id, 1)}
                      title="Snooze 1 day"
                    >
                      +1d
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSnooze(reminder.id, 3)}
                      title="Snooze 3 days"
                    >
                      +3d
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSnooze(reminder.id, 7)}
                      title="Snooze 1 week"
                    >
                      +1w
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(reminder.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
