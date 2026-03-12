import React, { useState } from 'react';
import { Button, Card, CardHeader, Input, Select, Textarea, Alert } from '../ui';
import { ItemDetail, createAttachment, deleteAttachment } from '../../lib/inventoryService';

interface AttachmentsPanelProps {
  item: ItemDetail;
  onAttachmentsChange: () => void;
}

export function AttachmentsPanel({ item, onAttachmentsChange }: AttachmentsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    attachment_type: 'URL',
    title: '',
    url: '',
    notes: '',
  });

  async function handleAddAttachment(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.url) {
      setError('URL is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createAttachment({
        item: item.id,
        ...formData,
      });
      setShowAddForm(false);
      setFormData({ attachment_type: 'URL', title: '', url: '', notes: '' });
      onAttachmentsChange();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAttachment(id: string) {
    if (confirm('Delete this attachment?')) {
      try {
        await deleteAttachment(id);
        onAttachmentsChange();
      } catch (err) {
        setError(String(err));
      }
    }
  }

  return (
    <Card variant="outlined" padding="md">
      <CardHeader
        title={`Receipts & Documents (${item.attachments.length})`}
        action={<Button variant="ghost" size="sm" onClick={() => setShowAddForm(!showAddForm)}>+ Add</Button>}
      />

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">{error}</Alert>}

      {item.attachments.length === 0 && !showAddForm && (
        <p className="text-center text-surface-500 text-caption py-3">No attachments yet. Link receipts or documents.</p>
      )}

      <div className="space-y-2">
        {item.attachments.map((att) => (
          <div key={att.id} className="p-2 bg-surface-700 rounded border border-surface-600">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-body font-medium">{att.title || 'Attachment'}</p>
                {att.url && (
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-small text-primary-400 hover:underline">
                    {att.url}
                  </a>
                )}
                {att.notes && <p className="text-small text-surface-400 mt-1">{att.notes}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(att.id)}>×</Button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddAttachment} className="mt-3 p-2 bg-surface-800 rounded border border-surface-600 space-y-1.5">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Receipt, Invoice"
          />
          <Input
            label="URL*"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://..."
            required
          />
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
          <div className="flex gap-1 pt-1">
            <Button variant="primary" size="sm" type="submit" loading={loading}>Add</Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
