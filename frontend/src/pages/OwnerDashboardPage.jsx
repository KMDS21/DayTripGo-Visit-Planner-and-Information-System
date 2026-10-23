// OwnerDashboardPage — /owner/dashboard (protected)
// The owner's home: how many listings they have, how many are still waiting
// for approval, plus shortcuts to add a listing and edit their profile.

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyBusinesses } from '../services/businessService';
import { useAuth } from '../hooks/useAuth';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import StatCard from '../components/Admin/StatCard';
import StatusBadge from '../components/BusinessListing/StatusBadge';

export default function OwnerDashboardPage() {
  usePageTitle();
  const { owner, ownerLogout } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBusinesses(await getMyBusinesses());
    } catch (err) {
      setError(err);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await ownerLogout();
    navigate('/business/login');
  };

  const pending = businesses.filter((b) => !b.published).length;
  const live = businesses.filter((b) => b.published).length;
  // Newest first for the "recent" list.
  const recent = [...businesses]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Business panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as{' '}
            <span className="font-semibold text-foreground">{owner?.full_name || owner?.username}</span>.
            Manage your listings here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate('/owner/businesses/new')}>
            Add business
          </Button>
          <Button variant="danger-soft" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="My businesses"
          value={loading ? undefined : businesses.length}
          hint="Total listings"
          to="/owner/businesses"
        />
        <StatCard
          label="Waiting for approval"
          value={loading ? undefined : pending}
          hint="Not visible to visitors yet"
          to="/owner/businesses"
        />
        <StatCard
          label="Live on Explore"
          value={loading ? undefined : live}
          hint="Approved & published"
          to="/owner/businesses"
        />
        <StatCard label="Profile" value="✎" hint="Edit your details" to="/owner/profile" />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          Could not load your businesses — please refresh.
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Recently updated</h2>
          <Link
            to="/owner/businesses"
            className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        {!loading && recent.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
            You have not added a business yet.{' '}
            <Link to="/owner/businesses/new" className="font-semibold text-brand hover:underline">
              Add your first listing
            </Link>{' '}
            — it goes live once our team approves it.
          </div>
        )}

        {recent.length > 0 && (
          <ul className="divide-y divide-border">
            {recent.map((b) => (
              <li key={b.business_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {b.address || b.opening_hours || 'No location details yet'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge published={b.published} />
                  <Link
                    to={`/owner/businesses/${b.business_id}/edit`}
                    className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!loading && businesses.length > 0 && pending > 0 && (
        <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
          {pending} listing{pending === 1 ? ' is' : 's are'} awaiting approval. You can keep editing
          them — they appear on Explore once an admin publishes them.
        </p>
      )}
    </div>
  );
}
