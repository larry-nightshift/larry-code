import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MaintenanceRecord } from '../../lib/maintenanceService';
import { Card, Input, Spinner } from '../ui';
import { recordsList } from '../../lib/maintenanceService';

export function HistoryPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Default to last 90 days
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 90);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-records', { fromDate, toDate }],
    queryFn: () =>
      recordsList(undefined, undefined, fromDate || defaultFromDate.toISOString().split('T')[0], toDate),
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCost = (cost?: string) => {
    if (!cost) return 'No cost';
    return `$${parseFloat(cost).toFixed(2)}`;
  };

  return (
    <div className="space-y-3">
      <h1 className="text-h2">Maintenance History</h1>

      {/* Date filters */}
      <Card padding="md" variant="outlined">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </Card>

      {/* Records list */}
      {isLoading ? (
        <Card padding="lg" className="text-center">
          <Spinner size="lg" />
        </Card>
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((record: MaintenanceRecord) => (
            <Card key={record.id} variant="outlined" padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-surface-100 mb-1">
                    Completed on {formatDate(record.completed_date)}
                  </h4>
                  {record.notes && (
                    <p className="text-caption text-surface-400 mb-2">{record.notes}</p>
                  )}
                  <div className="flex items-center gap-4 text-small text-surface-500">
                    <span>{formatCost(record.cost)}</span>
                    {record.performed_by && <span>{record.performed_by}</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-surface-500">No maintenance records found</p>
        </Card>
      )}
    </div>
  );
}
