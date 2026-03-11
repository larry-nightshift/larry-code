import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, Button, Alert, Spinner, Badge } from '../ui';
import { CalendarGrid } from './CalendarGrid';
import { StreakBadge } from './StreakBadge';
import { HabitFormModal } from './HabitFormModal';
import type { TodayHabit, Habit, CalendarData } from '../../lib/habitsService';
import {
  habitDetail,
  getHabitCalendar,
  toggleCheckin,
  updateHabit,
  deleteHabit,
} from '../../lib/habitsService';

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<TodayHabit | null>(null);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    if (id) {
      loadHabit();
    }
  }, [id]);

  const loadHabit = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [habitData, calendarData] = await Promise.all([
        habitDetail(id),
        getHabitCalendar(id),
      ]);
      setHabit(habitData);
      setCalendar(calendarData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habit');
    } finally {
      setLoading(false);
    }
  };

  const handleDateToggle = async (date: string) => {
    if (!id) return;
    try {
      await toggleCheckin(id, date);
      loadHabit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle date');
    }
  };

  const handleUpdateHabit = async (data: Partial<Habit>) => {
    if (!id) return;
    try {
      await updateHabit(id, data);
      setEditModalOpen(false);
      loadHabit();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteHabit = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this habit?')) return;
    try {
      await deleteHabit(id);
      navigate('/habits');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete habit');
    }
  };

  if (loading || !habit) {
    return (
      <Card padding="md">
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1));

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card padding="md" variant="gradient">
        <CardHeader
          title={habit.name}
          action={
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(true)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteHabit}>
                Delete
              </Button>
            </div>
          }
        />

        <div className="space-y-3 mt-3">
          {habit.description && (
            <p className="text-surface-400 text-caption">{habit.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-small text-surface-500">Schedule: </span>
              <Badge variant="info" size="sm">
                {habit.schedule_type === 'DAILY'
                  ? 'Daily'
                  : `${habit.weekly_target}x per week`}
              </Badge>
            </div>
            <StreakBadge current={habit.current_streak} best={habit.best_streak} />
          </div>
        </div>
      </Card>

      <Card padding="md">
        <CardHeader title="History" />

        <div className="mt-3 space-y-3">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              ← Prev
            </Button>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              Next →
            </Button>
          </div>

          {calendar && (
            <CalendarGrid
              dates={calendar.dates}
              onDateClick={handleDateToggle}
              color={habit?.color}
            />
          )}
        </div>
      </Card>

      <HabitFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateHabit}
        initialData={habit}
        isEditing
      />
    </div>
  );
}
