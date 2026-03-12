import React, { useState } from 'react';
import { Button, Card, CardHeader, Input, Select, Textarea, Alert } from '../ui';
import { ItemDetail, createServiceEvent, updateServiceEvent, deleteServiceEvent } from '../../lib/inventoryService';

interface ServiceHistoryPanelProps {
  item: ItemDetail;
  onEventsChange: () => void;
}

export function ServiceHistoryPanel({ item, onEventsChange }: ServiceHistoryPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_type: 'MAINTENANCE',
    occurred_at: new Date().toISOString().split('T')[0],
    cost: '',
    vendor: '',
    notes: '',
  });

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.notes) {
      setError('Notes are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createServiceEvent({
        item: item.id,
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        occurred_at: formData.occurred_at + 'T12:00:00Z',
      });
      setShowAddForm(false);
      setFormData({
        event_type: 'MAINTENANCE',
        occurred_at: new Date().toISOString().split('T')[0],
        cost: '',
        vendor: '',
        notes: '',
      });
      onEventsChange();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    if (confirm('Delete this service event?')) {
      try {
        await deleteServiceEvent(id);
        onEventsChange();
      } catch (err) {
        setError(String(err));
      }
    }
  }

  const eventTypes = [
    { value: 'REPAIR', label: 'Repair' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'INSTALL', label: 'Install' },
    { value: 'INSPECTION', label: 'Inspection' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <Card variant="outlined" padding="md">
      <CardHeader
        title={`Service History (${item.service_events.length})`}
        action={<Button variant="ghost" size="sm" onClick={() => setShowAddForm(!showAddForm)}>+ Log</Button>}
      />

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">{error}</Alert>}

      {item.service_events.length === 0 && !showAddForm && (
        <p className="text-center text-surface-500 text-caption py-3">No service events yet. Record maintenance and repairs here.</p>
      )}

      <div className="space-y-2">
        {item.service_events.map((event) => (
          <div key={event.id} className="p-2 bg-surface-700 rounded border border-surface-600">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-body font-medium">{event.event_type || 'Service'}</p>
                <p className="text-small text-surface-400">
                  {new Date(event.occurred_at).toLocaleDateString()} {event.vendor && `• ${event.vendor}`}
                  {event.cost && ` • $${event.cost}`}
                </p>
                <p className="text-small text-surface-300 mt-1">{event.notes}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>×</Button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddEvent} className="mt-3 p-2 bg-surface-800 rounded border border-surface-600 space-y-1.5">
          <Select
            label="Event Type"
            value={formData.event_type}
            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
            options={eventTypes}
          />
          <Input
            label="Date"
            type="date"
            value={formData.occurred_at}
            onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              label="Vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="e.g., Best Buy"
            />
            <Input
              label="Cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <Textarea
            label="Notes*"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Describe the service performed..."
            rows={2}
            required
          />
          <div className="flex gap-1 pt-1">
            <Button variant="primary" size="sm" type="submit" loading={loading}>Log</Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
