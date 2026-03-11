import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Alert } from '../ui';
import workoutsService, { Routine } from '../../lib/workoutsService';

export default function WorkoutStartPage() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingBlank, setCreatingBlank] = useState(false);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const data = await workoutsService.listRoutines();
      setRoutines(data.results);
    } catch (err) {
      setError('Failed to load routines');
    } finally {
      setLoading(false);
    }
  };

  const handleStartFromRoutine = async (routineId: string) => {
    try {
      const workout = await workoutsService.createWorkout(routineId);
      navigate(`/workouts/session/${workout.id}`);
    } catch (err) {
      setError('Failed to start workout');
    }
  };

  const handleStartBlankWorkout = async () => {
    setCreatingBlank(true);
    try {
      const workout = await workoutsService.createWorkout();
      navigate(`/workouts/session/${workout.id}`);
    } catch (err) {
      setError('Failed to start workout');
      setCreatingBlank(false);
    }
  };

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      <Card variant="gradient" padding="lg">
        <h1 className="text-h1 mb-2">Start a Workout</h1>
        <p className="text-body text-surface-300">
          Pick a routine or start a blank workout and add exercises as you go.
        </p>
      </Card>

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

      <Card>
        <h2 className="text-h2 mb-3">Blank Workout</h2>
        <p className="text-caption text-surface-500 mb-2">
          Start with no preset exercises and add them as you go.
        </p>
        <Button
          variant="primary"
          fullWidth
          loading={creatingBlank}
          onClick={handleStartBlankWorkout}
        >
          Start Blank Workout
        </Button>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <Spinner />
        </div>
      ) : routines.length === 0 ? (
        <Card>
          <p className="text-center text-surface-500 text-caption py-4">
            No routines found. Create one on the Routines page first.
          </p>
        </Card>
      ) : (
        <>
          <h2 className="text-h2">Your Routines</h2>
          <div className="space-y-2">
            {routines.map((routine) => (
              <Card key={routine.id} variant="outlined" hoverable>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-surface-100">{routine.name}</p>
                    {routine.description && (
                      <p className="text-caption text-surface-500 mt-0.5">{routine.description}</p>
                    )}
                    {routine.items.length > 0 && (
                      <p className="text-caption text-surface-400 mt-1">
                        {routine.items.length} exercise{routine.items.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartFromRoutine(routine.id)}
                  >
                    Start
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
