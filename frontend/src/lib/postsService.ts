const API_BASE = 'http://localhost:8000/api';

export interface Post {
  id: string;
  title: string;
  slug: string;
  body_markdown: string;
  body_html: string;
  excerpt: string;
  metadata: Record<string, unknown>;
  published: boolean;
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
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
};

export const postsAPI = {
  list: () => request('/posts/'),

  create: (data: {
    title: string;
    slug: string;
    body_markdown: string;
    excerpt: string;
    metadata?: Record<string, unknown>;
    published?: boolean;
  }) =>
    request('/posts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) => request(`/posts/${id}/`),

  update: (id: string, data: Partial<Post>) =>
    request(`/posts/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/posts/${id}/`, {
      method: 'DELETE',
    }),

  export: () =>
    fetch(`${API_BASE}/site/export/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `site_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }),
};
