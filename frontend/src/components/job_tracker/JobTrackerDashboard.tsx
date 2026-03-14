import React, { useState, useEffect } from 'react';
import { jobTrackerService, DashboardData, Application, Reminder } from '@/lib/jobTrackerService';

interface Props {
  onNavigate?: (path: string) => void;
}

const statusColors: Record<string, string> = {
  WISHLIST: 'bg-gray-100 text-gray-800',
  APPLIED: 'bg-blue-100 text-blue-800',
  PHONE_SCREEN: 'bg-cyan-100 text-cyan-800',
  INTERVIEW: 'bg-yellow-100 text-yellow-800',
  OFFER: 'bg-green-100 text-green-800',
  ACCEPTED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-orange-100 text-orange-800',
  GHOSTED: 'bg-purple-100 text-purple-800',
};

const statusOrder = [
  'WISHLIST',
  'APPLIED',
  'PHONE_SCREEN',
  'INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'GHOSTED',
];

export const JobTrackerDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await jobTrackerService.getDashboard();
      setDashboard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-semibold">Error loading dashboard</div>
        <div className="text-red-600 text-sm mt-1">{error || 'Unknown error'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-gray-500 text-sm font-medium">Total Applications</div>
          <div className="text-2xl font-bold mt-1">{dashboard.stats.total_applications}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-gray-500 text-sm font-medium">Active</div>
          <div className="text-2xl font-bold mt-1">{dashboard.stats.active_count}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-gray-500 text-sm font-medium">Response Rate</div>
          <div className="text-2xl font-bold mt-1">{dashboard.stats.response_rate.toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-gray-500 text-sm font-medium">Avg Days in Pipeline</div>
          <div className="text-2xl font-bold mt-1">{Math.round(dashboard.stats.avg_days_in_pipeline)}</div>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Pipeline Overview</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {statusOrder.map((status) => (
            <div
              key={status}
              className="text-center p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
              onClick={() => onNavigate?.(`/applications?status=${status}`)}
            >
              <div className="text-xs text-gray-600 font-medium mb-1">
                {status.replace(/_/g, ' ')}
              </div>
              <div className={`text-lg font-bold rounded px-2 py-1 ${statusColors[status]}`}>
                {dashboard.pipeline_counts[status] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Reminders */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Reminders (Next 7 Days)</h2>
        {dashboard.upcoming_reminders.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No upcoming reminders</div>
        ) : (
          <div className="space-y-2">
            {dashboard.upcoming_reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{reminder.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{reminder.reminder_date}</div>
                </div>
                <div className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                  {reminder.days_until_due === 0 ? 'Today' : `in ${reminder.days_until_due} days`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {dashboard.recent_activities.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No recent activities</div>
        ) : (
          <div className="space-y-3">
            {dashboard.recent_activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 text-sm">
                <div className="text-gray-400 text-xs mt-1">
                  {new Date(activity.activity_date).toLocaleDateString()}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{activity.title}</div>
                  {activity.description && (
                    <div className="text-gray-600 text-xs mt-1">{activity.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onNavigate?.('/applications/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + New Application
        </button>
        <button
          onClick={() => onNavigate?.('/applications')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          View All Applications
        </button>
        <button
          onClick={() => onNavigate?.('/companies')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Companies
        </button>
      </div>
    </div>
  );
};

export default JobTrackerDashboard;
