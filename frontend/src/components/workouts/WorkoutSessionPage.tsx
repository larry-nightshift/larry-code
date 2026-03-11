import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Select, Card, Spinner, Alert, Dialog } from '../ui';
import workoutsService, { Workout, Exercise, WorkoutExercise, WorkoutSet } from '../../lib/workoutsService';

export default function WorkoutSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const [addingExercise, setAddingExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [addingSetFor, setAddingSetFor] = useState<string | null>(null);
  const [setData, setSetData] = useState({
    set_number: 1,
    weight: '',
    reps: '',
    duration_seconds: '',
    is_warmup: false,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const w = await workoutsService.getWorkout(id);
      setWorkout(w);
      const exData = await workoutsService.listExercises();
      setExercises(exData.results.filter((e) => !e.is_archived));
    } catch (err) {
      setError('Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async () => {
    if (!selectedExercise || !workout) return;
    try {
      const order = (workout.workout_exercises?.length || 0) + 1;
      await workoutsService.addExerciseToWorkout(workout.id, selectedExercise, order);
      setSelectedExercise('');
      setAddingExercise(false);
      await loadData();
    } catch (err) {
      setError('Failed to add exercise');
    }
  };

  const handleAddSet = async (weId: string, exercise: Exercise) => {
    try {
      let data: any = {
        set_number: setData.set_number,
        is_warmup: setData.is_warmup,
      };

      if (exercise.exercise_type === 'WEIGHT_REPS') {
        if (!setData.weight || !setData.reps) {
          setError('Weight and reps required for WEIGHT_REPS');
          return;
        }
        data.weight = setData.weight;
        data.reps = parseInt(setData.reps);
      } else if (exercise.exercise_type === 'BODYWEIGHT_REPS') {
        if (!setData.reps) {
          setError('Reps required for BODYWEIGHT_REPS');
          return;
        }
        data.reps = parseInt(setData.reps);
      } else if (exercise.exercise_type === 'TIME') {
        if (!setData.duration_seconds) {
          setError('Duration required for TIME');
          return;
        }
        data.duration_seconds = parseInt(setData.duration_seconds);
      }

      await workoutsService.addSetToWorkout(workout!.id, weId, data);
      setSetData({ set_number: 1, weight: '', reps: '', duration_seconds: '', is_warmup: false });
      setAddingSetFor(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add set');
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!workout) return;
    try {
      await workoutsService.deleteSetFromWorkout(workout.id, setId);
      await loadData();
    } catch (err) {
      setError('Failed to delete set');
    }
  };

  const handleDeleteExercise = async (weId: string) => {
    if (!workout || !confirm('Delete this exercise from the workout?')) return;
    try {
      await workoutsService.deleteExerciseFromWorkout(workout.id, weId);
      await loadData();
    } catch (err) {
      setError('Failed to delete exercise');
    }
  };

  const handleFinishWorkout = async () => {
    if (!workout) return;
    setIsFinishing(true);
    try {
      await workoutsService.finishWorkout(workout.id);
      navigate('/workouts/history');
    } catch (err) {
      setError('Failed to finish workout');
      setIsFinishing(false);
    }
  };

  if (loading || !workout) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <h2 className="text-h2 mb-2">
          {workout.routine_name || 'Workout Session'}
        </h2>
        <p className="text-caption text-surface-400">
          Started {new Date(workout.started_at).toLocaleTimeString()}
        </p>
      </Card>

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-text-h2">Exercises</h3>
          <Button
            variant={addingExercise ? 'ghost' : 'primary'}
            size="sm"
            onClick={() => setAddingExercise(!addingExercise)}
          >
            {addingExercise ? 'Cancel' : 'Add Exercise'}
          </Button>
        </div>

        {addingExercise && (
          <div className="mb-3 pb-3 border-b border-surface-700 space-y-1.5">
            <Select
              label="Select Exercise"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              options={exercises.map((e) => ({ value: e.id, label: e.name }))}
            />
            <Button onClick={handleAddExercise} fullWidth>
              Add Exercise
            </Button>
          </div>
        )}

        {!workout.workout_exercises || workout.workout_exercises.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">
            No exercises yet. Add one above!
          </p>
        ) : (
          <div className="space-y-2">
            {workout.workout_exercises.map((we) => {
              const exercise = exercises.find((e) => e.id === we.exercise);
              return (
                <div key={we.id} className="bg-surface-900 p-3 rounded border border-surface-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-surface-100">{we.exercise_name}</p>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteExercise(we.id)}
                    >
                      Delete
                    </Button>
                  </div>

                  {we.sets && we.sets.length > 0 && (
                    <div className="mb-2 space-y-1 text-caption">
                      {we.sets.map((set) => (
                        <div
                          key={set.id}
                          className="flex items-center justify-between p-1.5 bg-surface-800 rounded"
                        >
                          <div className="flex-1">
                            Set {set.set_number}
                            {set.is_warmup && ' (warmup)'}
                            {exercise?.exercise_type === 'WEIGHT_REPS' && set.weight && set.reps && (
                              <span className="ml-2 text-surface-400">
                                {set.weight} lbs x {set.reps}
                              </span>
                            )}
                            {exercise?.exercise_type === 'BODYWEIGHT_REPS' && set.reps && (
                              <span className="ml-2 text-surface-400">{set.reps} reps</span>
                            )}
                            {exercise?.exercise_type === 'TIME' && set.duration_seconds && (
                              <span className="ml-2 text-surface-400">{set.duration_seconds}s</span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSet(set.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {addingSetFor === we.id ? (
                    <div className="bg-surface-800 p-2 rounded space-y-1 mt-2">
                      <div className="grid grid-cols-2 gap-1">
                        {exercise?.exercise_type === 'WEIGHT_REPS' && (
                          <>
                            <Input
                              label="Weight (lbs)"
                              type="number"
                              placeholder="185"
                              value={setData.weight}
                              onChange={(e) => setSetData({ ...setData, weight: e.target.value })}
                              size="sm"
                            />
                            <Input
                              label="Reps"
                              type="number"
                              placeholder="5"
                              value={setData.reps}
                              onChange={(e) => setSetData({ ...setData, reps: e.target.value })}
                              size="sm"
                            />
                          </>
                        )}
                        {exercise?.exercise_type === 'BODYWEIGHT_REPS' && (
                          <Input
                            label="Reps"
                            type="number"
                            placeholder="8"
                            value={setData.reps}
                            onChange={(e) => setSetData({ ...setData, reps: e.target.value })}
                            size="sm"
                          />
                        )}
                        {exercise?.exercise_type === 'TIME' && (
                          <Input
                            label="Duration (sec)"
                            type="number"
                            placeholder="120"
                            value={setData.duration_seconds}
                            onChange={(e) => setSetData({ ...setData, duration_seconds: e.target.value })}
                            size="sm"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          id={`warmup-${we.id}`}
                          checked={setData.is_warmup}
                          onChange={(e) => setSetData({ ...setData, is_warmup: e.target.checked })}
                        />
                        <label htmlFor={`warmup-${we.id}`} className="text-caption text-surface-400">
                          Warmup set
                        </label>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          fullWidth
                          onClick={() => handleAddSet(we.id, exercise!)}
                        >
                          Save Set
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAddingSetFor(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={() => setAddingSetFor(we.id)}
                    >
                      + Add Set
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex gap-1.5">
        <Button
          variant="primary"
          fullWidth
          loading={isFinishing}
          onClick={handleFinishWorkout}
        >
          Finish Workout
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate('/workouts/history')}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
