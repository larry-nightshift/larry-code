const API_BASE = '/api/job_tracker';

// Types
export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  notes?: string;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role_at_company?: string;
  linkedin_url?: string;
  notes?: string;
  company: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationContact {
  contact: Contact;
  contact_id?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description?: string;
  activity_date: string;
  is_system: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  application: string;
  reminder_date: string;
  title: string;
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  is_overdue?: boolean;
  days_until_due?: number | null;
  created_at: string;
}

export interface InterviewPrepNote {
  id: string;
  application: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  company: Company | string;
  company_id?: string;
  role_title: string;
  job_url?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  location_type?: string;
  location_type_display?: string;
  status: string;
  status_display?: string;
  priority: number;
  source?: string;
  applied_date?: string;
  notes?: string;
  contacts?: ApplicationContact[];
  recent_activities?: Activity[];
  active_reminders?: Reminder[];
  prep_notes_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  pipeline_counts: Record<string, number>;
  upcoming_reminders: Reminder[];
  recent_activities: Activity[];
  stats: {
    total_applications: number;
    active_count: number;
    response_rate: number;
    avg_days_in_pipeline: number;
  };
}

// API Service
export const jobTrackerService = {
  // Companies
  async getCompanies(
    q?: string,
    page?: number,
  ): Promise<{ results: Company[]; count: number; next?: string; previous?: string }> {
    const params = new URLSearchParams();
    if (q) params.append('search', q);
    if (page) params.append('page', page.toString());
    const response = await fetch(`${API_BASE}/companies/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch companies');
    return response.json();
  },

  async getCompany(id: string): Promise<Company> {
    const response = await fetch(`${API_BASE}/companies/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch company');
    return response.json();
  },

  async createCompany(data: Partial<Company>): Promise<Company> {
    const response = await fetch(`${API_BASE}/companies/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create company');
    return response.json();
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const response = await fetch(`${API_BASE}/companies/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update company');
    return response.json();
  },

  async deleteCompany(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/companies/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete company');
  },

  // Applications
  async getApplications(filters?: {
    q?: string;
    status?: string[];
    company_id?: string;
    priority?: number;
    location_type?: string;
    applied_after?: string;
    applied_before?: string;
    has_reminder?: boolean;
    ordering?: string;
    page?: number;
  }): Promise<{ results: Application[]; count: number; next?: string; previous?: string }> {
    const params = new URLSearchParams();
    if (filters?.q) params.append('search', filters.q);
    if (filters?.status?.length) params.append('status', filters.status.join(','));
    if (filters?.company_id) params.append('company_id', filters.company_id);
    if (filters?.priority) params.append('priority', filters.priority.toString());
    if (filters?.location_type) params.append('location_type', filters.location_type);
    if (filters?.applied_after) params.append('applied_after', filters.applied_after);
    if (filters?.applied_before) params.append('applied_before', filters.applied_before);
    if (filters?.has_reminder !== undefined) params.append('has_reminder', filters.has_reminder ? 'true' : 'false');
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.page) params.append('page', filters.page.toString());

    const response = await fetch(`${API_BASE}/applications/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch applications');
    return response.json();
  },

  async getApplication(id: string): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch application');
    return response.json();
  },

  async createApplication(data: Partial<Application>): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create application');
    return response.json();
  },

  async updateApplication(id: string, data: Partial<Application>): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update application');
    return response.json();
  },

  async deleteApplication(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/applications/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete application');
  },

  async addContactToApplication(
    applicationId: string,
    contactId: string,
  ): Promise<Contact> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/add_contact/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contactId }),
    });
    if (!response.ok) throw new Error('Failed to add contact to application');
    return response.json();
  },

  async removeContactFromApplication(
    applicationId: string,
    contactId: string,
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/remove_contact/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contactId }),
    });
    if (!response.ok) throw new Error('Failed to remove contact from application');
  },

  // Contacts
  async getContacts(companyId?: string, q?: string): Promise<{ results: Contact[] }> {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (q) params.append('search', q);
    const response = await fetch(`${API_BASE}/contacts/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch contacts');
    return response.json();
  },

  async createContact(data: Partial<Contact>): Promise<Contact> {
    const response = await fetch(`${API_BASE}/contacts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create contact');
    return response.json();
  },

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    const response = await fetch(`${API_BASE}/contacts/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update contact');
    return response.json();
  },

  async deleteContact(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/contacts/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete contact');
  },

  // Activities
  async getActivities(
    applicationId: string,
    page?: number,
  ): Promise<{ results: Activity[]; count: number }> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    const response = await fetch(`${API_BASE}/applications/${applicationId}/activities/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },

  async createActivity(
    applicationId: string,
    data: Partial<Activity>,
  ): Promise<Activity> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/activities/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create activity');
    return response.json();
  },

  async updateActivity(
    applicationId: string,
    activityId: string,
    data: Partial<Activity>,
  ): Promise<Activity> {
    const response = await fetch(
      `${API_BASE}/applications/${applicationId}/activities/${activityId}/`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) throw new Error('Failed to update activity');
    return response.json();
  },

  async deleteActivity(applicationId: string, activityId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/applications/${applicationId}/activities/${activityId}/`,
      { method: 'DELETE' },
    );
    if (!response.ok) throw new Error('Failed to delete activity');
  },

  // Reminders
  async getReminders(filters?: {
    is_completed?: boolean;
    due_before?: string;
    due_after?: string;
    application_id?: string;
    page?: number;
  }): Promise<{ results: Reminder[] }> {
    const params = new URLSearchParams();
    if (filters?.is_completed !== undefined)
      params.append('is_completed', filters.is_completed ? 'true' : 'false');
    if (filters?.due_before) params.append('due_before', filters.due_before);
    if (filters?.due_after) params.append('due_after', filters.due_after);
    if (filters?.application_id) params.append('application_id', filters.application_id);
    if (filters?.page) params.append('page', filters.page.toString());

    const response = await fetch(`${API_BASE}/reminders/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch reminders');
    return response.json();
  },

  async createReminder(
    applicationId: string,
    data: Partial<Reminder>,
  ): Promise<Reminder> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/reminders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create reminder');
    return response.json();
  },

  async updateReminder(
    applicationId: string,
    reminderId: string,
    data: Partial<Reminder>,
  ): Promise<Reminder> {
    const response = await fetch(
      `${API_BASE}/applications/${applicationId}/reminders/${reminderId}/`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) throw new Error('Failed to update reminder');
    return response.json();
  },

  async completeReminder(
    applicationId: string,
    reminderId: string,
  ): Promise<Reminder> {
    const response = await fetch(
      `${API_BASE}/applications/${applicationId}/reminders/${reminderId}/complete/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    );
    if (!response.ok) throw new Error('Failed to complete reminder');
    return response.json();
  },

  async deleteReminder(
    applicationId: string,
    reminderId: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE}/applications/${applicationId}/reminders/${reminderId}/`,
      { method: 'DELETE' },
    );
    if (!response.ok) throw new Error('Failed to delete reminder');
  },

  // Interview Prep Notes
  async getPrepNotes(
    applicationId: string,
    category?: string,
  ): Promise<{ results: InterviewPrepNote[] }> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    const response = await fetch(`${API_BASE}/applications/${applicationId}/prep-notes/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch prep notes');
    return response.json();
  },

  async createPrepNote(
    applicationId: string,
    data: Partial<InterviewPrepNote>,
  ): Promise<InterviewPrepNote> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/prep-notes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create prep note');
    return response.json();
  },

  async updatePrepNote(
    applicationId: string,
    noteId: string,
    data: Partial<InterviewPrepNote>,
  ): Promise<InterviewPrepNote> {
    const response = await fetch(
      `${API_BASE}/applications/${applicationId}/prep-notes/${noteId}/`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) throw new Error('Failed to update prep note');
    return response.json();
  },

  async deletePrepNote(applicationId: string, noteId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/applications/${applicationId}/prep-notes/${noteId}/`,
      { method: 'DELETE' },
    );
    if (!response.ok) throw new Error('Failed to delete prep note');
  },

  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    const response = await fetch(`${API_BASE}/dashboard/`);
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    return response.json();
  },

  // Export
  async exportJson(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/export/json/`);
    if (!response.ok) throw new Error('Failed to export JSON');
    return response.blob();
  },

  async exportCsv(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/export/csv/`);
    if (!response.ok) throw new Error('Failed to export CSV');
    return response.blob();
  },
};
