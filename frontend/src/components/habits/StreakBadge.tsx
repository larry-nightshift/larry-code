import { Badge } from '../ui';

interface StreakBadgeProps {
  current: number;
  best: number;
}

export function StreakBadge({ current, best }: StreakBadgeProps) {
  return (
    <div className="flex gap-2 items-center">
      <Badge variant="primary" size="md">
        🔥 {current}
      </Badge>
      <span className="text-caption text-surface-500">Best: {best}</span>
    </div>
  );
}
