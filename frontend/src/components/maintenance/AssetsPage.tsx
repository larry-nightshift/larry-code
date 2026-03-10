import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Asset } from '../../lib/maintenanceService';
import { Card, Button, Alert, Spinner, Input } from '../ui';
import { assetsList } from '../../lib/maintenanceService';
import { AssetForm } from './AssetForm';

export function AssetsPage() {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['maintenance-assets', { search, category, showArchived }],
    queryFn: () => assetsList(!showArchived, category || undefined, search || undefined),
  });

  const handleAssetCreated = () => {
    setShowForm(false);
    refetch();
  };

  const categories: Array<{ value: string; label: string }> = [
    { value: '', label: 'All Categories' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'KITCHEN', label: 'Kitchen' },
    { value: 'PLUMBING', label: 'Plumbing' },
    { value: 'ELECTRICAL', label: 'Electrical' },
    { value: 'VEHICLE', label: 'Vehicle' },
    { value: 'OUTDOOR', label: 'Outdoor' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <Alert
          variant="danger"
          dismissible
          onDismiss={() => setError(null)}
          className="mb-2"
        >
          {error}
        </Alert>
      )}

      {/* Header with add button */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-h2">Home Assets</h1>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Add Asset
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md" variant="outlined">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Assets list */}
      {isLoading ? (
        <Card padding="lg" className="text-center">
          <Spinner size="lg" />
        </Card>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((asset: Asset) => (
            <Card key={asset.id} variant="gradient" padding="md" hoverable>
              <div className="mb-2">
                <h3 className="text-h2 mb-1">{asset.name}</h3>
                <span className="inline-block px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-small">
                  {asset.category}
                </span>
              </div>

              {asset.location && (
                <p className="text-caption text-surface-400 mb-1">📍 {asset.location}</p>
              )}
              {asset.manufacturer && (
                <p className="text-caption text-surface-400">🏷️ {asset.manufacturer}</p>
              )}

              {asset.notes && (
                <p className="text-caption text-surface-400 mt-2">{asset.notes}</p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-surface-500">No assets found</p>
        </Card>
      )}

      {/* Form modal */}
      {showForm && (
        <AssetForm onClose={() => setShowForm(false)} onSuccess={handleAssetCreated} />
      )}
    </div>
  );
}
