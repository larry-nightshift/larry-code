import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Select, Spinner, Alert } from '../ui';
import workoutsService, { ProgressPoint } from '../../lib/workoutsService';

export default function ExerciseProgressPage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState('EST_1RM');
  const [exerciseName, setExerciseName] = useState('');

  useEffect(() => {
    loadProgress();
  }, [exerciseId, metric]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      if (!exerciseId) return;
      const data = await workoutsService.getProgress(exerciseId, metric);
      setProgress(data);

      // Try to get exercise name
      const exercises = await workoutsService.listExercises();
      const exercise = exercises.results.find((e) => e.id === exerciseId);
      if (exercise) {
        setExerciseName(exercise.name);
      }
    } catch (err) {
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  // Simple SVG chart
  if (progress.length === 0) {
    return (
      <div className="space-y-3">
        <Card variant="gradient" padding="md">
          <h2 className="text-h2">{exerciseName} - Progress</h2>
        </Card>
        <Card>
          <p className="text-center text-surface-500 text-caption py-4">
            No data yet. Log more workouts to see progress!
          </p>
        </Card>
        <Button variant="ghost" fullWidth onClick={() => navigate('/workouts/prs')}>
          Back to PRs
        </Button>
      </div>
    );
  }

  // Calculate chart dimensions
  const minValue = Math.min(...progress.map((p) => p.value));
  const maxValue = Math.max(...progress.map((p) => p.value));
  const range = maxValue - minValue || 1;
  const padding = 40;
  const width = 500;
  const height = 300;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = progress.map((p, i) => {
    const x = padding + (i / (progress.length - 1 || 1)) * chartWidth;
    const y = height - padding - ((p.value - minValue) / range) * chartHeight;
    return { x, y, ...p };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const metricLabel = metric === 'EST_1RM' ? 'Est. 1RM' : metric.replace(/_/g, ' ');

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <h2 className="text-h2">{exerciseName} - Progress</h2>
      </Card>

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

      <Card>
        <Select
          label="Metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          options={[
            { value: 'EST_1RM', label: 'Estimated 1RM' },
            { value: 'MAX_WEIGHT', label: 'Max Weight' },
            { value: 'MAX_REPS', label: 'Max Reps' },
            { value: 'MAX_DURATION', label: 'Max Duration' },
          ]}
        />
      </Card>

      <Card>
        <div className="flex justify-center">
          <svg width={width} height={height} className="border border-surface-700 rounded bg-surface-900">
            {/* Y-axis */}
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={height - padding}
              stroke="currentColor"
              className="text-surface-600"
              strokeWidth={1}
            />
            {/* X-axis */}
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="currentColor"
              className="text-surface-600"
              strokeWidth={1}
            />
            {/* Y-axis ticks and labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const y = height - padding - tick * chartHeight;
              const value = minValue + tick * range;
              return (
                <g key={`tick-${tick}`}>
                  <line
                    x1={padding - 5}
                    y1={y}
                    x2={padding}
                    y2={y}
                    stroke="currentColor"
                    className="text-surface-600"
                    strokeWidth={1}
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-caption text-surface-500"
                    fontSize="12"
                  >
                    {value.toFixed(0)}
                  </text>
                </g>
              );
            })}
            {/* Chart line */}
            <path d={pathData} fill="none" stroke="rgb(59, 130, 246)" strokeWidth={2} />
            {/* Data points */}
            {points.map((p, i) => (
              <circle key={`point-${i}`} cx={p.x} cy={p.y} r={4} fill="rgb(59, 130, 246)" />
            ))}
          </svg>
        </div>
      </Card>

      <Card>
        <div className="space-y-1">
          <div className="flex justify-between text-caption">
            <span className="text-surface-500">Current</span>
            <span className="font-medium text-surface-100">
              {progress[progress.length - 1].value.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between text-caption">
            <span className="text-surface-500">Peak</span>
            <span className="font-medium text-surface-100">
              {Math.max(...progress.map((p) => p.value)).toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between text-caption">
            <span className="text-surface-500">Data Points</span>
            <span className="font-medium text-surface-100">{progress.length}</span>
          </div>
        </div>
      </Card>

      <Button variant="ghost" fullWidth onClick={() => navigate('/workouts/prs')}>
        Back to PRs
      </Button>
    </div>
  );
}
