import { useState, useEffect, useRef } from 'react';

export function TimerWidget() {
  const [minutes, setMinutes] = useState('25');
  const [seconds, setSeconds] = useState('00');
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
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

  useEffect(() => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setMinutes(String(mins).padStart(2, '0'));
    setSeconds(String(secs).padStart(2, '0'));
  }, [totalSeconds]);

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
    setTotalSeconds(25 * 60);
  };

  const handleSetPomodoro = () => {
    setIsRunning(false);
    setTotalSeconds(25 * 60);
  };

  const handleSetBreak = () => {
    setIsRunning(false);
    setTotalSeconds(5 * 60);
  };

  const handleSetCustom = (mins: number) => {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
  };

  const progress = totalSeconds > 0 ? (totalSeconds / (25 * 60)) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Timer</h2>

      <div className="relative w-48 h-48 mx-auto mb-6">
        {/* Progress circle */}
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeDasharray={`${(progress / 100) * 565.48} 565.48`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.1s linear' }}
            transform="rotate(-90 100 100)"
          />
        </svg>

        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-gray-900">
            {minutes}:{seconds}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {isRunning ? 'Running...' : 'Paused'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 justify-center">
          {isRunning ? (
            <button
              onClick={handlePause}
              className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Start
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Reset
          </button>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={handleSetPomodoro}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            25 min
          </button>
          <button
            onClick={handleSetBreak}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            5 min break
          </button>
          <button
            onClick={() => handleSetCustom(10)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            10 min
          </button>
          <button
            onClick={() => handleSetCustom(1)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            1 min
          </button>
        </div>
      </div>
    </div>
  );
}
