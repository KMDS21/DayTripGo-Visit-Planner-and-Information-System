// AdminDashboardPage — /admin/dashboard (protected):
// counters only — places, categories, plans created (traffic), unread contact
// messages — plus the server storage status bar for the 500 MB image quota.
// Place CRUD lives on its own page: /admin/places.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../services/adminStats';
import { useAuth } from '../hooks/useAuth';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import StatCard from '../components/Admin/StatCard';
import StorageBar from '../components/Admin/StorageBar';

export default function AdminDashboardPage() {
  usePageTitle();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await getStats());
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{admin?.username}</span>. A quick overview
            of the site and the server.
          </p>
        </div>
        <Button variant="danger-soft" onClick={handleLogout}>
          Log out
        </Button>
      </header>

      {/* Counters + server storage status bar (500 MB quota) */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Attractive Places"
            value={stats?.places}
            hint={loading ? 'Loading…' : 'Open the places page'}
            to="/admin/places"
          />
          <StatCard label="Categories" value={stats?.categories} hint="Place groups" />
          <StatCard label="Plans created" value={stats?.plans} hint="Visitor traffic" />
          <StatCard
            label="Contact messages"
            value={stats?.messages_unread}
            hint="Unread responses"
            to="/admin/messages"
          />
        </div>

        <StorageBar storage={stats?.storage} />

        {stats?.warnings?.length > 0 && (
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
            {stats.warnings[0]}
          </p>
        )}

        {!loading && !stats && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Could not load the dashboard counters — is the API running?
          </p>
        )}
      </div>
    </div>
  );
}
