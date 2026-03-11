import { useState, useEffect } from 'react';
import { Card, CardHeader, Alert, Spinner, Badge } from '../ui';
import type { InsightsData } from '../../lib/habitsService';
import { getInsights } from '../../lib/habitsService';

export function InsightsPage() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsights(30);
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card padding="md">
        <p className="text-center text-surface-500 text-caption py-4">
          No data available yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card padding="md" variant="gradient">
        <CardHeader title="Insights" />
        <p className="text-small text-surface-400 mt-2">
          Last {insights.window_days} days · {insights.total_habits} active habits
        </p>
      </Card>

      {insights.most_consistent.length > 0 && (
        <Card padding="md">
          <CardHeader title="🏆 Most Consistent" />
          <div className="space-y-2 mt-2">
            {insights.most_consistent.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-2 rounded bg-surface-800"
              >
                <div className="min-w-0">
                  <p className="text-body font-semibold text-surface-100">{habit.name}</p>
                  <p className="text-small text-surface-500">
                    {habit.completed}/{habit.total} days
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="success" size="sm">
                    {habit.completion_rate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {insights.at_risk.length > 0 && (
        <Card padding="md">
          <CardHeader title="⚠️ At Risk" />
          <div className="space-y-2 mt-2">
            {insights.at_risk.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-2 rounded bg-surface-800"
              >
                <div className="min-w-0">
                  <p className="text-body font-semibold text-surface-100">{habit.name}</p>
                  <p className="text-small text-surface-500">
                    {habit.completed}/{habit.total} days
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="warning" size="sm">
                    {habit.completion_rate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {insights.most_consistent.length === 0 && insights.at_risk.length === 0 && (
        <Card padding="md">
          <p className="text-center text-surface-500 text-caption py-4">
            No habits yet. Create some habits to see insights!
          </p>
        </Card>
      )}
    </div>
  );
}
