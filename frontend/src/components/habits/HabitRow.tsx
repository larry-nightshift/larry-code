import { TodayHabit } from '../../lib/habitsService';
import { Button, Badge } from '../ui';
import { StreakBadge } from './StreakBadge';

interface HabitRowProps {
  habit: TodayHabit;
  onToggle: (habitId: string) => void;
}

export function HabitRow({ habit, onToggle }: HabitRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-800 hover:bg-surface-700/50 transition-base">
      <button
        onClick={() => onToggle(habit.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 transition-base ${
          habit.completed_today
            ? 'bg-success-500 border-success-500'
            : 'border-surface-600 hover:border-surface-500'
        }`}
        aria-label={`Toggle ${habit.name}`}
      >
        {habit.completed_today && (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <h3 className="text-body font-medium text-surface-100 truncate">{habit.name}</h3>
        <p className="text-caption text-surface-500">
          {habit.schedule_type === 'DAILY' ? 'Daily' : `${habit.weekly_target}x per week`}
        </p>
      </div>

      {habit.schedule_type === 'WEEKLY' && habit.week_progress && (
        <Badge variant="info" size="sm">
          {habit.week_progress.display}
        </Badge>
      )}

      <StreakBadge current={habit.current_streak} best={habit.best_streak} />
    </div>
  );
}
