import React, { useState, useEffect } from 'react';
import { jobTrackerService, Company } from '@/lib/jobTrackerService';

interface Props {
  onSelectCompany?: (companyId: string) => void;
}

export const CompaniesList: React.FC<Props> = ({ onSelectCompany }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', website: '', industry: '', location: '', notes: '' });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await jobTrackerService.getCompanies();
      setCompanies(data.results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!formData.name) return;
    try {
      const newCompany = await jobTrackerService.createCompany(formData);
      setCompanies([...companies, newCompany]);
      setFormData({ name: '', website: '', industry: '', location: '', notes: '' });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create company:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Loading companies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-semibold">Error loading companies</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Form */}
      {showCreateForm ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Company</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Company Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="url"
              placeholder="Website (optional)"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Industry (optional)"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateCompany}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Company
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Company
        </button>
      )}

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-500">No companies yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              onClick={() => onSelectCompany?.(company.id)}
              className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
              {company.industry && (
                <div className="text-sm text-gray-600 mt-1">{company.industry}</div>
              )}
              {company.location && (
                <div className="text-sm text-gray-600">{company.location}</div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  {company.application_count} application{company.application_count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompaniesList;
