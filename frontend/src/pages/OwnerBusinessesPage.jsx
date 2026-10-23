// OwnerBusinessesPage — /owner/businesses (protected)
// Every listing the signed-in owner has created, with its approval status,
// an edit shortcut and a delete confirmation. Their own rows only — the API
// scopes the query to the owner.

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteBusiness, getMyBusinesses } from '../services/businessService';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';
import Modal from '../components/Common/Modal';
import StatusBadge from '../components/BusinessListing/StatusBadge';
import { placeImage } from '../utils/placeImage';

export default function OwnerBusinessesPage() {
  usePageTitle();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [flash, setFlash] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBusinesses(await getMyBusinesses());
    } catch (err) {
      setError(errorMessage(err));
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    const target = businesses.find((b) => b.business_id === deleteId);
    if (!target) return;
    setBusyId(target.business_id);
    try {
      await deleteBusiness(target.business_id);
      setBusinesses((prev) => prev.filter((b) => b.business_id !== target.business_id));
      setDeleteId(null);
      setFlash(`“${target.name}” was deleted.`);
      setTimeout(() => setFlash(null), 3000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const pending = businesses.filter((b) => !b.published).length;

  return (
    <div className="space-y-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">My businesses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? 'Loading your listings…'
              : `${businesses.length} listing${businesses.length === 1 ? '' : 's'}` +
                (pending > 0 ? ` · ${pending} waiting for approval.` : '.')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={() => navigate('/owner/businesses/new')}>Add business</Button>
        </div>
      </header>

      {loading && <Loader label="Loading your businesses…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}

      {!loading && !error && businesses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border px-4 py-14 text-center text-muted-foreground">
          Nothing here yet.{' '}
          <Link
            to="/owner/businesses/new"
            className="font-semibold text-brand underline-offset-4 hover:underline"
          >
            Add your first business
          </Link>{' '}
          to get it in front of visitors.
        </div>
      )}

      {!loading && !error && businesses.length > 0 && (
        <ul className="space-y-3">
          {businesses.map((business) => (
            <li
              key={business.business_id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-28">
                <img
                  src={placeImage(business)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-semibold">{business.name}</h2>
                  <StatusBadge published={business.published} />
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {business.short_description || business.description}
                </p>
                {business.address && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{business.address}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/owner/businesses/${business.business_id}/edit`)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger-soft"
                  onClick={() => setDeleteId(business.business_id)}
                  disabled={busyId === business.business_id}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(deleteId)} title="Delete this business?" onClose={() => setDeleteId(null)}>
        <p className="text-sm text-muted-foreground">
          This permanently removes the listing from your panel and from Explore. It cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={busyId === deleteId}>
            {busyId === deleteId ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>

      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2">
        {flash && (
          <p className="rounded-full bg-foreground px-5 py-2.5 text-center text-sm font-semibold text-background shadow-lg">
            {flash}
          </p>
        )}
      </div>
    </div>
  );
}
