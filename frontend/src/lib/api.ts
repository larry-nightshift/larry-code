const API_BASE = 'http://localhost:8000/api';

export interface FocusData {
  id?: number;
  date: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  text: string;
  status: 'TODO' | 'DOING' | 'DONE';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UpcomingItem {
  id: number;
  title: string;
  starts_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const request = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

export const focusAPI = {
  getToday: () => request('/focus/today/'),
  setToday: (text: string) =>
    request('/focus/today/', {
      method: 'PUT',
      body: JSON.stringify({ text }),
    }),
};

export const notesAPI = {
  list: () => request('/notes/'),
  create: (title: string, body: string) =>
    request('/notes/', {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    }),
  update: (id: number, data: Partial<Note>) =>
    request(`/notes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request(`/notes/${id}/`, {
      method: 'DELETE',
    }),
};

export const tasksAPI = {
  list: () => request('/tasks/'),
  create: (text: string, due_date?: string) =>
    request('/tasks/', {
      method: 'POST',
      body: JSON.stringify({ text, due_date }),
    }),
  update: (id: number, data: Partial<Task>) =>
    request(`/tasks/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request(`/tasks/${id}/`, {
      method: 'DELETE',
    }),
};

export const upcomingAPI = {
  list: () => request('/upcoming/'),
  create: (title: string, starts_at: string, notes?: string) =>
    request('/upcoming/', {
      method: 'POST',
      body: JSON.stringify({ title, starts_at, notes }),
    }),
  update: (id: number, data: Partial<UpcomingItem>) =>
    request(`/upcoming/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request(`/upcoming/${id}/`, {
      method: 'DELETE',
    }),
};

// Recipe types
export interface Ingredient {
  id?: string;
  name: string;
  amount: string;
  unit: string;
  note?: string;
}

export interface Recipe {
  id?: string;
  title: string;
  description?: string;
  servings: number;
  directions?: string[];
  ingredients?: Ingredient[];
  created_at?: string;
  updated_at?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  source_recipes?: string[];
}

export interface GroceryList {
  id: string;
  title: string;
  recipe_ids?: string[];
  recipes?: Recipe[];
  items?: GroceryItem[];
  date?: string;
  created_at?: string;
  updated_at?: string;
}

export const recipesAPI = {
  list: () => request('/recipes/'),
  create: (data: Recipe) =>
    request('/recipes/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (id: string) => request(`/recipes/${id}/`),
  update: (id: string, data: Partial<Recipe>) =>
    request(`/recipes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/recipes/${id}/`, {
      method: 'DELETE',
    }),
  search: (query: string) => request(`/recipes/search/?q=${encodeURIComponent(query)}`),
};

export const groceryAPI = {
  list: () => request('/grocery/lists/'),
  create: (data: { title: string; recipe_ids: string[]; date?: string }) =>
    request('/grocery/lists/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (id: string) => request(`/grocery/lists/${id}/`),
  update: (id: string, data: Partial<GroceryList>) =>
    request(`/grocery/lists/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/grocery/lists/${id}/`, {
      method: 'DELETE',
    }),
  export: (id: string) => `${API_BASE}/grocery/lists/${id}/export/`,
  regenerate: (id: string) =>
    request(`/grocery/lists/${id}/regenerate/`, {
      method: 'POST',
    }),
};

// Habit types
export interface Habit {
  id: string;
  name: string;
  description?: string;
  schedule_type: 'DAILY' | 'WEEKLY';
  weekly_target?: number;
  start_date: string;
  is_active: boolean;
  is_archived: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TodayHabit extends Habit {
  completed_today: boolean;
  current_streak: number;
  best_streak: number;
  week_progress?: { completed: number; target: number; display: string };
}

export interface HabitCalendar {
  habit_id: string;
  habit_name: string;
  from: string;
  to: string;
  dates: string[];
}

export interface InsightStat {
  id: string;
  name: string;
  schedule_type: string;
  completion_rate: number;
  completed: number;
  total: number;
}

export interface Insights {
  window_days: number;
  most_consistent: InsightStat[];
  at_risk: InsightStat[];
  total_habits: number;
}

export const habitsAPI = {
  // Habits CRUD
  list: (archived?: boolean, active?: boolean) => {
    const params = new URLSearchParams();
    if (archived !== undefined) params.append('archived', String(archived));
    if (active !== undefined) params.append('active', String(active));
    return request(`/habits/habits/?${params.toString()}`);
  },
  create: (data: {
    name: string;
    description?: string;
    schedule_type: 'DAILY' | 'WEEKLY';
    weekly_target?: number;
    start_date: string;
    color?: string;
  }) =>
    request('/habits/habits/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (id: string) => request(`/habits/habits/${id}/`),
  update: (id: string, data: Partial<Habit>) =>
    request(`/habits/habits/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/habits/habits/${id}/`, {
      method: 'DELETE',
    }),
  archive: (id: string) =>
    request(`/habits/habits/${id}/archive/`, {
      method: 'POST',
    }),
  unarchive: (id: string) =>
    request(`/habits/habits/${id}/unarchive/`, {
      method: 'POST',
    }),

  // Check-ins
  toggle: (habit_id: string, date: string) =>
    request('/habits/checkins/toggle/', {
      method: 'POST',
      body: JSON.stringify({ habit_id, date }),
    }),

  // Views
  today: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return request(`/habits/today/${params}`);
  },
  calendar: (habit_id: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return request(`/habits/habits/${habit_id}/calendar/?${params.toString()}`);
  },
  insights: (window_days?: number) => {
    const params = window_days ? `?window_days=${window_days}` : '';
    return request(`/habits/insights/${params}`);
  },
};
