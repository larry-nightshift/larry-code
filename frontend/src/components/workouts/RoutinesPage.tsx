import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Spinner, Alert } from '../ui';
import workoutsService, { Routine, RoutineItem } from '../../lib/workoutsService';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');

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

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      setError('Routine name is required');
      return;
    }
    try {
      await workoutsService.createRoutine({
        name: routineName,
        description: routineDescription,
        items: [],
      });
      setRoutineName('');
      setRoutineDescription('');
      setShowForm(false);
      await loadRoutines();
    } catch (err: any) {
      setError(err.message || 'Failed to create routine');
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (confirm('Delete this routine?')) {
      try {
        await workoutsService.deleteRoutine(id);
        await loadRoutines();
      } catch (err) {
        setError('Failed to delete routine');
      }
    }
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h2">Routines</h2>
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New Routine'}
          </Button>
        </div>

        {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        {showForm && (
          <div className="mb-3 pb-3 border-b border-surface-700 space-y-1.5">
            <Input
              label="Routine Name"
              placeholder="e.g., Push Day A"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
            />
            <Input
              label="Description (optional)"
              placeholder="e.g., Chest, shoulders, triceps"
              value={routineDescription}
              onChange={(e) => setRoutineDescription(e.target.value)}
              as="textarea"
            />
            <Button onClick={handleCreateRoutine} fullWidth>
              Create Routine
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner />
          </div>
        ) : routines.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">
            No routines yet. Create one above!
          </p>
        ) : (
          <div className="space-y-2">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="p-3 bg-surface-900 rounded border border-surface-700"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1">
                    <p className="font-medium text-surface-100">{routine.name}</p>
                    {routine.description && (
                      <p className="text-caption text-surface-500 mt-0.5">{routine.description}</p>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteRoutine(routine.id)}
                  >
                    Delete
                  </Button>
                </div>
                {routine.items.length > 0 && (
                  <div className="text-caption text-surface-400 mt-2 space-y-0.5">
                    {routine.items.map((item) => (
                      <div key={item.id} className="pl-2 border-l border-surface-700">
                        {item.order}. {item.exercise_name}
                        {item.target_sets && ` • {item.target_sets} sets`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
