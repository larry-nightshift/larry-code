import { useState } from 'react';
import type { Asset } from '../../lib/maintenanceService';
import { Dialog, Input, Textarea, Select, Button } from '../ui';
import { createAsset } from '../../lib/maintenanceService';

interface AssetFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AssetForm({ onClose, onSuccess }: AssetFormProps) {
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    category: 'OTHER',
    location: '',
    manufacturer: '',
    model_number: '',
    serial_number: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = [
    { value: 'HVAC', label: 'HVAC' },
    { value: 'KITCHEN', label: 'Kitchen' },
    { value: 'PLUMBING', label: 'Plumbing' },
    { value: 'ELECTRICAL', label: 'Electrical' },
    { value: 'VEHICLE', label: 'Vehicle' },
    { value: 'OUTDOOR', label: 'Outdoor' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name) {
      setError('Asset name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAsset(formData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} title="Add New Asset">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg text-danger-300 text-caption">
            {error}
          </div>
        )}

        <Input
          label="Asset Name *"
          placeholder="e.g., Furnace, Dishwasher"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Select
          label="Category *"
          options={categoryOptions}
          value={formData.category || 'OTHER'}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
        />

        <Input
          label="Location"
          placeholder="e.g., Basement, Kitchen"
          value={formData.location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />

        <Input
          label="Manufacturer"
          placeholder="e.g., Lennox, Whirlpool"
          value={formData.manufacturer || ''}
          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
        />

        <Input
          label="Model Number"
          placeholder="e.g., XC21-500"
          value={formData.model_number || ''}
          onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
        />

        <Input
          label="Serial Number"
          placeholder="e.g., SN123456789"
          value={formData.serial_number || ''}
          onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
        />

        <Input
          label="Purchase Date"
          type="date"
          value={formData.purchase_date || ''}
          onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
        />

        <Textarea
          label="Notes"
          placeholder="Add any additional notes..."
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />

        <div className="flex gap-1.5 pt-2">
          <Button
            variant="primary"
            type="submit"
            fullWidth
            loading={isSubmitting}
          >
            Create Asset
          </Button>
          <Button
            variant="ghost"
            type="button"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
