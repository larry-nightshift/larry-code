import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Spinner, Alert } from '../ui';
import workoutsService, { Workout } from '../../lib/workoutsService';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadWorkouts();
  }, [fromDate, toDate]);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const data = await workoutsService.listWorkouts(fromDate || undefined, toDate || undefined);
      setWorkouts(data.results);
    } catch (err) {
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (confirm('Delete this workout?')) {
      try {
        await fetch(`/api/workouts/workouts/${id}/`, {
          method: 'DELETE',
          credentials: 'include',
        });
        await loadWorkouts();
      } catch (err) {
        setError('Failed to delete workout');
      }
    }
  };

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <h2 className="text-h2 mb-2">Workout History</h2>
        <p className="text-caption text-surface-300">View and filter your past workouts</p>
      </Card>

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

      <Card>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            size="sm"
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            size="sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner />
          </div>
        ) : workouts.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">
            No workouts found. Start one to see it here!
          </p>
        ) : (
          <div className="space-y-2">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-start justify-between p-3 bg-surface-900 rounded border border-surface-700 hover:border-surface-600 transition-colors"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/workouts/${workout.id}`)}
                >
                  <p className="font-medium text-surface-100">
                    {workout.routine_name || 'Workout'}
                  </p>
                  <p className="text-caption text-surface-500 mt-0.5">
                    {new Date(workout.started_at).toLocaleString()}
                  </p>
                  {workout.exercise_count !== undefined && (
                    <p className="text-caption text-surface-400 mt-1">
                      {workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/workouts/${workout.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteWorkout(workout.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
