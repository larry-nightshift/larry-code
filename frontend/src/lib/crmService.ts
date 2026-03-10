const API_BASE = '/api/crm';

export interface Contact {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  tags?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactDetail extends Contact {
  interactions: Interaction[];
  interaction_count: number;
}

export interface Interaction {
  id: string;
  contact: string;
  date: string;
  medium: 'call' | 'email' | 'in-person' | 'text' | 'other';
  medium_display: string;
  notes: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  contact?: string;
  contact_name?: string;
  due_at: string;
  message: string;
  done: boolean;
  is_overdue: boolean;
  days_until_due: number | null;
  created_at: string;
  updated_at: string;
}

// Contacts
export async function getContacts(search?: string, page = 1) {
  const params = new URLSearchParams({ page_size: '20', page: page.toString() });
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE}/contacts/?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch contacts');
  return response.json();
}

export async function getContact(id: string): Promise<ContactDetail> {
  const response = await fetch(`${API_BASE}/contacts/${id}/`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch contact');
  return response.json();
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  const response = await fetch(`${API_BASE}/contacts/`, {
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

export async function updateContact(
  id: string,
  data: Partial<Contact>
): Promise<Contact> {
  const response = await fetch(`${API_BASE}/contacts/${id}/`, {
    method: 'PATCH',
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

export async function deleteContact(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/contacts/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete contact');
}

// Interactions
export async function getInteractions(contactId: string): Promise<Interaction[]> {
  const response = await fetch(`${API_BASE}/contacts/${contactId}/interactions/`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch interactions');
  return response.json();
}

export async function createInteraction(
  contactId: string,
  data: Partial<Interaction>
): Promise<Interaction> {
  const response = await fetch(`${API_BASE}/contacts/${contactId}/interactions/`, {
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

export async function deleteInteraction(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/interactions/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete interaction');
}

// Reminders
export async function getReminders(status?: string, page = 1) {
  const params = new URLSearchParams({ page_size: '50', page: page.toString() });
  if (status) params.append('status', status);

  const response = await fetch(`${API_BASE}/reminders/?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch reminders');
  return response.json();
}

export async function createReminder(
  data: Partial<Reminder>
): Promise<Reminder> {
  const response = await fetch(`${API_BASE}/reminders/`, {
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

export async function updateReminder(
  id: string,
  data: Partial<Reminder>
): Promise<Reminder> {
  const response = await fetch(`${API_BASE}/reminders/${id}/`, {
    method: 'PATCH',
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

export async function deleteReminder(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/reminders/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete reminder');
}

export async function markReminderDone(id: string): Promise<Reminder> {
  const response = await fetch(`${API_BASE}/reminders/${id}/mark_done/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to mark reminder done');
  return response.json();
}

export async function snoozeReminder(id: string, days: number): Promise<Reminder> {
  const response = await fetch(`${API_BASE}/reminders/${id}/snooze/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to snooze reminder');
  return response.json();
}
