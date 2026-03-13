interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  notes?: string;
  hostname?: string;
  favicon_url?: string;
  site_name?: string;
  preview_image_url?: string;
  collection?: string;
  tags: Tag[];
  queue_status?: string;
  queue_priority?: number;
  created_at: string;
  updated_at?: string;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at?: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  is_archived: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ReadingQueueItem {
  id: string;
  link: Link;
  status: 'QUEUED' | 'READING' | 'DONE' | 'SKIPPED';
  priority: number;
  queued_at: string;
  due_date?: string;
  finished_at?: string;
}

interface LinksListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Link[];
}

interface QueueListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ReadingQueueItem[];
}

const BASE_URL = '/api/links';

export const linksService = {
  // Links API
  async getLinks(params?: {
    q?: string;
    tag?: string[];
    collection_id?: string;
    queued?: boolean;
    queue_status?: string;
    hostname?: string;
    page?: number;
    page_size?: number;
  }): Promise<LinksListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.q) searchParams.append('q', params.q);
    if (params?.tag) {
      params.tag.forEach(t => searchParams.append('tag', t));
    }
    if (params?.collection_id) searchParams.append('collection_id', params.collection_id);
    if (params?.queued !== undefined) searchParams.append('queued', String(params.queued));
    if (params?.queue_status) searchParams.append('queue_status', params.queue_status);
    if (params?.hostname) searchParams.append('hostname', params.hostname);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    const response = await fetch(`${BASE_URL}/links/?${searchParams}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch links: ${response.statusText}`);
    }

    return response.json();
  },

  async getLink(id: string): Promise<Link> {
    const response = await fetch(`${BASE_URL}/links/${id}/`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch link: ${response.statusText}`);
    }

    return response.json();
  },

  async createLink(data: {
    url: string;
    title?: string;
    description?: string;
    notes?: string;
    collection?: string;
    tag_ids?: string[];
  }): Promise<Link | { detail: string; existing_link: Link }> {
    const response = await fetch(`${BASE_URL}/links/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw { status: response.status, ...result };
    }

    return result;
  },

  async updateLink(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      notes: string;
      collection: string | null;
      tag_ids: string[];
    }>
  ): Promise<Link> {
    const response = await fetch(`${BASE_URL}/links/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update link: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteLink(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/links/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete link: ${response.statusText}`);
    }
  },

  async exportLinks(): Promise<{ links: Link[] }> {
    const response = await fetch(`${BASE_URL}/links/export/`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to export links: ${response.statusText}`);
    }

    return response.json();
  },

  async importLinks(links: any[]): Promise<{ created: number; errors: any[]; total_rows: number }> {
    const response = await fetch(`${BASE_URL}/links/import_links/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ links }),
    });

    if (!response.ok) {
      throw new Error(`Failed to import links: ${response.statusText}`);
    }

    return response.json();
  },

  // Tags API
  async getTags(): Promise<Tag[]> {
    const response = await fetch(`${BASE_URL}/tags/?page_size=100`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  },

  async createTag(data: { name: string; color?: string }): Promise<Tag> {
    const response = await fetch(`${BASE_URL}/tags/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create tag: ${response.statusText}`);
    }

    return response.json();
  },

  async updateTag(id: string, data: Partial<{ name: string; color: string }>): Promise<Tag> {
    const response = await fetch(`${BASE_URL}/tags/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update tag: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteTag(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/tags/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete tag: ${response.statusText}`);
    }
  },

  // Collections API
  async getCollections(): Promise<Collection[]> {
    const response = await fetch(`${BASE_URL}/collections/?page_size=100`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  },

  async createCollection(data: { name: string; description?: string }): Promise<Collection> {
    const response = await fetch(`${BASE_URL}/collections/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create collection: ${response.statusText}`);
    }

    return response.json();
  },

  async updateCollection(
    id: string,
    data: Partial<{ name: string; description: string; is_archived: boolean }>
  ): Promise<Collection> {
    const response = await fetch(`${BASE_URL}/collections/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update collection: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteCollection(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/collections/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete collection: ${response.statusText}`);
    }
  },

  // Reading Queue API
  async getQueue(params?: {
    status?: string;
    sort?: string;
    page?: number;
    page_size?: number;
  }): Promise<QueueListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.status) searchParams.append('status', params.status);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    const response = await fetch(`${BASE_URL}/queue/?${searchParams}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch queue: ${response.statusText}`);
    }

    return response.json();
  },

  async queueLink(linkId: string, priority: number = 3): Promise<ReadingQueueItem> {
    const response = await fetch(`${BASE_URL}/queue/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ link_id: linkId, priority }),
    });

    if (!response.ok) {
      throw new Error(`Failed to queue link: ${response.statusText}`);
    }

    return response.json();
  },

  async updateQueueItem(
    id: string,
    data: Partial<{
      status: string;
      priority: number;
      due_date: string;
      finished_at: string;
    }>
  ): Promise<ReadingQueueItem> {
    const response = await fetch(`${BASE_URL}/queue/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update queue item: ${response.statusText}`);
    }

    return response.json();
  },

  async unqueueLink(linkId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/queue/unqueue_link/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ link_id: linkId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to unqueue link: ${response.statusText}`);
    }
  },

  async deleteQueueItem(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/queue/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete queue item: ${response.statusText}`);
    }
  },
};

export type { Link, Tag, Collection, ReadingQueueItem };
