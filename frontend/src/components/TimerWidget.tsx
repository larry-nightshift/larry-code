import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Card } from './ui';

const PRESETS = [
  { label: '25 min', minutes: 25 },
  { label: '10 min', minutes: 10 },
  { label: '5 min', minutes: 5 },
  { label: '1 min', minutes: 1 },
] as const;

export function TimerWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 0) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    if (totalSeconds > 0) {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTotalSeconds(initialSeconds);
  };

  const handlePreset = (minutes: number) => {
    setIsRunning(false);
    const secs = minutes * 60;
    setTotalSeconds(secs);
    setInitialSeconds(secs);
  };

  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const progress = initialSeconds > 0 ? (totalSeconds / initialSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  const progressColor = useMemo(() => {
    if (totalSeconds === 0) return '#ef4444';
    if (progress < 20) return '#f59e0b';
    return 'url(#timerGradient)';
  }, [totalSeconds, progress]);

  return (
    <Card variant="gradient" padding="md" className="animate-fade-in">
      <h2 className="text-h2 text-surface-100 mb-3">Timer</h2>

      <div className="relative w-[200px] h-[200px] mx-auto mb-3">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            className="text-surface-700/50"
            strokeWidth="6"
          />
          {/* Progress arc */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={progressColor}
            strokeWidth="6"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
            transform="rotate(-90 100 100)"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[3.2rem] font-bold text-surface-100 font-mono leading-none tracking-tight">
            {minutes}:{seconds}
          </div>
          <div className="text-caption text-surface-400 mt-1">
            {totalSeconds === 0
              ? 'Time\'s up!'
              : isRunning
                ? 'Running'
                : 'Paused'}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 justify-center mb-2">
        {isRunning ? (
          <Button variant="outline" size="lg" onClick={handlePause}>
            Pause
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={handleStart} disabled={totalSeconds === 0}>
            Start
          </Button>
        )}
        <Button variant="secondary" size="lg" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1 justify-center flex-wrap">
        {PRESETS.map((preset) => (
          <Button
            key={preset.minutes}
            variant="ghost"
            size="sm"
            onClick={() => handlePreset(preset.minutes)}
            className={
              initialSeconds === preset.minutes * 60 && !isRunning
                ? 'bg-primary-500/20 text-primary-300'
                : ''
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
