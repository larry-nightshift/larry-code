import { useState } from 'react';
import { Dialog, Button, Input, Select, Spinner, Alert } from '../ui';
import type { Habit } from '../../lib/habitsService';

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Habit>) => Promise<void>;
  initialData?: Partial<Habit>;
  isEditing?: boolean;
}

export function HabitFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isEditing,
}: HabitFormModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [scheduleType, setScheduleType] = useState<'DAILY' | 'WEEKLY'>(
    (initialData?.schedule_type as 'DAILY' | 'WEEKLY') || 'DAILY'
  );
  const [weeklyTarget, setWeeklyTarget] = useState(
    initialData?.weekly_target?.toString() || '3'
  );
  const [startDate, setStartDate] = useState(
    initialData?.start_date || new Date().toISOString().split('T')[0]
  );
  const [color, setColor] = useState(initialData?.color || 'primary-500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: Partial<Habit> = {
        name,
        description,
        schedule_type: scheduleType,
        start_date: startDate,
        color,
      };

      if (scheduleType === 'WEEKLY') {
        data.weekly_target = parseInt(weeklyTarget, 10);
      }

      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save habit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(initialData?.name || '');
    setDescription(initialData?.description || '');
    setScheduleType((initialData?.schedule_type as 'DAILY' | 'WEEKLY') || 'DAILY');
    setWeeklyTarget(initialData?.weekly_target?.toString() || '3');
    setStartDate(initialData?.start_date || new Date().toISOString().split('T')[0]);
    setColor(initialData?.color || 'primary-500');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title={isEditing ? 'Edit Habit' : 'New Habit'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Input
          label="Habit Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Exercise, Meditate"
          required
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes..."
        />

        <Select
          label="Schedule Type"
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value as 'DAILY' | 'WEEKLY')}
          options={[
            { value: 'DAILY', label: 'Daily' },
            { value: 'WEEKLY', label: 'Weekly' },
          ]}
        />

        {scheduleType === 'WEEKLY' && (
          <Select
            label="Target per Week"
            value={weeklyTarget}
            onChange={(e) => setWeeklyTarget(e.target.value)}
            options={[
              { value: '1', label: '1 time' },
              { value: '2', label: '2 times' },
              { value: '3', label: '3 times' },
              { value: '4', label: '4 times' },
              { value: '5', label: '5 times' },
              { value: '6', label: '6 times' },
              { value: '7', label: '7 times' },
            ]}
          />
        )}

        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <Select
          label="Color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          options={[
            { value: 'primary-500', label: 'Blue' },
            { value: 'success-500', label: 'Green' },
            { value: 'warning-500', label: 'Yellow' },
            { value: 'danger-500', label: 'Red' },
            { value: 'info-500', label: 'Cyan' },
          ]}
        />

        <div className="flex gap-1.5 pt-2">
          <Button type="submit" variant="primary" disabled={loading} fullWidth>
            {loading ? <Spinner size="sm" /> : isEditing ? 'Save Changes' : 'Create Habit'}
          </Button>
          <Button type="button" variant="ghost" onClick={handleClose} fullWidth>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
