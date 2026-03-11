export interface Exercise {
  id: string;
  name: string;
  exercise_type: 'WEIGHT_REPS' | 'BODYWEIGHT_REPS' | 'TIME' | 'DISTANCE_TIME';
  muscle_group?: string;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineItem {
  id: string;
  exercise: string;
  exercise_name: string;
  exercise_type: string;
  order: number;
  target_sets?: number;
  target_reps_min?: number;
  target_reps_max?: number;
  target_weight?: string;
  rest_seconds?: number;
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  is_archived: boolean;
  items: RoutineItem[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutSet {
  id: string;
  set_number: number;
  weight?: string;
  reps?: number;
  duration_seconds?: number;
  distance_meters?: number;
  rpe?: string;
  is_warmup: boolean;
  notes?: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  exercise: string;
  exercise_name: string;
  exercise_type: string;
  order: number;
  notes?: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  routine?: string;
  routine_name?: string;
  title?: string;
  started_at: string;
  ended_at?: string;
  notes?: string;
  workout_exercises?: WorkoutExercise[];
  exercise_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PersonalRecord {
  id: string;
  exercise: string;
  exercise_name: string;
  exercise_type: string;
  record_type: 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_DURATION' | 'BEST_EST_1RM';
  value_decimal: string;
  value_int?: number;
  achieved_at: string;
  workout?: string;
}

export interface ProgressPoint {
  date: string;
  value: number;
}

const API_BASE = '/api/workouts';

class WorkoutsService {
  // Exercises
  async listExercises(archived = false, search?: string) {
    const params = new URLSearchParams({ archived: String(archived) });
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/exercises/?${params}`, { credentials: 'include' });
    return res.json() as Promise<{ results: Exercise[] }>;
  }

  async createExercise(data: Partial<Exercise>) {
    const res = await fetch(`${API_BASE}/exercises/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return res.json() as Promise<Exercise>;
  }

  async updateExercise(id: string, data: Partial<Exercise>) {
    const res = await fetch(`${API_BASE}/exercises/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return res.json() as Promise<Exercise>;
  }

  async deleteExercise(id: string) {
    await fetch(`${API_BASE}/exercises/${id}/`, { method: 'DELETE', credentials: 'include' });
  }

  // Routines
  async listRoutines(archived = false) {
    const params = new URLSearchParams({ archived: String(archived) });
    const res = await fetch(`${API_BASE}/routines/?${params}`, { credentials: 'include' });
    return res.json() as Promise<{ results: Routine[] }>;
  }

  async createRoutine(data: Partial<Routine> & { items: Partial<RoutineItem>[] }) {
    const res = await fetch(`${API_BASE}/routines/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return res.json() as Promise<Routine>;
  }

  async updateRoutine(id: string, data: Partial<Routine> & { items?: Partial<RoutineItem>[] }) {
    const res = await fetch(`${API_BASE}/routines/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return res.json() as Promise<Routine>;
  }

  async deleteRoutine(id: string) {
    await fetch(`${API_BASE}/routines/${id}/`, { method: 'DELETE', credentials: 'include' });
  }

  // Workouts
  async listWorkouts(from?: string, to?: string, exerciseId?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (exerciseId) params.append('exercise_id', exerciseId);
    const res = await fetch(`${API_BASE}/workouts/?${params}`, { credentials: 'include' });
    return res.json() as Promise<{ results: Workout[] }>;
  }

  async createWorkout(routineId?: string) {
    const data = routineId ? { routine: routineId } : {};
    const res = await fetch(`${API_BASE}/workouts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return res.json() as Promise<Workout>;
  }

  async getWorkout(id: string) {
    const res = await fetch(`${API_BASE}/workouts/${id}/`, { credentials: 'include' });
    return res.json() as Promise<Workout>;
  }

  async addExerciseToWorkout(workoutId: string, exerciseId: string, order: number) {
    const res = await fetch(`${API_BASE}/workouts/${workoutId}/add_exercise/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId, order }),
      credentials: 'include',
    });
    return res.json() as Promise<WorkoutExercise>;
  }

  async addSetToWorkout(workoutId: string, weId: string, data: Partial<WorkoutSet>) {
    const res = await fetch(`${API_BASE}/workouts/${workoutId}/add_set/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workout_exercise_id: weId, ...data }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.non_field_errors?.[0] || JSON.stringify(error));
    }
    return res.json() as Promise<WorkoutSet>;
  }

  async deleteSetFromWorkout(workoutId: string, setId: string) {
    await fetch(`${API_BASE}/workouts/${workoutId}/delete_set/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_id: setId }),
      credentials: 'include',
    });
  }

  async deleteExerciseFromWorkout(workoutId: string, weId: string) {
    await fetch(`${API_BASE}/workouts/${workoutId}/delete_exercise/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workout_exercise_id: weId }),
      credentials: 'include',
    });
  }

  async finishWorkout(workoutId: string, notes?: string) {
    const res = await fetch(`${API_BASE}/workouts/${workoutId}/finish/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes || '' }),
      credentials: 'include',
    });
    return res.json() as Promise<Workout>;
  }

  // Personal Records
  async listPRs() {
    const res = await fetch(`${API_BASE}/prs/`, { credentials: 'include' });
    return res.json() as Promise<{ results: PersonalRecord[] }>;
  }

  async getPRsByExercise(exerciseId: string) {
    const res = await fetch(`${API_BASE}/prs/by_exercise/?exercise_id=${exerciseId}`, { credentials: 'include' });
    return res.json() as Promise<PersonalRecord[]>;
  }

  async rebuildPRs() {
    const res = await fetch(`${API_BASE}/prs/rebuild/`, { method: 'POST', credentials: 'include' });
    return res.json();
  }

  // Progress
  async getProgress(exerciseId: string, metric: string, from?: string, to?: string) {
    const params = new URLSearchParams({ exercise_id: exerciseId, metric });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await fetch(`${API_BASE}/progress/chart/?${params}`, { credentials: 'include' });
    return res.json() as Promise<ProgressPoint[]>;
  }
}

export default new WorkoutsService();
