import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Alert, Spinner } from '../ui';
import { HabitRow } from './HabitRow';
import { HabitFormModal } from './HabitFormModal';
import { getToday, toggleCheckin, createHabit, TodayHabit, Habit } from '../../lib/habitsService';

export function TodayPage() {
  const [habits, setHabits] = useState<TodayHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getToday();
      setHabits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheckin = async (habit_id: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await toggleCheckin(habit_id, today);
      // Update local state optimistically
      setHabits(
        habits.map((h) =>
          h.id === habit_id
            ? {
                ...h,
                completed_today: response.completed,
                current_streak: response.current_streak || h.current_streak,
              }
            : h
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle habit');
      // Reload on error
      setTimeout(loadHabits, 1000);
    }
  };

  const handleCreateHabit = async (data: Partial<Habit>) => {
    try {
      await createHabit(data);
      setModalOpen(false);
      loadHabits();
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card padding="md">
        <CardHeader
          title="Today's Habits"
          action={
            <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
              + Add
            </Button>
          }
        />

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">
            {error}
          </Alert>
        )}

        {habits.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">
            No active habits. Create one to get started!
          </p>
        ) : (
          <div className="space-y-2 mt-2">
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                onToggle={() => handleToggleCheckin(habit.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <HabitFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateHabit}
      />
    </div>
  );
}
