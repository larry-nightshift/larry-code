import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Alert, Spinner, Button, Badge, Input, Textarea, Select, Dialog } from '../ui';
import { getItem, deleteItem, createWarranty, deleteWarranty, createAttachment, deleteAttachment, createServiceEvent, deleteServiceEvent, ItemDetail as ItemDetailType, Warranty, Attachment, ServiceEvent } from '../../lib/inventoryService';
import { useParams, useNavigate } from 'react-router-dom';

export function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Warranty form
  const [showWarrantyForm, setShowWarrantyForm] = useState(false);
  const [warrantyForm, setWarrantyForm] = useState({ warranty_type: 'MANUFACTURER', start_date: '', end_date: '', provider: '' });

  // Attachment form
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [attachmentForm, setAttachmentForm] = useState({ attachment_type: 'URL', title: '', url: '' });

  // Service event form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({ event_type: '', occurred_at: '', notes: '', vendor: '', cost: '' });

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    if (!id) return;
    try {
      const data = await getItem(id);
      setItem(data);
    } catch (err) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteItem() {
    if (!id) return;
    setSaving(true);
    try {
      await deleteItem(id);
      navigate('/inventory/items');
    } catch (err) {
      setError('Failed to delete item');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddWarranty() {
    if (!id || !warrantyForm.start_date || !warrantyForm.end_date) {
      setError('Start and end dates are required');
      return;
    }
    setSaving(true);
    try {
      await createWarranty({ item: id, ...warrantyForm });
      setShowWarrantyForm(false);
      setWarrantyForm({ warranty_type: 'MANUFACTURER', start_date: '', end_date: '', provider: '' });
      await loadItem();
    } catch (err) {
      setError('Failed to add warranty');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWarranty(warrantyId: string) {
    setSaving(true);
    try {
      await deleteWarranty(warrantyId);
      await loadItem();
    } catch (err) {
      setError('Failed to delete warranty');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAttachment() {
    if (!id || !attachmentForm.url) {
      setError('URL is required');
      return;
    }
    setSaving(true);
    try {
      await createAttachment({ item: id, ...attachmentForm });
      setShowAttachmentForm(false);
      setAttachmentForm({ attachment_type: 'URL', title: '', url: '' });
      await loadItem();
    } catch (err) {
      setError('Failed to add attachment');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    setSaving(true);
    try {
      await deleteAttachment(attachmentId);
      await loadItem();
    } catch (err) {
      setError('Failed to delete attachment');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddServiceEvent() {
    if (!id || !serviceForm.notes || !serviceForm.occurred_at) {
      setError('Date and notes are required');
      return;
    }
    setSaving(true);
    try {
      await createServiceEvent({ item: id, ...serviceForm, cost: serviceForm.cost ? parseFloat(serviceForm.cost) : undefined });
      setShowServiceForm(false);
      setServiceForm({ event_type: '', occurred_at: '', notes: '', vendor: '', cost: '' });
      await loadItem();
    } catch (err) {
      setError('Failed to add service event');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteService(serviceId: string) {
    setSaving(true);
    try {
      await deleteServiceEvent(serviceId);
      await loadItem();
    } catch (err) {
      setError('Failed to delete service event');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (!item) return <Alert variant="danger">Item not found</Alert>;

  return (
    <div className="space-y-3">
      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Item Summary */}
      <Card variant="gradient" padding="md">
        <CardHeader title={item.name} action={
          <div className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/inventory/items/${id}/edit`)}>Edit</Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>Delete</Button>
          </div>
        } />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
          <div>
            <p className="text-surface-500">Category</p>
            <p className="text-surface-100">{item.category}</p>
          </div>
          {item.brand && (
            <div>
              <p className="text-surface-500">Brand</p>
              <p className="text-surface-100">{item.brand}</p>
            </div>
          )}
          {item.model_number && (
            <div>
              <p className="text-surface-500">Model</p>
              <p className="text-surface-100 font-mono">{item.model_number}</p>
            </div>
          )}
          {item.serial_number && (
            <div>
              <p className="text-surface-500">Serial</p>
              <p className="text-surface-100 font-mono">{item.serial_number}</p>
            </div>
          )}
          {item.purchase_date && (
            <div>
              <p className="text-surface-500">Purchased</p>
              <p className="text-surface-100">{new Date(item.purchase_date).toLocaleDateString()}</p>
            </div>
          )}
          {item.purchase_price && (
            <div>
              <p className="text-surface-500">Price</p>
              <p className="text-surface-100">${item.purchase_price}</p>
            </div>
          )}
          {item.location_name && (
            <div>
              <p className="text-surface-500">Location</p>
              <p className="text-surface-100">{item.location_name}</p>
            </div>
          )}
        </div>
        {item.notes && (
          <div className="mt-2 p-2 bg-surface-700 rounded text-caption">
            <p className="text-surface-500">Notes</p>
            <p className="text-surface-100">{item.notes}</p>
          </div>
        )}
      </Card>

      {/* Warranties */}
      <Card variant="default" padding="md">
        <CardHeader title="Warranties" action={<Button variant="ghost" size="sm" onClick={() => setShowWarrantyForm(true)}>Add</Button>} />
        {item.warranties.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-2">No warranties yet</p>
        ) : (
          <div className="space-y-2">
            {item.warranties.map((w) => (
              <div key={w.id} className="p-2 bg-surface-800 rounded border border-surface-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-body">{w.warranty_type} {w.provider && `- ${w.provider}`}</p>
                    <p className="text-caption text-surface-400">{new Date(w.start_date).toLocaleDateString()} to {new Date(w.end_date).toLocaleDateString()}</p>
                    {w.is_active && <Badge variant="success" size="sm">Active</Badge>}
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteWarranty(w.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Attachments */}
      <Card variant="default" padding="md">
        <CardHeader title="Receipts & Documents" action={<Button variant="ghost" size="sm" onClick={() => setShowAttachmentForm(true)}>Add Link</Button>} />
        {item.attachments.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-2">No attachments yet</p>
        ) : (
          <div className="space-y-2">
            {item.attachments.map((a) => (
              <div key={a.id} className="p-2 bg-surface-800 rounded border border-surface-700 flex justify-between items-center">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-primary-400 hover:underline">
                  {a.title || a.url}
                </a>
                <Button variant="danger" size="sm" onClick={() => handleDeleteAttachment(a.id)}>Delete</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Service History */}
      <Card variant="default" padding="md">
        <CardHeader title="Service History" action={<Button variant="ghost" size="sm" onClick={() => setShowServiceForm(true)}>Add Event</Button>} />
        {item.service_events.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-2">No service events yet</p>
        ) : (
          <div className="space-y-2">
            {item.service_events.map((s) => (
              <div key={s.id} className="p-2 bg-surface-800 rounded border border-surface-700">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <p className="text-body">{s.event_type || 'Service'}</p>
                    <p className="text-caption text-surface-400">{new Date(s.occurred_at).toLocaleDateString()} {s.vendor && `• ${s.vendor}`}</p>
                    <p className="text-body mt-1">{s.notes}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteService(s.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <Dialog open={showWarrantyForm} onClose={() => setShowWarrantyForm(false)} title="Add Warranty">
        <div className="space-y-2">
          <Select label="Type" value={warrantyForm.warranty_type} onChange={(e) => setWarrantyForm({ ...warrantyForm, warranty_type: e.target.value })} options={[
            { value: 'MANUFACTURER', label: 'Manufacturer' },
            { value: 'EXTENDED', label: 'Extended' },
            { value: 'STORE', label: 'Store' },
            { value: 'OTHER', label: 'Other' },
          ]} />
          <Input label="Provider" value={warrantyForm.provider} onChange={(e) => setWarrantyForm({ ...warrantyForm, provider: e.target.value })} />
          <Input label="Start Date" type="date" value={warrantyForm.start_date} onChange={(e) => setWarrantyForm({ ...warrantyForm, start_date: e.target.value })} />
          <Input label="End Date" type="date" value={warrantyForm.end_date} onChange={(e) => setWarrantyForm({ ...warrantyForm, end_date: e.target.value })} />
          <div className="flex gap-2 mt-3">
            <Button variant="primary" onClick={handleAddWarranty} loading={saving}>Add</Button>
            <Button variant="ghost" onClick={() => setShowWarrantyForm(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showAttachmentForm} onClose={() => setShowAttachmentForm(false)} title="Add Receipt Link">
        <div className="space-y-2">
          <Input label="Title" value={attachmentForm.title} onChange={(e) => setAttachmentForm({ ...attachmentForm, title: e.target.value })} />
          <Input label="URL" type="url" value={attachmentForm.url} onChange={(e) => setAttachmentForm({ ...attachmentForm, url: e.target.value })} />
          <div className="flex gap-2 mt-3">
            <Button variant="primary" onClick={handleAddAttachment} loading={saving}>Add</Button>
            <Button variant="ghost" onClick={() => setShowAttachmentForm(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showServiceForm} onClose={() => setShowServiceForm(false)} title="Add Service Event">
        <div className="space-y-2">
          <Input label="Date" type="datetime-local" value={serviceForm.occurred_at} onChange={(e) => setServiceForm({ ...serviceForm, occurred_at: e.target.value })} />
          <Select label="Type" value={serviceForm.event_type} onChange={(e) => setServiceForm({ ...serviceForm, event_type: e.target.value })} options={[
            { value: '', label: 'Other' },
            { value: 'REPAIR', label: 'Repair' },
            { value: 'MAINTENANCE', label: 'Maintenance' },
            { value: 'INSTALL', label: 'Install' },
            { value: 'INSPECTION', label: 'Inspection' },
          ]} />
          <Input label="Vendor" value={serviceForm.vendor} onChange={(e) => setServiceForm({ ...serviceForm, vendor: e.target.value })} />
          <Input label="Cost" type="number" step="0.01" value={serviceForm.cost} onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })} />
          <Textarea label="Notes" value={serviceForm.notes} onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })} rows={2} />
          <div className="flex gap-2 mt-3">
            <Button variant="primary" onClick={handleAddServiceEvent} loading={saving}>Add</Button>
            <Button variant="ghost" onClick={() => setShowServiceForm(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete Item">
        <p className="mb-3">Are you sure you want to delete this item? This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDeleteItem} loading={saving}>Delete</Button>
          <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
        </div>
      </Dialog>
    </div>
  );
}
