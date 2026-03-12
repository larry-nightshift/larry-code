import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Alert, Spinner, Button, Input, Textarea, Dialog } from '../ui';
import { getLocations, createLocation, updateLocation, deleteLocation, Location } from '../../lib/inventoryService';

export function LocationsList() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', notes: '' });

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    setLoading(true);
    setError(null);
    try {
      const data = await getLocations(false);
      const locationList = Array.isArray(data) ? data : data.results || [];
      setLocations(locationList);
    } catch (err) {
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.name) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateLocation(editingId, formData);
      } else {
        await createLocation(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', notes: '' });
      await loadLocations();
    } catch (err) {
      setError('Failed to save location');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return;

    setSaving(true);
    try {
      await deleteLocation(id);
      await loadLocations();
    } catch (err) {
      setError('Failed to delete location');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(location: Location) {
    setEditingId(location.id);
    setFormData({ name: location.name, notes: location.notes || '' });
    setShowForm(true);
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <CardHeader title="Locations" action={
          <Button variant="primary" size="sm" onClick={() => {
            setEditingId(null);
            setFormData({ name: '', notes: '' });
            setShowForm(true);
          }}>Add Location</Button>
        } />

        {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">{error}</Alert>}

        {locations.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">No locations yet. Create one to organize your items!</p>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => (
              <div key={location.id} className="flex justify-between items-start p-3 bg-surface-700 rounded border border-surface-600">
                <div className="flex-1">
                  <p className="text-body font-medium">{location.name}</p>
                  {location.notes && <p className="text-caption text-surface-400">{location.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(location)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(location.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Location' : 'Add Location'}>
        <div className="space-y-2">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Kitchen, Garage, Basement"
          />
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional notes about this location"
            rows={2}
          />
          <div className="flex gap-2 mt-3">
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingId ? 'Update' : 'Create'} Location
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
