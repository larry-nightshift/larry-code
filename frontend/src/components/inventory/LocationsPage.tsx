import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, Alert, Spinner, Input, Textarea, Dialog } from '../ui';
import { getLocations, createLocation, updateLocation, deleteLocation, Location } from '../../lib/inventoryService';

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) {
      setError('Location name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        await updateLocation(editingId, formData);
      } else {
        await createLocation(formData);
      }
      setFormData({ name: '', notes: '' });
      setEditingId(null);
      setShowAddForm(false);
      await loadLocations();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this location?')) {
      try {
        await deleteLocation(id);
        await loadLocations();
      } catch (err) {
        setError('Failed to delete location');
      }
    }
  }

  if (loading && locations.length === 0) return <Spinner />;

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <CardHeader
          title="Storage Locations"
          action={<Button variant="primary" size="sm" onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setFormData({ name: '', notes: '' }); }}>+ Add Location</Button>}
        />

        {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-3">{error}</Alert>}

        {locations.length === 0 && !showAddForm && (
          <p className="text-center text-surface-500 text-caption py-4">No locations yet. Create one to organize your items!</p>
        )}

        <div className="space-y-2">
          {locations.map((location) => (
            <div key={location.id} className="p-3 bg-surface-700 rounded border border-surface-600">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-body font-medium">{location.name}</p>
                  {location.notes && <p className="text-small text-surface-400 mt-1">{location.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(location.id); setFormData({ name: location.name, notes: location.notes }); setShowAddForm(true); }}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(location.id)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAddForm && (
          <form onSubmit={handleSave} className="mt-3 p-3 bg-surface-800 rounded border border-surface-600 space-y-2">
            <Input
              label="Location Name*"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Kitchen, Garage"
              required
            />
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any notes about this location..."
              rows={2}
            />
            <div className="flex gap-1 pt-2">
              <Button variant="primary" type="submit" loading={loading}>{editingId ? 'Update' : 'Create'}</Button>
              <Button variant="ghost" type="button" onClick={() => { setShowAddForm(false); setEditingId(null); setFormData({ name: '', notes: '' }); }}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
