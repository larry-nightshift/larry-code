const API_BASE = 'http://localhost:8000/api';

// Types
export interface Asset {
  id: string;
  name: string;
  category: 'HVAC' | 'KITCHEN' | 'PLUMBING' | 'ELECTRICAL' | 'VEHICLE' | 'OUTDOOR' | 'OTHER';
  location: string;
  manufacturer: string;
  model_number: string;
  serial_number: string;
  purchase_date?: string;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTask {
  id: string;
  asset?: string;
  title: string;
  description: string;
  recurrence_type: 'EVERY_N_DAYS' | 'EVERY_N_WEEKS' | 'EVERY_N_MONTHS' | 'EVERY_N_YEARS';
  interval: number;
  start_date: string;
  due_strategy: 'FROM_START_DATE' | 'FROM_LAST_COMPLETION';
  grace_days: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  is_active: boolean;
  is_archived: boolean;
  last_completed_date?: string;
  next_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  task: string;
  completed_date: string;
  notes: string;
  cost?: string;
  performed_by: string;
  attachment_url: string;
  created_at: string;
}

export interface DueTask extends MaintenanceTask {
  asset_name?: string;
  asset_category?: string;
  status: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'SCHEDULED';
}

export interface DueResponse {
  today: string;
  overdue: DueTask[];
  due_soon: DueTask[];
  upcoming: DueTask[];
}

const request = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const response = await fetch(`${API_BASE}/maintenance${endpoint}`, {
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

// Assets
export const assetsList = (archived?: boolean, category?: string, search?: string) => {
  let url = '/assets/';
  const params = new URLSearchParams();
  if (archived !== undefined) params.append('archived', String(archived));
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  if (params.toString()) url += '?' + params.toString();
  return request(url);
};

export const assetDetail = (id: string) =>
  request(`/assets/${id}/`);

export const createAsset = (data: Partial<Asset>) =>
  request('/assets/', { method: 'POST', body: JSON.stringify(data) });

export const updateAsset = (id: string, data: Partial<Asset>) =>
  request(`/assets/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteAsset = (id: string) =>
  request(`/assets/${id}/`, { method: 'DELETE' });

export const archiveAsset = (id: string) =>
  request(`/assets/${id}/archive/`, { method: 'POST' });

// Tasks
export const tasksList = (
  archived?: boolean,
  active?: boolean,
  status?: string,
  assetId?: string,
  search?: string
) => {
  let url = '/tasks/';
  const params = new URLSearchParams();
  if (archived !== undefined) params.append('archived', String(archived));
  if (active !== undefined) params.append('active', String(active));
  if (status) params.append('status', status);
  if (assetId) params.append('asset_id', assetId);
  if (search) params.append('search', search);
  if (params.toString()) url += '?' + params.toString();
  return request(url);
};

export const taskDetail = (id: string) =>
  request(`/tasks/${id}/`);

export const createTask = (data: Partial<MaintenanceTask>) =>
  request('/tasks/', { method: 'POST', body: JSON.stringify(data) });

export const updateTask = (id: string, data: Partial<MaintenanceTask>) =>
  request(`/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteTask = (id: string) =>
  request(`/tasks/${id}/`, { method: 'DELETE' });

export const archiveTask = (id: string) =>
  request(`/tasks/${id}/archive/`, { method: 'POST' });

// Records
export const recordsList = (
  taskId?: string,
  assetId?: string,
  from?: string,
  to?: string
) => {
  let url = '/records/';
  const params = new URLSearchParams();
  if (taskId) params.append('task_id', taskId);
  if (assetId) params.append('asset_id', assetId);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (params.toString()) url += '?' + params.toString();
  return request(url);
};

export const createRecord = (data: {
  task_id: string;
  completed_date: string;
  notes?: string;
  cost?: string;
  performed_by?: string;
  attachment_url?: string;
}) =>
  request('/records/', { method: 'POST', body: JSON.stringify(data) });

// Due view
export const getDue = (date?: string): Promise<DueResponse> => {
  let url = '/due/';
  if (date) url += `?date=${date}`;
  return request(url);
};
