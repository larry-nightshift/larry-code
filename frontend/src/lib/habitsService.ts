const API_BASE = 'http://localhost:8000/api';

export interface Habit {
  id: string;
  name: string;
  description: string;
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
  week_progress?: {
    completed: number;
    target: number;
    display: string;
  };
}

export interface CheckinResponse {
  completed: boolean;
  [key: string]: any;
}

export interface CalendarData {
  habit_id: string;
  habit_name: string;
  from: string;
  to: string;
  dates: string[];
}

export interface InsightHabit {
  id: string;
  name: string;
  schedule_type: string;
  completion_rate: number;
  completed: number;
  total: number;
}

export interface InsightsData {
  window_days: number;
  most_consistent: InsightHabit[];
  at_risk: InsightHabit[];
  total_habits: number;
}

const request = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const response = await fetch(`${API_BASE}/habits${endpoint}`, {
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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'API error');
  }

  return response.json();
};

// Habit CRUD
export const habitsList = (archived?: boolean, active?: boolean) => {
  let url = '/habits/';
  const params = new URLSearchParams();
  if (archived !== undefined) params.append('archived', String(archived));
  if (active !== undefined) params.append('active', String(active));
  if (params.toString()) url += '?' + params.toString();
  return request(url);
};

export const habitDetail = (id: string) =>
  request(`/habits/${id}/`);

export const createHabit = (data: Partial<Habit>) =>
  request('/habits/', { method: 'POST', body: JSON.stringify(data) });

export const updateHabit = (id: string, data: Partial<Habit>) =>
  request(`/habits/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteHabit = (id: string) =>
  request(`/habits/${id}/`, { method: 'DELETE' });

export const archiveHabit = (id: string) =>
  request(`/habits/${id}/archive/`, { method: 'POST' });

// Check-ins
export const toggleCheckin = (
  habit_id: string,
  date: string
): Promise<CheckinResponse> =>
  request('/checkins/toggle/', {
    method: 'POST',
    body: JSON.stringify({ habit_id, date }),
  });

// Special endpoints
export const getToday = (date?: string): Promise<TodayHabit[]> => {
  let url = '/today/';
  if (date) url += `?date=${date}`;
  return request(url);
};

export const getHabitCalendar = (
  id: string,
  from?: string,
  to?: string
): Promise<CalendarData> => {
  let url = `/habits/${id}/calendar/`;
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (params.toString()) url += '?' + params.toString();
  return request(url);
};

export const getInsights = (windowDays: number = 30): Promise<InsightsData> =>
  request(`/insights/?window_days=${windowDays}`);
