import React, { useState } from 'react';
import { Button, Card, CardHeader, Input, Select, Textarea, Alert, Badge, Dialog } from '../ui';
import { ItemDetail, Warranty, createWarranty, updateWarranty, deleteWarranty } from '../../lib/inventoryService';

interface WarrantiesPanelProps {
  item: ItemDetail;
  onWarrantiesChange: () => void;
}

export function WarrantiesPanel({ item, onWarrantiesChange }: WarrantiesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    warranty_type: 'MANUFACTURER',
    provider: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    terms: '',
    claim_instructions: '',
  });

  async function handleAddWarranty(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.end_date) {
      setError('End date is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createWarranty({
        item: item.id,
        ...formData,
      });
      setShowAddForm(false);
      setFormData({
        warranty_type: 'MANUFACTURER',
        provider: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        terms: '',
        claim_instructions: '',
      });
      onWarrantiesChange();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWarranty(id: string) {
    if (confirm('Delete this warranty?')) {
      try {
        await deleteWarranty(id);
        onWarrantiesChange();
      } catch (err) {
        setError(String(err));
      }
    }
  }

  const warrantyTypes = [
    { value: 'MANUFACTURER', label: 'Manufacturer' },
    { value: 'EXTENDED', label: 'Extended' },
    { value: 'STORE', label: 'Store' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <Card variant="outlined" padding="md">
      <CardHeader
        title={`Warranties (${item.warranties.length})`}
        action={<Button variant="ghost" size="sm" onClick={() => setShowAddForm(!showAddForm)}>+ Add</Button>}
      />

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">{error}</Alert>}

      {item.warranties.length === 0 && !showAddForm && (
        <p className="text-center text-surface-500 text-caption py-3">No warranties yet. Add one to track coverage.</p>
      )}

      <div className="space-y-2">
        {item.warranties.map((warranty) => (
          <div key={warranty.id} className="p-2 bg-surface-700 rounded border border-surface-600">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-body font-medium">{warranty.warranty_type}</p>
                {warranty.provider && <p className="text-caption text-surface-400">{warranty.provider}</p>}
                <p className="text-small text-surface-500">
                  {new Date(warranty.start_date).toLocaleDateString()} - {new Date(warranty.end_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                {warranty.is_active && <Badge variant="success" size="sm">Active</Badge>}
                {!warranty.is_active && new Date(warranty.end_date) < new Date() && <Badge variant="danger" size="sm">Expired</Badge>}
                <Button variant="ghost" size="sm" onClick={() => handleDeleteWarranty(warranty.id)}>×</Button>
              </div>
            </div>
            {warranty.terms && <p className="text-small text-surface-400 mt-1">{warranty.terms}</p>}
          </div>
        ))}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddWarranty} className="mt-3 p-2 bg-surface-800 rounded border border-surface-600 space-y-1.5">
          <Select
            label="Warranty Type"
            value={formData.warranty_type}
            onChange={(e) => setFormData({ ...formData, warranty_type: e.target.value })}
            options={warrantyTypes}
          />
          <Input
            label="Provider"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            placeholder="e.g., Samsung, Best Buy"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="End Date*"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>
          <Textarea
            label="Terms"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            rows={2}
          />
          <Textarea
            label="Claim Instructions"
            value={formData.claim_instructions}
            onChange={(e) => setFormData({ ...formData, claim_instructions: e.target.value })}
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
