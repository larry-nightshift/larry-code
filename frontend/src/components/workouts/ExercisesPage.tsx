import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Card, Spinner, Alert } from '../ui';
import workoutsService, { Exercise } from '../../lib/workoutsService';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    exercise_type: 'WEIGHT_REPS',
    muscle_group: '',
    notes: '',
  });

  useEffect(() => {
    loadExercises();
  }, [search, archived]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await workoutsService.listExercises(archived, search);
      setExercises(data.results);
    } catch (err) {
      setError('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!formData.name.trim()) {
      setError('Exercise name is required');
      return;
    }
    try {
      await workoutsService.createExercise(formData);
      setFormData({ name: '', exercise_type: 'WEIGHT_REPS', muscle_group: '', notes: '' });
      setShowForm(false);
      await loadExercises();
    } catch (err: any) {
      setError(err.message || 'Failed to create exercise');
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (confirm('Delete this exercise? It will be archived.')) {
      try {
        await workoutsService.deleteExercise(id);
        await loadExercises();
      } catch (err) {
        setError('Failed to delete exercise');
      }
    }
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h2">Exercises</h2>
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Exercise'}
          </Button>
        </div>

        {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        {showForm && (
          <div className="mb-3 pb-3 border-b border-surface-700 space-y-1.5">
            <Input
              label="Exercise Name"
              placeholder="e.g., Bench Press"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              label="Exercise Type"
              value={formData.exercise_type}
              onChange={(e) => setFormData({ ...formData, exercise_type: e.target.value as any })}
              options={[
                { value: 'WEIGHT_REPS', label: 'Weight + Reps' },
                { value: 'BODYWEIGHT_REPS', label: 'Bodyweight + Reps' },
                { value: 'TIME', label: 'Time' },
                { value: 'DISTANCE_TIME', label: 'Distance + Time' },
              ]}
            />
            <Select
              label="Muscle Group"
              value={formData.muscle_group}
              onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
              options={[
                { value: '', label: 'None' },
                { value: 'CHEST', label: 'Chest' },
                { value: 'BACK', label: 'Back' },
                { value: 'LEGS', label: 'Legs' },
                { value: 'SHOULDERS', label: 'Shoulders' },
                { value: 'ARMS', label: 'Arms' },
                { value: 'CORE', label: 'Core' },
                { value: 'FULL_BODY', label: 'Full Body' },
                { value: 'CARDIO', label: 'Cardio' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            <Button onClick={handleCreateExercise} fullWidth>
              Create Exercise
            </Button>
          </div>
        )}

        <div className="flex gap-1.5 mb-3">
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
          />
          <Button
            variant={archived ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setArchived(!archived)}
          >
            {archived ? 'Archived' : 'Active'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner />
          </div>
        ) : exercises.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">
            No exercises found. Create one above!
          </p>
        ) : (
          <div className="space-y-1">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-2 bg-surface-900 rounded border border-surface-700"
              >
                <div className="flex-1">
                  <p className="font-medium text-surface-100">{exercise.name}</p>
                  <p className="text-caption text-surface-500">
                    {exercise.exercise_type} {exercise.muscle_group && `• ${exercise.muscle_group}`}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteExercise(exercise.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
