import type { DueTask } from '../../lib/maintenanceService';
import { Button, Badge } from '../ui';

interface DueTaskRowProps {
  task: DueTask;
  onMarkDone: () => void;
}

export function DueTaskRow({ task, onMarkDone }: DueTaskRowProps) {
  const statusColors = {
    OVERDUE: 'danger',
    DUE_SOON: 'warning',
    UPCOMING: 'info',
    SCHEDULED: 'default',
  } as const;

  const priorityColors = {
    LOW: 'info',
    MEDIUM: 'default',
    HIGH: 'danger',
  } as const;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex items-center justify-between gap-2 p-3 bg-surface-800 rounded-lg border border-surface-700 hover:border-surface-600 transition-base">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-surface-100 truncate">{task.title}</span>
          {task.priority && task.priority !== 'MEDIUM' && (
            <Badge variant={priorityColors[task.priority]} size="sm">
              {task.priority.charAt(0)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-surface-400 text-caption">
          {task.asset_name && (
            <>
              <span>{task.asset_name}</span>
              <span className="text-surface-600">•</span>
            </>
          )}
          <span>{formatDate(task.next_due_date || '')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant={statusColors[task.status]} size="sm">
          {task.status.replace('_', ' ')}
        </Badge>
        <Button variant="primary" size="sm" onClick={onMarkDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
