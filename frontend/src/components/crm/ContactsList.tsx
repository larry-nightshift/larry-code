import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, CardHeader, Alert, Spinner, Badge } from '../ui';
import { getContacts, createContact, deleteContact } from '../../lib/crmService';
import type { Contact } from '../../lib/crmService';

export function ContactsList() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [creatingContact, setCreatingContact] = useState(false);

  const loadContacts = useCallback(async (search?: string) => {
    try {
      setError(null);
      const data = await getContacts(search);
      setContacts(data.results || []);
    } catch (err) {
      setError('Failed to load contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      if (searchQuery.trim()) {
        loadContacts(searchQuery);
      } else {
        loadContacts();
      }
    }, 300);

    setSearchTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [searchQuery, loadContacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    setCreatingContact(true);
    try {
      const newContact = await createContact({
        full_name: newContactName.trim(),
        email: newContactEmail.trim() || undefined,
      });
      setContacts([newContact, ...contacts]);
      setNewContactName('');
      setNewContactEmail('');
    } catch (err) {
      setError('Failed to create contact');
      console.error(err);
    } finally {
      setCreatingContact(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      setError('Failed to delete contact');
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <Alert
          variant="danger"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Card variant="gradient" padding="md">
        <CardHeader title="Add Contact" />
        <form onSubmit={handleAddContact} className="space-y-2">
          <Input
            placeholder="Name *"
            value={newContactName}
            onChange={(e) => setNewContactName(e.target.value)}
            disabled={creatingContact}
          />
          <Input
            placeholder="Email (optional)"
            type="email"
            value={newContactEmail}
            onChange={(e) => setNewContactEmail(e.target.value)}
            disabled={creatingContact}
          />
          <Button
            type="submit"
            fullWidth
            loading={creatingContact}
          >
            Add Contact
          </Button>
        </form>
      </Card>

      <Card variant="default" padding="md">
        <div className="mb-3">
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">
            No contacts yet. Create one above!
          </p>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-surface-900 rounded-lg hover:bg-surface-800 transition-colors cursor-pointer group"
                onClick={() => navigate(`/crm/contact/${contact.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-surface-100 font-medium truncate">
                    {contact.full_name}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {contact.email && (
                      <span className="text-surface-400 text-small truncate">
                        {contact.email}
                      </span>
                    )}
                    {contact.company && (
                      <Badge variant="info" size="sm">
                        {contact.company}
                      </Badge>
                    )}
                    {contact.tags && (
                      <span className="text-surface-500 text-small">
                        {contact.tags}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(contact.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
