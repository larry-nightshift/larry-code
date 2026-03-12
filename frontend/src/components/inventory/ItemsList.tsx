import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Alert, Spinner, Button, Input, Select } from '../ui';
import { getItems, getLocations, ItemList, Location } from '../../lib/inventoryService';
import { useNavigate } from 'react-router-dom';

export function ItemsList() {
  const [items, setItems] = useState<ItemList[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const navigate = useNavigate();

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    loadItems();
  }, [searchQuery, selectedCategory, selectedLocation, status]);

  async function loadLocations() {
    try {
      const data = await getLocations(false);
      const locationList = Array.isArray(data) ? data : data.results || [];
      setLocations(locationList);
    } catch (err) {
      console.error('Failed to load locations');
    }
  }

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const data = await getItems({
        status: status || undefined,
        category: selectedCategory || undefined,
        location_id: selectedLocation || undefined,
        search: searchQuery || undefined,
      });
      const itemList = Array.isArray(data) ? data : data.results || [];
      setItems(itemList);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  const categories = ['APPLIANCE', 'ELECTRONICS', 'COMPUTER', 'PHONE_TABLET', 'TOOL', 'FURNITURE', 'VEHICLE', 'MISC'];

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <CardHeader title="Inventory Items" action={<Button variant="primary" size="sm" onClick={() => navigate('/inventory/items/new')}>Add Item</Button>} />

        {/* Filters */}
        <div className="space-y-2 mb-3">
          <Input
            placeholder="Search by name, brand, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="md"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'SOLD', label: 'Sold' },
                { value: 'DISCARDED', label: 'Discarded' },
              ]}
            />
            <Select
              label="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(c => ({ value: c, label: c }))
              ]}
            />
            <Select
              label="Location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              options={[
                { value: '', label: 'All Locations' },
                ...locations.map(l => ({ value: l.id, label: l.name }))
              ]}
            />
          </div>
        </div>

        {loading && <Spinner />}
        {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        {!loading && items.length === 0 && (
          <p className="text-center text-surface-500 text-caption py-4">No items found. Create your first inventory item!</p>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start p-3 bg-surface-700 rounded border border-surface-600 cursor-pointer hover:bg-surface-600 transition-base"
                onClick={() => navigate(`/inventory/items/${item.id}`)}
              >
                <div className="flex-1">
                  <p className="text-body font-medium">{item.name}</p>
                  <p className="text-caption text-surface-400">
                    {item.category}
                    {item.brand && ` • ${item.brand}`}
                    {item.location_name && ` • ${item.location_name}`}
                  </p>
                  {item.purchase_date && (
                    <p className="text-small text-surface-500">Purchased: {new Date(item.purchase_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="text-right">
                  {item.active_warranty_count > 0 && (
                    <p className="text-caption text-success-400 font-medium">{item.active_warranty_count} warranty</p>
                  )}
                  {item.next_warranty_expiry && (
                    <p className="text-small text-surface-500">Expires: {new Date(item.next_warranty_expiry).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
