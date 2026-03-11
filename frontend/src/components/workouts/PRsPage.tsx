import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Alert } from '../ui';
import workoutsService, { PersonalRecord } from '../../lib/workoutsService';

export default function PRsPage() {
  const navigate = useNavigate();
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPRs();
  }, []);

  const loadPRs = async () => {
    try {
      setLoading(true);
      const data = await workoutsService.listPRs();
      setPRs(data.results);
    } catch (err) {
      setError('Failed to load personal records');
    } finally {
      setLoading(false);
    }
  };

  // Group by exercise
  const prsByExercise = prs.reduce((acc, pr) => {
    if (!acc[pr.exercise]) {
      acc[pr.exercise] = { name: pr.exercise_name, prs: [] };
    }
    acc[pr.exercise].prs.push(pr);
    return acc;
  }, {} as Record<string, { name: string; prs: PersonalRecord[] }>);

  const formatValue = (pr: PersonalRecord) => {
    if (pr.record_type === 'MAX_DURATION') {
      const mins = Math.floor(parseFloat(pr.value_decimal) / 60);
      const secs = Math.floor(parseFloat(pr.value_decimal) % 60);
      return `${mins}m ${secs}s`;
    }
    return `${parseFloat(pr.value_decimal).toFixed(pr.record_type === 'MAX_REPS' ? 0 : 1)}`;
  };

  const getRecordLabel = (recordType: string) => {
    const labels: Record<string, string> = {
      MAX_WEIGHT: 'Max Weight',
      MAX_REPS: 'Max Reps',
      MAX_DURATION: 'Max Duration',
      BEST_EST_1RM: 'Est. 1RM',
    };
    return labels[recordType] || recordType;
  };

  return (
    <div className="space-y-3">
      <Card variant="gradient" padding="md">
        <h2 className="text-h2 mb-2">Personal Records</h2>
        <p className="text-caption text-surface-300">
          Your best lifts and achievements
        </p>
      </Card>

      {error && <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <div className="text-center py-8">
          <Spinner />
        </div>
      ) : Object.keys(prsByExercise).length === 0 ? (
        <Card>
          <p className="text-center text-surface-500 text-caption py-4">
            No personal records yet. Log a workout to establish PRs!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(prsByExercise).map(([exerciseId, data]) => (
            <Card key={exerciseId} variant="outlined">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-surface-100">{data.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/workouts/progress/${exerciseId}`)}
                >
                  View Chart
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data.prs.map((pr) => (
                  <div key={pr.id} className="bg-surface-900 p-2 rounded border border-surface-700">
                    <p className="text-caption text-surface-500">{getRecordLabel(pr.record_type)}</p>
                    <p className="text-body font-semibold text-surface-100 mt-1">
                      {formatValue(pr)}
                      {pr.record_type === 'MAX_WEIGHT' && ' lbs'}
                    </p>
                    <p className="text-caption text-surface-500 mt-1">
                      {new Date(pr.achieved_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
