const API_BASE = '/api/inventory';

export interface Location {
  id: string;
  name: string;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warranty {
  id: string;
  item: string;
  provider?: string;
  warranty_type: 'MANUFACTURER' | 'EXTENDED' | 'STORE' | 'OTHER';
  start_date: string;
  end_date: string;
  terms?: string;
  claim_instructions?: string;
  is_active: boolean;
  days_remaining?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  item: string;
  attachment_type: 'URL' | 'FILE';
  title?: string;
  url?: string;
  file?: string;
  notes?: string;
  created_at: string;
}

export interface ServiceEvent {
  id: string;
  item: string;
  occurred_at: string;
  event_type?: 'REPAIR' | 'MAINTENANCE' | 'INSTALL' | 'INSPECTION' | 'OTHER';
  cost?: number;
  vendor?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ItemDetail {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model_number?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  vendor?: string;
  location?: string;
  location_name?: string;
  notes?: string;
  status: 'ACTIVE' | 'SOLD' | 'DISCARDED';
  is_archived: boolean;
  warranties: Warranty[];
  attachments: Attachment[];
  service_events: ServiceEvent[];
  next_warranty_expiry?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemList {
  id: string;
  name: string;
  category: string;
  brand?: string;
  purchase_date?: string;
  location?: string;
  location_name?: string;
  status: 'ACTIVE' | 'SOLD' | 'DISCARDED';
  next_warranty_expiry?: string | null;
  active_warranty_count: number;
  created_at: string;
}

export interface DashboardData {
  expiring_warranties: Warranty[];
  recent_items: ItemList[];
  recent_service_events: ServiceEvent[];
}

// Locations
export async function getLocations(archived = false) {
  const params = new URLSearchParams({ is_archived: archived.toString() });
  const response = await fetch(`${API_BASE}/locations/?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch locations');
  return response.json();
}

export async function createLocation(data: Partial<Location>): Promise<Location> {
  const response = await fetch(`${API_BASE}/locations/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to create location');
  return response.json();
}

export async function updateLocation(id: string, data: Partial<Location>): Promise<Location> {
  const response = await fetch(`${API_BASE}/locations/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to update location');
  return response.json();
}

export async function deleteLocation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/locations/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete location');
}

// Items
export async function getItems(filters?: { status?: string; category?: string; location_id?: string; search?: string; show_archived?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.location_id) params.append('location_id', filters.location_id);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.show_archived) params.append('show_archived', 'true');

  const response = await fetch(`${API_BASE}/items/?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
}

export async function getItem(id: string): Promise<ItemDetail> {
  const response = await fetch(`${API_BASE}/items/${id}/`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch item');
  return response.json();
}

export async function createItem(data: Partial<ItemDetail>): Promise<ItemDetail> {
  const response = await fetch(`${API_BASE}/items/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }
  return response.json();
}

export async function updateItem(id: string, data: Partial<ItemDetail>): Promise<ItemDetail> {
  const response = await fetch(`${API_BASE}/items/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to update item');
  return response.json();
}

export async function deleteItem(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/items/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete item');
}

// Warranties
export async function getWarranties(expiringIn?: number) {
  const params = new URLSearchParams();
  if (expiringIn) params.append('expiring_in', expiringIn.toString());

  const response = await fetch(`${API_BASE}/warranties/?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch warranties');
  return response.json();
}

export async function getWarrantiesExpiringSoon(expiringIn = 30): Promise<Warranty[]> {
  const response = await fetch(`${API_BASE}/warranties/expiring_soon/?expiring_in=${expiringIn}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch expiring warranties');
  return response.json();
}

export async function createWarranty(data: Partial<Warranty>): Promise<Warranty> {
  const response = await fetch(`${API_BASE}/warranties/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to create warranty');
  return response.json();
}

export async function updateWarranty(id: string, data: Partial<Warranty>): Promise<Warranty> {
  const response = await fetch(`${API_BASE}/warranties/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to update warranty');
  return response.json();
}

export async function deleteWarranty(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/warranties/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete warranty');
}

// Attachments
export async function createAttachment(data: Partial<Attachment>): Promise<Attachment> {
  const response = await fetch(`${API_BASE}/attachments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to create attachment');
  return response.json();
}

export async function deleteAttachment(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/attachments/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete attachment');
}

// Service Events
export async function createServiceEvent(data: Partial<ServiceEvent>): Promise<ServiceEvent> {
  const response = await fetch(`${API_BASE}/service-events/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to create service event');
  return response.json();
}

export async function updateServiceEvent(id: string, data: Partial<ServiceEvent>): Promise<ServiceEvent> {
  const response = await fetch(`${API_BASE}/service-events/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to update service event');
  return response.json();
}

export async function deleteServiceEvent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/service-events/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete service event');
}

// Dashboard
export async function getDashboard(expiringIn = 30): Promise<DashboardData> {
  const response = await fetch(`${API_BASE}/dashboard/dashboard/?expiring_in=${expiringIn}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}
