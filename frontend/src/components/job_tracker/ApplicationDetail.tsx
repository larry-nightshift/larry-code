import React, { useState, useEffect } from 'react';
import { jobTrackerService, Application, Activity, Reminder, InterviewPrepNote } from '@/lib/jobTrackerService';

interface Props {
  applicationId: string;
  onBack?: () => void;
}

type TabType = 'overview' | 'timeline' | 'contacts' | 'prep' | 'reminders';

export const ApplicationDetail: React.FC<Props> = ({ applicationId, onBack }) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [prepNotes, setPrepNotes] = useState<InterviewPrepNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [newActivity, setNewActivity] = useState({ title: '', description: '', activity_type: 'NOTE' });
  const [newReminder, setNewReminder] = useState({ title: '', reminder_date: '', notes: '' });

  useEffect(() => {
    loadApplicationData();
  }, [applicationId]);

  useEffect(() => {
    if (activeTab === 'timeline') {
      loadActivities();
    } else if (activeTab === 'reminders') {
      loadReminders();
    } else if (activeTab === 'prep') {
      loadPrepNotes();
    }
  }, [activeTab]);

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      const data = await jobTrackerService.getApplication(applicationId);
      setApplication(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await jobTrackerService.getActivities(applicationId);
      setActivities(data.results);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const loadReminders = async () => {
    try {
      const data = await jobTrackerService.getReminders({
        application_id: applicationId,
      });
      setReminders(data.results);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  };

  const loadPrepNotes = async () => {
    try {
      const data = await jobTrackerService.getPrepNotes(applicationId);
      setPrepNotes(data.results);
    } catch (err) {
      console.error('Failed to load prep notes:', err);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.title) return;
    try {
      const activity = await jobTrackerService.createActivity(applicationId, {
        ...newActivity,
        activity_date: new Date().toISOString(),
      });
      setActivities([activity, ...activities]);
      setNewActivity({ title: '', description: '', activity_type: 'NOTE' });
    } catch (err) {
      console.error('Failed to add activity:', err);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.reminder_date) return;
    try {
      const reminder = await jobTrackerService.createReminder(applicationId, newReminder);
      setReminders([...reminders, reminder]);
      setNewReminder({ title: '', reminder_date: '', notes: '' });
    } catch (err) {
      console.error('Failed to add reminder:', err);
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      const updated = await jobTrackerService.completeReminder(applicationId, reminderId);
      setReminders((rems) => rems.map((r) => (r.id === reminderId ? updated : r)));
    } catch (err) {
      console.error('Failed to complete reminder:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Loading application...</div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-semibold">Error loading application</div>
        <div className="text-red-600 text-sm mt-1">{error || 'Unknown error'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {onBack && (
          <button onClick={onBack} className="text-blue-600 text-sm mb-3 hover:underline">
            ← Back
          </button>
        )}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{application.role_title}</h1>
            <div className="text-lg text-gray-600 mt-1">{application.company.name}</div>
            {application.job_url && (
              <a
                href={application.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm mt-2 hover:underline"
              >
                View Job Posting →
              </a>
            )}
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold">
              {application.status_display}
            </span>
            <div className="mt-2 text-sm text-gray-600">
              Priority: {'⭐'.repeat(application.priority)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 bg-white rounded-lg">
        {(['overview', 'timeline', 'contacts', 'prep', 'reminders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {application.salary_min || application.salary_max ? (
              <div>
                <div className="text-sm font-medium text-gray-700">Salary Range</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  {application.salary_currency}{' '}
                  {application.salary_min ? `${application.salary_min.toLocaleString()}` : '?'} -{' '}
                  {application.salary_max ? `${application.salary_max.toLocaleString()}` : '?'}
                </div>
              </div>
            ) : null}
            {application.location_type_display && (
              <div>
                <div className="text-sm font-medium text-gray-700">Location Type</div>
                <div className="text-gray-900 mt-1">{application.location_type_display}</div>
              </div>
            )}
            {application.source && (
              <div>
                <div className="text-sm font-medium text-gray-700">Source</div>
                <div className="text-gray-900 mt-1">{application.source}</div>
              </div>
            )}
            {application.applied_date && (
              <div>
                <div className="text-sm font-medium text-gray-700">Applied Date</div>
                <div className="text-gray-900 mt-1">
                  {new Date(application.applied_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {application.notes && (
              <div>
                <div className="text-sm font-medium text-gray-700">Notes</div>
                <div className="text-gray-900 mt-1 whitespace-pre-wrap">{application.notes}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Add Activity Form */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3">Add Activity</h3>
              <div className="space-y-3">
                <select
                  value={newActivity.activity_type}
                  onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="NOTE">Note</option>
                  <option value="APPLIED">Applied</option>
                  <option value="EMAIL_SENT">Email Sent</option>
                  <option value="EMAIL_RECEIVED">Email Received</option>
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="OFFER">Offer</option>
                </select>
                <input
                  type="text"
                  placeholder="Title"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                />
                <button
                  onClick={handleAddActivity}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Add Activity
                </button>
              </div>
            </div>

            {/* Activities List */}
            {activities.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No activities yet</div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{activity.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{activity.activity_type}</div>
                      </div>
                      {activity.is_system && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">System</span>
                      )}
                    </div>
                    {activity.description && (
                      <div className="text-gray-700 mt-2 text-sm">{activity.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(activity.activity_date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-4">
            {!application.contacts || application.contacts.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No contacts linked</div>
            ) : (
              <div className="space-y-3">
                {application.contacts.map((ac) => (
                  <div key={ac.contact.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-900">{ac.contact.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{ac.contact.role_at_company}</div>
                    {ac.contact.email && (
                      <a
                        href={`mailto:${ac.contact.email}`}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        {ac.contact.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'prep' && (
          <div className="space-y-4">
            {prepNotes.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No prep notes yet</div>
            ) : (
              <div className="space-y-3">
                {prepNotes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{note.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{note.category}</div>
                      </div>
                    </div>
                    <div className="text-gray-700 mt-2 text-sm whitespace-pre-wrap">{note.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-4">
            {/* Add Reminder Form */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3">Add Reminder</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={newReminder.reminder_date}
                  onChange={(e) => setNewReminder({ ...newReminder, reminder_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <textarea
                  placeholder="Notes (optional)"
                  value={newReminder.notes}
                  onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
                <button
                  onClick={handleAddReminder}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Add Reminder
                </button>
              </div>
            </div>

            {/* Reminders List */}
            {reminders.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No reminders set</div>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`border rounded-lg p-4 ${
                      reminder.is_completed ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`font-semibold ${reminder.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {reminder.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{reminder.reminder_date}</div>
                        {reminder.is_overdue && !reminder.is_completed && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded mt-2 inline-block">
                            Overdue
                          </span>
                        )}
                      </div>
                      {!reminder.is_completed && (
                        <button
                          onClick={() => handleCompleteReminder(reminder.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                    {reminder.notes && (
                      <div className="text-gray-700 mt-2 text-sm">{reminder.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;
