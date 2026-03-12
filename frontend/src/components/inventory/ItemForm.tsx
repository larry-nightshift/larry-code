import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Alert, Button, Input, Select, Textarea, Spinner } from '../ui';
import { getItem, getLocations, createItem, updateItem, ItemDetail, Location } from '../../lib/inventoryService';
import { useNavigate, useParams } from 'react-router-dom';

export function ItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Partial<ItemDetail> | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = ['APPLIANCE', 'ELECTRONICS', 'COMPUTER', 'PHONE_TABLET', 'TOOL', 'FURNITURE', 'VEHICLE', 'MISC'];
  const statusOptions = ['ACTIVE', 'SOLD', 'DISCARDED'];

  useEffect(() => {
    loadLocations();
    if (id && id !== 'new') {
      loadItem();
    } else {
      setItem({
        name: '',
        category: 'APPLIANCE',
        status: 'ACTIVE',
      });
    }
  }, [id]);

  async function loadLocations() {
    try {
      const data = await getLocations(false);
      const locationList = Array.isArray(data) ? data : data.results || [];
      setLocations(locationList);
    } catch (err) {
      console.error('Failed to load locations');
    }
  }

  async function loadItem() {
    if (!id || id === 'new') return;
    try {
      const data = await getItem(id);
      setItem(data);
    } catch (err) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!item?.name || !item?.category) {
      setError('Name and category are required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (id && id !== 'new') {
        await updateItem(id, item);
      } else {
        await createItem(item);
      }
      navigate('/inventory/items');
    } catch (err) {
      setError('Failed to save item');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Spinner />;
  }

  if (!item) {
    return <Alert variant="danger">Failed to load item</Alert>;
  }

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <CardHeader title={id && id !== 'new' ? 'Edit Item' : 'Add New Item'} />

        {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-3">{error}</Alert>}

        <div className="space-y-2">
          <Input
            label="Item Name *"
            value={item.name || ''}
            onChange={(e) => setItem({ ...item, name: e.target.value })}
            placeholder="e.g., Dyson V8 Vacuum"
          />

          <Select
            label="Category *"
            value={item.category || 'APPLIANCE'}
            onChange={(e) => setItem({ ...item, category: e.target.value })}
            options={categories.map(c => ({ value: c, label: c }))}
          />

          <Input
            label="Brand"
            value={item.brand || ''}
            onChange={(e) => setItem({ ...item, brand: e.target.value })}
            placeholder="e.g., Dyson"
          />

          <Input
            label="Model Number"
            value={item.model_number || ''}
            onChange={(e) => setItem({ ...item, model_number: e.target.value })}
            placeholder="e.g., V8 Absolute"
          />

          <Input
            label="Serial Number"
            value={item.serial_number || ''}
            onChange={(e) => setItem({ ...item, serial_number: e.target.value })}
            placeholder="e.g., 12345ABC"
          />

          <Input
            label="Purchase Date"
            type="date"
            value={item.purchase_date || ''}
            onChange={(e) => setItem({ ...item, purchase_date: e.target.value })}
          />

          <Input
            label="Purchase Price"
            type="number"
            step="0.01"
            value={item.purchase_price || ''}
            onChange={(e) => setItem({ ...item, purchase_price: parseFloat(e.target.value) || undefined })}
            placeholder="0.00"
          />

          <Input
            label="Vendor / Store"
            value={item.vendor || ''}
            onChange={(e) => setItem({ ...item, vendor: e.target.value })}
            placeholder="e.g., Best Buy"
          />

          <Select
            label="Location"
            value={item.location || ''}
            onChange={(e) => setItem({ ...item, location: e.target.value || undefined })}
            options={[
              { value: '', label: 'No location' },
              ...locations.map(l => ({ value: l.id, label: l.name }))
            ]}
          />

          <Select
            label="Status"
            value={item.status || 'ACTIVE'}
            onChange={(e) => setItem({ ...item, status: e.target.value as 'ACTIVE' | 'SOLD' | 'DISCARDED' })}
            options={statusOptions.map(s => ({ value: s, label: s }))}
          />

          <Textarea
            label="Notes"
            value={item.notes || ''}
            onChange={(e) => setItem({ ...item, notes: e.target.value })}
            placeholder="Any additional details..."
            rows={3}
          />

          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Save Item
            </Button>
            <Button variant="ghost" onClick={() => navigate('/inventory/items')}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
