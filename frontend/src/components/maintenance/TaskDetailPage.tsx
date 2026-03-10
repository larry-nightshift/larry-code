import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { MaintenanceRecord } from '../../lib/maintenanceService';
import { Card, Button, Spinner, Alert, Badge } from '../ui';
import { taskDetail, recordsList } from '../../lib/maintenanceService';
import { RecordModal } from './RecordModal';
import { useState } from 'react';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: task, isLoading, refetch } = useQuery({
    queryKey: ['maintenance-task', id],
    queryFn: () => taskDetail(id!),
    enabled: !!id,
  });

  const { data: records } = useQuery({
    queryKey: ['maintenance-records-for-task', id],
    queryFn: () => recordsList(id),
    enabled: !!id,
  });

  const handleRecordCreated = () => {
    setShowRecordModal(false);
    refetch();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card padding="lg" className="text-center">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (!task) {
    return <Card padding="lg">Task not found</Card>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert
          variant="danger"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Task details card */}
      <Card variant="gradient" padding="lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-h1 mb-2">{task.title}</h1>
            {task.description && (
              <p className="text-surface-300 mb-3">{task.description}</p>
            )}
          </div>
          <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'LOW' ? 'info' : 'default'}>
            {task.priority}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-caption text-surface-500 mb-1">Next Due</p>
            <p className="text-h2">{task.next_due_date ? formatDate(task.next_due_date) : 'Not set'}</p>
          </div>
          <div>
            <p className="text-caption text-surface-500 mb-1">Last Completed</p>
            <p className="text-h2">{task.last_completed_date ? formatDate(task.last_completed_date) : 'Never'}</p>
          </div>
          <div>
            <p className="text-caption text-surface-500 mb-1">Recurrence</p>
            <p className="text-h2">{task.interval}x {task.recurrence_type.replace('EVERY_N_', '').toLowerCase()}</p>
          </div>
          <div>
            <p className="text-caption text-surface-500 mb-1">Grace Period</p>
            <p className="text-h2">{task.grace_days} days</p>
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={() => setShowRecordModal(true)}
          size="lg"
        >
          + Record Completion
        </Button>
      </Card>

      {/* Completion history */}
      <Card padding="md">
        <h3 className="text-h2 mb-3">Completion History</h3>
        {records && records.length > 0 ? (
          <div className="space-y-2">
            {records.map((record: MaintenanceRecord) => (
              <div
                key={record.id}
                className="p-3 bg-surface-900 rounded-lg border border-surface-700"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-semibold text-surface-100">
                    {formatDate(record.completed_date)}
                  </p>
                  {record.cost && (
                    <span className="text-success-300 font-semibold">
                      ${parseFloat(record.cost).toFixed(2)}
                    </span>
                  )}
                </div>
                {record.notes && (
                  <p className="text-caption text-surface-400 mb-1">{record.notes}</p>
                )}
                {record.performed_by && (
                  <p className="text-caption text-surface-500">{record.performed_by}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-surface-500 py-4">No completion records yet</p>
        )}
      </Card>

      {/* Record modal */}
      {showRecordModal && id && (
        <RecordModal
          taskId={id}
          onClose={() => setShowRecordModal(false)}
          onSubmit={async () => handleRecordCreated()}
        />
      )}
    </div>
  );
}
