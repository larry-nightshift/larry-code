import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Alert } from '../ui';
import workoutsService, { Workout } from '../../lib/workoutsService';

export default function WorkoutDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkout();
  }, [id]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const data = await workoutsService.getWorkout(id);
      setWorkout(data);
    } catch (err) {
      setError('Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !workout) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const duration = workout.ended_at
    ? new Date(new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime())
        .toISOString()
        .substr(11, 8)
    : 'In Progress';

  const totalSets =
    workout.workout_exercises?.reduce((sum, we) => sum + (we.sets?.length || 0), 0) || 0;

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <h2 className="text-h2 mb-2">{workout.routine_name || 'Workout'}</h2>
        <div className="space-y-1 text-caption text-surface-300">
          <p>Started: {new Date(workout.started_at).toLocaleString()}</p>
          {workout.ended_at && (
            <p>Ended: {new Date(workout.ended_at).toLocaleString()}</p>
          )}
          <p>Duration: {duration}</p>
          <p>Total Sets: {totalSets}</p>
        </div>
      </Card>

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

      {!workout.workout_exercises || workout.workout_exercises.length === 0 ? (
        <Card>
          <p className="text-center text-surface-500 text-caption py-4">
            No exercises logged in this workout.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {workout.workout_exercises.map((we) => (
            <Card key={we.id} variant="outlined">
              <p className="font-medium text-surface-100 mb-2">{we.exercise_name}</p>
              {(!we.sets || we.sets.length === 0) ? (
                <p className="text-caption text-surface-500">No sets logged</p>
              ) : (
                <div className="space-y-1">
                  {we.sets.map((set) => (
                    <div key={set.id} className="text-caption text-surface-400 pl-2 border-l border-surface-700">
                      Set {set.set_number}
                      {set.is_warmup && ' (warmup)'}
                      {set.weight && set.reps && ` • ${set.weight} lbs x ${set.reps}`}
                      {set.reps && !set.weight && ` • ${set.reps} reps`}
                      {set.duration_seconds && ` • ${set.duration_seconds}s`}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        fullWidth
        onClick={() => navigate('/workouts/history')}
      >
        Back to History
      </Button>
    </div>
  );
}
