import React, { useState, useEffect } from 'react';
import { jobTrackerService, Application } from '@/lib/jobTrackerService';

interface Props {
  onSelectApplication?: (appId: string) => void;
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

export const ApplicationsList: React.FC<Props> = ({ onSelectApplication }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    q?: string;
    status?: string[];
    priority?: number;
    location_type?: string;
  }>({});

  useEffect(() => {
    loadApplications();
  }, [filters]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await jobTrackerService.getApplications({
        ...filters,
        ordering: '-updated_at',
      });
      setApplications(data.results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
      console.error('Applications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const updated = await jobTrackerService.updateApplication(appId, { status: newStatus });
      setApplications((apps) =>
        apps.map((app) => (app.id === appId ? updated : app))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Loading applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-semibold">Error loading applications</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search roles, companies, notes..."
          value={filters.q || ''}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <select
          value={filters.priority || ''}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value ? parseInt(e.target.value) : undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Priorities</option>
          <option value="1">Priority 1</option>
          <option value="2">Priority 2</option>
          <option value="3">Priority 3</option>
          <option value="4">Priority 4</option>
          <option value="5">Priority 5</option>
        </select>
        <select
          value={filters.location_type || ''}
          onChange={(e) => setFilters({ ...filters, location_type: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Locations</option>
          <option value="ONSITE">On-site</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>

      {/* Applications Table */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-500">No applications found</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => onSelectApplication?.(app.id)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{app.company.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{app.role_title}</td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(app.id, e.target.value);
                      }}
                      className={`text-xs font-semibold px-2 py-1 rounded ${statusColors[app.status]} cursor-pointer`}
                    >
                      <option value="WISHLIST">Wishlist</option>
                      <option value="APPLIED">Applied</option>
                      <option value="PHONE_SCREEN">Phone Screen</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="OFFER">Offer</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                      <option value="GHOSTED">Ghosted</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="inline-flex items-center">
                      {'⭐'.repeat(app.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {app.location_type_display || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;
