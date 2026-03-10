import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DueTask } from '../../lib/maintenanceService';
import { Card, CardHeader, Button, Alert, Spinner } from '../ui';
import { getDue, createRecord } from '../../lib/maintenanceService';
import { RecordModal } from './RecordModal';
import { DueTaskRow } from './DueTaskRow';

export function DuePage() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon' | 'upcoming'>('all');

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['maintenance-due'],
    queryFn: () => getDue(),
  });

  useEffect(() => {
    if (queryError) {
      setError('Failed to load maintenance tasks');
    }
  }, [queryError]);

  const handleMarkDone = async (taskId: string, completedDate: string, notes?: string, cost?: string) => {
    try {
      await createRecord({
        task_id: taskId,
        completed_date: completedDate,
        notes,
        cost,
      });
      setSelectedTask(null);
      refetch();
    } catch (err) {
      setError('Failed to record completion. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Card padding="lg" className="text-center">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (!data) {
    return <Card padding="lg">No data available</Card>;
  }

  const allEmpty = data.overdue.length === 0 && data.due_soon.length === 0 && data.upcoming.length === 0;

  const getVisibleTasks = () => {
    switch (filter) {
      case 'overdue':
        return data.overdue;
      case 'due_soon':
        return data.due_soon;
      case 'upcoming':
        return data.upcoming;
      default:
        return [...data.overdue, ...data.due_soon, ...data.upcoming];
    }
  };

  const visibleTasks = getVisibleTasks();

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

      {/* Quick filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        {data.overdue.length > 0 && (
          <Button
            variant={filter === 'overdue' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('overdue')}
          >
            Overdue ({data.overdue.length})
          </Button>
        )}
        {data.due_soon.length > 0 && (
          <Button
            variant={filter === 'due_soon' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('due_soon')}
          >
            Due Soon ({data.due_soon.length})
          </Button>
        )}
        {data.upcoming.length > 0 && (
          <Button
            variant={filter === 'upcoming' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Upcoming ({data.upcoming.length})
          </Button>
        )}
      </div>

      {allEmpty ? (
        <Card variant="gradient" padding="lg" className="text-center">
          <p className="text-success-300 text-h2 mb-1">✓ All Caught Up!</p>
          <p className="text-surface-400">No maintenance tasks due. Great job!</p>
        </Card>
      ) : visibleTasks.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-surface-500">No tasks in this category</p>
        </Card>
      ) : (
        <>
          {/* Overdue section */}
          {(filter === 'all' || filter === 'overdue') && data.overdue.length > 0 && (
            <Card variant="gradient" padding="md">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-danger-300">⚠</span>
                <h3 className="text-h2">Overdue</h3>
              </div>
              <div className="space-y-2">
                {data.overdue.map((task: DueTask) => (
                  <DueTaskRow
                    key={task.id}
                    task={task}
                    onMarkDone={() => setSelectedTask(task.id)}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Due soon section */}
          {(filter === 'all' || filter === 'due_soon') && data.due_soon.length > 0 && (
            <Card variant="gradient" padding="md">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-warning-300">◐</span>
                <h3 className="text-h2">Due Soon</h3>
              </div>
              <div className="space-y-2">
                {data.due_soon.map((task: DueTask) => (
                  <DueTaskRow
                    key={task.id}
                    task={task}
                    onMarkDone={() => setSelectedTask(task.id)}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Upcoming section */}
          {(filter === 'all' || filter === 'upcoming') && data.upcoming.length > 0 && (
            <Card variant="gradient" padding="md">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-info-300">◯</span>
                <h3 className="text-h2">Upcoming</h3>
              </div>
              <div className="space-y-2">
                {data.upcoming.map((task: DueTask) => (
                  <DueTaskRow
                    key={task.id}
                    task={task}
                    onMarkDone={() => setSelectedTask(task.id)}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Record modal */}
      {selectedTask && (
        <RecordModal
          taskId={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={handleMarkDone}
        />
      )}
    </div>
  );
}
