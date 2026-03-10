import { useMemo } from 'react';

interface CalendarGridProps {
  dates: string[]; // List of completed dates (YYYY-MM-DD)
  color?: string;
  onDateClick?: (date: string) => void;
}

export function CalendarGrid({ dates, color = 'primary-500', onDateClick }: CalendarGridProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const completedSet = useMemo(() => new Set(dates), [dates]);

  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const colorClasses: Record<string, string> = {
    'primary-500': 'bg-primary-500',
    'success-500': 'bg-success-500',
    'warning-500': 'bg-warning-500',
    'danger-500': 'bg-danger-500',
    'info-500': 'bg-info-500',
    'purple-500': 'bg-purple-500',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-body font-medium text-surface-100">{monthName}</h3>

      <div className="space-y-1.5">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-caption text-surface-500 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1.5">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1.5">
              {week.map((day, dayIdx) => {
                if (day === null) {
                  return <div key={`empty-${dayIdx}`} className="aspect-square" />;
                }

                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isCompleted = completedSet.has(dateStr);
                const isToday =
                  day === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() => onDateClick?.(dateStr)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-small font-medium transition-base ${
                      isCompleted
                        ? `${colorClasses[color] || colorClasses['primary-500']} text-white shadow-sm`
                        : isToday
                          ? 'bg-surface-700 border-2 border-primary-500 text-surface-100'
                          : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
