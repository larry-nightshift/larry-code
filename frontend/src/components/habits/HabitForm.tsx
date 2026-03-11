import { useState } from 'react';
import type { Habit } from '../../lib/habitsService';
import { Button, Input, Select, Textarea, Alert } from '../ui';
import { useForm } from '../../hooks/useForm';

interface HabitFormProps {
  initialHabit?: Habit;
  onSubmit: (data: {
    name: string;
    description?: string;
    schedule_type: 'DAILY' | 'WEEKLY';
    weekly_target?: number;
    start_date: string;
    color?: string;
  }) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

const colorOptions = [
  { value: 'primary-500', label: 'Blue' },
  { value: 'success-500', label: 'Green' },
  { value: 'warning-500', label: 'Orange' },
  { value: 'danger-500', label: 'Red' },
  { value: 'info-500', label: 'Cyan' },
  { value: 'purple-500', label: 'Purple' },
];

export function HabitForm({ initialHabit, onSubmit, isLoading, error }: HabitFormProps) {
  const { getFieldProps, values, validate } = useForm({
    name: {
      initialValue: initialHabit?.name || '',
      rules: { required: 'Habit name is required' },
    },
    description: {
      initialValue: initialHabit?.description || '',
    },
    schedule_type: {
      initialValue: initialHabit?.schedule_type || 'DAILY',
    },
    weekly_target: {
      initialValue: initialHabit?.weekly_target?.toString() || '1',
    },
    start_date: {
      initialValue: initialHabit?.start_date || new Date().toISOString().split('T')[0],
    },
    color: {
      initialValue: initialHabit?.color || 'primary-500',
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(error || null);

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitError(null);
      await onSubmit({
        name: values.name,
        description: values.description || undefined,
        schedule_type: values.schedule_type as 'DAILY' | 'WEEKLY',
        weekly_target:
          values.schedule_type === 'WEEKLY' ? parseInt(values.weekly_target) : undefined,
        start_date: values.start_date,
        color: values.color,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save habit');
    }
  };

  return (
    <div className="space-y-3">
      {submitError && (
        <Alert variant="danger" dismissible onDismiss={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Input {...getFieldProps('name')} label="Habit Name" placeholder="e.g., Exercise" />

      <Textarea
        {...getFieldProps('description')}
        label="Description (optional)"
        placeholder="What's this habit about?"
        rows={2}
      />

      <Select
        {...getFieldProps('schedule_type')}
        label="Schedule Type"
        options={[
          { value: 'DAILY', label: 'Daily' },
          { value: 'WEEKLY', label: 'Weekly' },
        ]}
      />

      {values.schedule_type === 'WEEKLY' && (
        <Select
          {...getFieldProps('weekly_target')}
          label="Target (days per week)"
          options={[
            { value: '1', label: '1 day' },
            { value: '2', label: '2 days' },
            { value: '3', label: '3 days' },
            { value: '4', label: '4 days' },
            { value: '5', label: '5 days' },
            { value: '6', label: '6 days' },
            { value: '7', label: '7 days' },
          ]}
        />
      )}

      <Input
        {...getFieldProps('start_date')}
        label="Start Date"
        type="date"
      />

      <Select
        {...getFieldProps('color')}
        label="Color (optional)"
        options={colorOptions}
      />

      <Button
        variant="primary"
        onClick={handleSubmit}
        loading={isLoading}
        fullWidth
      >
        {initialHabit ? 'Update Habit' : 'Create Habit'}
      </Button>
    </div>
  );
}
