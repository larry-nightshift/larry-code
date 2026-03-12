import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, Alert, Spinner, Badge, Dialog } from '../ui';
import { getItem, deleteItem, ItemDetail } from '../../lib/inventoryService';
import { WarrantiesPanel } from './WarrantiesPanel';
import { AttachmentsPanel } from './AttachmentsPanel';
import { ServiceHistoryPanel } from './ServiceHistoryPanel';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getItem(id);
      setItem(data);
    } catch (err) {
      setError('Failed to load item details');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteItem(id);
      navigate('/inventory/items');
    } catch (err) {
      setError('Failed to delete item');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  if (loading) return <Spinner />;
  if (!item) return <Alert variant="danger">Item not found</Alert>;

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <CardHeader
          title={item.name}
          action={
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => navigate(`/inventory/items/${id}/edit`)}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteDialog(true)}>Delete</Button>
            </div>
          }
        />

        {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">{error}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-caption text-surface-400">Category</p>
            <p className="text-body font-medium">{item.category}</p>
          </div>
          <div>
            <p className="text-caption text-surface-400">Status</p>
            <p className="text-body font-medium">{item.status}</p>
          </div>
          {item.brand && (
            <div>
              <p className="text-caption text-surface-400">Brand</p>
              <p className="text-body font-medium">{item.brand}</p>
            </div>
          )}
          {item.location_name && (
            <div>
              <p className="text-caption text-surface-400">Location</p>
              <p className="text-body font-medium">{item.location_name}</p>
            </div>
          )}
          {item.model_number && (
            <div>
              <p className="text-caption text-surface-400">Model</p>
              <p className="text-body font-medium cursor-pointer hover:text-primary-400" onClick={() => navigator.clipboard.writeText(item.model_number!)}>{item.model_number}</p>
            </div>
          )}
          {item.serial_number && (
            <div>
              <p className="text-caption text-surface-400">Serial</p>
              <p className="text-body font-medium cursor-pointer hover:text-primary-400" onClick={() => navigator.clipboard.writeText(item.serial_number!)}>{item.serial_number}</p>
            </div>
          )}
          {item.purchase_date && (
            <div>
              <p className="text-caption text-surface-400">Purchased</p>
              <p className="text-body font-medium">{new Date(item.purchase_date).toLocaleDateString()}</p>
            </div>
          )}
          {item.purchase_price && (
            <div>
              <p className="text-caption text-surface-400">Price</p>
              <p className="text-body font-medium">${item.purchase_price}</p>
            </div>
          )}
        </div>

        {item.notes && (
          <div className="mt-3 pt-3 border-t border-surface-700">
            <p className="text-caption text-surface-400">Notes</p>
            <p className="text-body">{item.notes}</p>
          </div>
        )}
      </Card>

      {item.active_warranty && (
        <Card variant="outlined" padding="md">
          <p className="text-caption text-success-400 font-medium mb-2">ACTIVE WARRANTY</p>
          <div className="space-y-1">
            <p className="text-body font-medium">{item.active_warranty.warranty_type} - {item.active_warranty.provider || 'No Provider'}</p>
            <p className="text-caption text-surface-400">
              Expires: {new Date(item.active_warranty.end_date).toLocaleDateString()} ({item.active_warranty.days_remaining} days)
            </p>
          </div>
        </Card>
      )}

      <WarrantiesPanel item={item} onWarrantiesChange={loadItem} />
      <AttachmentsPanel item={item} onAttachmentsChange={loadItem} />
      <ServiceHistoryPanel item={item} onEventsChange={loadItem} />

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Item">
        <p className="text-body mb-3">Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex gap-1.5">
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
          <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
        </div>
      </Dialog>
    </div>
  );
}
