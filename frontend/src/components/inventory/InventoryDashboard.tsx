import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Alert, Spinner, Badge, Button } from '../ui';
import { getDashboard, DashboardData } from '../../lib/inventoryService';
import { useNavigate } from 'react-router-dom';

export function InventoryDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiringIn, setExpiringIn] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, [expiringIn]);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboard(expiringIn);
      setDashboard(data);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <Alert variant="danger" dismissible onDismiss={() => setError(null)}>{error}</Alert>;
  }

  return (
    <div className="space-y-3">
      {/* Expiring Warranties */}
      <Card variant="gradient" padding="md">
        <CardHeader title="Warranties Expiring Soon" action={
          <div className="flex gap-1 text-caption">
            <button onClick={() => setExpiringIn(7)} className={`px-2 py-1 rounded ${expiringIn === 7 ? 'bg-primary-500' : 'bg-surface-700'}`}>7d</button>
            <button onClick={() => setExpiringIn(30)} className={`px-2 py-1 rounded ${expiringIn === 30 ? 'bg-primary-500' : 'bg-surface-700'}`}>30d</button>
            <button onClick={() => setExpiringIn(90)} className={`px-2 py-1 rounded ${expiringIn === 90 ? 'bg-primary-500' : 'bg-surface-700'}`}>90d</button>
          </div>
        } />
        {dashboard?.expiring_warranties.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">No warranties expiring soon. All good!</p>
        ) : (
          <div className="space-y-2">
            {dashboard?.expiring_warranties.map((warranty) => (
              <div key={warranty.id} className="flex justify-between items-center p-2 bg-surface-700 rounded border border-surface-600">
                <div>
                  <p className="text-body font-medium">{warranty.item}</p>
                  <p className="text-caption text-surface-400">{warranty.warranty_type} • {warranty.days_remaining} days</p>
                </div>
                <Badge variant="warning" size="sm">{new Date(warranty.end_date).toLocaleDateString()}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recently Added Items */}
      <Card variant="gradient" padding="md">
        <CardHeader title="Recently Added Items" action={<Button variant="ghost" size="sm" onClick={() => navigate('/inventory/items')}>View All</Button>} />
        {dashboard?.recent_items.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">No items yet. Start tracking!</p>
        ) : (
          <div className="space-y-2">
            {dashboard?.recent_items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-2 bg-surface-700 rounded border border-surface-600 cursor-pointer hover:bg-surface-600" onClick={() => navigate(`/inventory/items/${item.id}`)}>
                <div>
                  <p className="text-body font-medium">{item.name}</p>
                  <p className="text-caption text-surface-400">{item.category} {item.location_name && `• ${item.location_name}`}</p>
                </div>
                {item.active_warranty_count > 0 && (
                  <Badge variant="success" size="sm">{item.active_warranty_count} active</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Service Events */}
      <Card variant="gradient" padding="md">
        <CardHeader title="Recent Service History" />
        {dashboard?.recent_service_events.length === 0 ? (
          <p className="text-center text-surface-500 text-caption py-4">No service events recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {dashboard?.recent_service_events.slice(0, 5).map((event) => (
              <div key={event.id} className="p-2 bg-surface-700 rounded border border-surface-600">
                <p className="text-body font-medium">{event.notes}</p>
                <p className="text-caption text-surface-400">{event.event_type} • {new Date(event.occurred_at).toLocaleDateString()} {event.vendor && `• ${event.vendor}`}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
