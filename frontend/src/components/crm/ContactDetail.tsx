import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Textarea, Select, Card, CardHeader, Alert, Spinner } from '../ui';
import {
  getContact,
  updateContact,
  deleteContact,
  createInteraction,
  deleteInteraction,
  createReminder,
} from '../../lib/crmService';
import type { ContactDetail as ContactDetailType } from '../../lib/crmService';

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contact, setContact] = useState<ContactDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Edit form
  const [editData, setEditData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    tags: '',
    notes: '',
  });

  // Interaction form
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionData, setInteractionData] = useState({
    date: new Date().toISOString().split('T')[0],
    medium: 'call' as const,
    notes: '',
  });
  const [creatingInteraction, setCreatingInteraction] = useState(false);

  // Reminder form
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderData, setReminderData] = useState({
    due_at: new Date().toISOString().split('T')[0],
    message: '',
  });
  const [creatingReminder, setCreatingReminder] = useState(false);

  useEffect(() => {
    const loadContact = async () => {
      try {
        if (!id) return;
        const data = await getContact(id);
        setContact(data);
        setEditData({
          full_name: data.full_name,
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          tags: data.tags || '',
          notes: data.notes || '',
        });
      } catch (err) {
        setError('Failed to load contact');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadContact();
  }, [id]);

  const handleSaveEdit = async () => {
    try {
      if (!id) return;
      const updated = await updateContact(id, editData);
      setContact({
        ...contact!,
        ...updated,
        interactions: contact!.interactions,
        interaction_count: contact!.interaction_count,
      });
      setEditMode(false);
    } catch (err) {
      setError('Failed to update contact');
      console.error(err);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm('Delete this contact?')) return;
    try {
      if (!id) return;
      await deleteContact(id);
      navigate('/crm/contacts');
    } catch (err) {
      setError('Failed to delete contact');
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionData.notes.trim()) return;

    setCreatingInteraction(true);
    try {
      if (!id) return;
      const newInteraction = await createInteraction(id, {
        ...interactionData,
        date: new Date(interactionData.date).toISOString(),
      } as any);

      setContact({
        ...contact!,
        interactions: [newInteraction, ...contact!.interactions],
        interaction_count: contact!.interaction_count + 1,
      });

      setInteractionData({
        date: new Date().toISOString().split('T')[0],
        medium: 'call',
        notes: '',
      });
      setShowInteractionForm(false);
    } catch (err) {
      setError('Failed to add interaction');
      console.error(err);
    } finally {
      setCreatingInteraction(false);
    }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!confirm('Delete this interaction?')) return;
    try {
      await deleteInteraction(interactionId);
      setContact({
        ...contact!,
        interactions: contact!.interactions.filter(i => i.id !== interactionId),
        interaction_count: contact!.interaction_count - 1,
      });
    } catch (err) {
      setError('Failed to delete interaction');
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderData.message.trim()) return;

    setCreatingReminder(true);
    try {
      if (!id) return;
      await createReminder({
        contact: id,
        due_at: new Date(reminderData.due_at).toISOString(),
        message: reminderData.message,
      });

      setReminderData({
        due_at: new Date().toISOString().split('T')[0],
        message: '',
      });
      setShowReminderForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create reminder');
      console.error(err);
    } finally {
      setCreatingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contact) {
    return (
      <Alert variant="danger">
        Contact not found
      </Alert>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {error && (
        <Alert
          variant="danger"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Contact Info */}
      <Card variant="gradient" padding="md">
        <CardHeader
          title={contact.full_name}
          action={
            editMode ? (
              <div className="flex gap-1">
                <Button variant="secondary" size="sm" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            )
          }
        />

        {editMode ? (
          <div className="space-y-2">
            <Input
              label="Full Name"
              value={editData.full_name}
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
            <Input
              label="Company"
              value={editData.company}
              onChange={(e) => setEditData({ ...editData, company: e.target.value })}
            />
            <Input
              label="Tags (comma-separated)"
              value={editData.tags}
              onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
            />
            <Textarea
              label="Notes"
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              rows={3}
            />
          </div>
        ) : (
          <div className="space-y-2 text-surface-300">
            {contact.email && <p>📧 {contact.email}</p>}
            {contact.phone && <p>📱 {contact.phone}</p>}
            {contact.company && <p>🏢 {contact.company}</p>}
            {contact.tags && <p>🏷️ {contact.tags}</p>}
            {contact.notes && <p className="text-surface-400 italic">{contact.notes}</p>}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-surface-700">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteContact}
          >
            Delete Contact
          </Button>
        </div>
      </Card>

      {/* Interactions */}
      <Card variant="default" padding="md">
        <CardHeader
          title={`Interactions (${contact.interaction_count})`}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowInteractionForm(!showInteractionForm)}
            >
              {showInteractionForm ? 'Cancel' : 'Add'}
            </Button>
          }
        />

        {showInteractionForm && (
          <form onSubmit={handleAddInteraction} className="mb-3 space-y-2 p-3 bg-surface-900 rounded">
            <Input
              label="Date"
              type="date"
              value={interactionData.date}
              onChange={(e) => setInteractionData({ ...interactionData, date: e.target.value })}
            />
            <Select
              label="Medium"
              value={interactionData.medium}
              onChange={(e) => setInteractionData({ ...interactionData, medium: e.target.value as any })}
              options={[
                { value: 'call', label: 'Phone Call' },
                { value: 'email', label: 'Email' },
                { value: 'in-person', label: 'In-Person' },
                { value: 'text', label: 'Text' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Textarea
              label="Notes"
              value={interactionData.notes}
              onChange={(e) => setInteractionData({ ...interactionData, notes: e.target.value })}
              rows={2}
            />
            <Button type="submit" loading={creatingInteraction} fullWidth>
              Save Interaction
            </Button>
          </form>
        )}

        {contact.interactions.length === 0 ? (
          <p className="text-surface-500 text-center py-4">No interactions yet</p>
        ) : (
          <div className="space-y-2">
            {contact.interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="p-2 bg-surface-900 rounded border border-surface-700 group hover:border-surface-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-300 text-small">
                      {interaction.medium_display} • {new Date(interaction.date).toLocaleDateString()}
                    </p>
                    <p className="text-surface-200">{interaction.notes}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteInteraction(interaction.id)}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reminders */}
      <Card variant="default" padding="md">
        <CardHeader
          title="Set Reminder"
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowReminderForm(!showReminderForm)}
            >
              {showReminderForm ? 'Cancel' : 'Add'}
            </Button>
          }
        />

        {showReminderForm && (
          <form onSubmit={handleAddReminder} className="space-y-2 p-3 bg-surface-900 rounded">
            <Input
              label="Due Date"
              type="date"
              value={reminderData.due_at}
              onChange={(e) => setReminderData({ ...reminderData, due_at: e.target.value })}
            />
            <Textarea
              label="Reminder Message"
              value={reminderData.message}
              onChange={(e) => setReminderData({ ...reminderData, message: e.target.value })}
              rows={2}
            />
            <Button type="submit" loading={creatingReminder} fullWidth>
              Create Reminder
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
