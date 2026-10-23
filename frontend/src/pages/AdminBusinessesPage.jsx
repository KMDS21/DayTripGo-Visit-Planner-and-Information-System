// AdminBusinessesPage — /admin/businesses
// Owner-submitted listings in one place: approve / unpublish each row, delete
// it, choose where it shows on the home page ("Show on home" card in the
// All places grid, "Featured" in the Featured escapes carousel), and manage
// the tag list owners pick from. Approval is the publish switch — unpublished
// listings never reach the public Explore tab, so they cannot appear on home.

import { useCallback, useEffect, useState } from 'react';
import {
  createBusinessTag,
  deleteBusinessTag,
  deleteBusinessAsAdmin,
  getBusinessesForAdmin,
  getBusinessTags,
  setBusinessPublished,
  updateBusinessTag,
} from '../services/businessService';
import { getPageContent, savePageContent } from '../services/contentService';
import { errorMessage } from '../services/api';
import {
  BUSINESS_FEATURED_KEYS,
  parseFeaturedRows,
  parseIdCsv,
  serializeFeaturedRows,
  serializeIdCsv,
} from '../utils/featuredConfig';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import Loader from '../components/Common/Loader';
import Modal from '../components/Common/Modal';
import { placeImage } from '../utils/placeImage';

// Same ceiling the places panel enforces for the Featured escapes carousel.
const FEATURED_LIMIT = 12;
// The home page's listing section shows at most 5 businesses — the admin
// picks the strongest five (places keep their own existing behaviour).
const HOME_LIMIT = 5;

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminBusinessesPage() {
  usePageTitle();

  const [businesses, setBusinesses] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [flash, setFlash] = useState(null);

  // The home page's content sections — where the "Show on home" card ids and
  // the Featured escapes selection live (same storage the places panel uses).
  const [homeSections, setHomeSections] = useState({});

  const refreshContent = useCallback(async () => {
    try {
      setHomeSections(await getPageContent('home'));
    } catch {
      setHomeSections({}); // sections unavailable → the pills read as unselected
    }
  }, []);

  const [newTag, setNewTag] = useState('');
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [tagBusy, setTagBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, tagRows] = await Promise.all([getBusinessesForAdmin(), getBusinessTags()]);
      setBusinesses(rows);
      setTags(tagRows);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
    refreshContent();
  }, [refreshContent]);

  useEffect(() => {
    load();
  }, [load]);

  const showFlash = (message) => {
    setFlash(message);
    setTimeout(() => setFlash(null), 3000);
  };

  // ── Home page placement ──────────────────────────────────────────────────
  // Both selections live in the home page's content sections, exactly like the
  // places panel: `home_business_ids` (cards in the All places grid) and
  // `featured_business_ids` / `featured_business_covers` (Featured escapes).
  const homeBusinessIds = parseIdCsv(homeSections.home_business_ids);
  const featuredRows = parseFeaturedRows(
    homeSections.featured_business_ids,
    homeSections.featured_business_covers
  );

  // A deleted listing must not stay ticked — its cover file is gone, so the
  // stale id could only ever render a broken card. Best-effort: the home page
  // already skips ids it cannot resolve.
  const removeFromHomeSections = async (businessId) => {
    try {
      const tasks = [];
      if (homeBusinessIds.includes(businessId)) {
        tasks.push(
          savePageContent('home', {
            home_business_ids: serializeIdCsv(homeBusinessIds.filter((id) => id !== businessId)),
          })
        );
      }
      const kept = featuredRows.filter((row) => row.id !== businessId);
      if (kept.length !== featuredRows.length) {
        tasks.push(savePageContent('home', serializeFeaturedRows(kept, BUSINESS_FEATURED_KEYS)));
      }
      await Promise.all(tasks);
      if (tasks.length > 0) await refreshContent();
    } catch {
      // Best-effort cleanup; the content editors can fix it by hand.
    }
  };

  const handleToggleOnHome = async (business) => {
    const selected = homeBusinessIds.includes(business.business_id);
    if (!selected && homeBusinessIds.length >= HOME_LIMIT) {
      setError(
        `The home page already shows ${HOME_LIMIT} businesses — untick one before adding another.`
      );
      return;
    }
    const next = selected
      ? homeBusinessIds.filter((id) => id !== business.business_id)
      : [...homeBusinessIds, business.business_id];
    setBusyId(business.business_id);
    setError(null);
    try {
      await savePageContent('home', { home_business_ids: serializeIdCsv(next) });
      await refreshContent();
      showFlash(
        selected
          ? `\u201C${business.name}\u201D was removed from the home page.`
          : `\u201C${business.name}\u201D now shows on the home page.`
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFeatured = async (business) => {
    const selected = featuredRows.some((row) => row.id === business.business_id);
    if (!selected && featuredRows.length >= FEATURED_LIMIT) {
      setError(
        `Featured escapes already has ${FEATURED_LIMIT} listings — remove one before adding another.`
      );
      return;
    }
    const rows = selected
      ? featuredRows.filter((row) => row.id !== business.business_id)
      : [...featuredRows, { id: business.business_id, cover: '' }];
    setBusyId(business.business_id);
    setError(null);
    try {
      await savePageContent('home', serializeFeaturedRows(rows, BUSINESS_FEATURED_KEYS));
      await refreshContent();
      showFlash(
        selected
          ? `\u201C${business.name}\u201D was taken off the Featured escapes carousel.`
          : `\u201C${business.name}\u201D was added to the Featured escapes carousel.`
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handlePublish = async (business) => {
    setBusyId(business.business_id);
    setError(null);
    try {
      const updated = await setBusinessPublished(business.business_id, !business.published);
      setBusinesses((prev) =>
        prev.map((b) => (b.business_id === updated.business_id ? { ...b, ...updated } : b))
      );
      showFlash(
        updated.published
          ? `\u201C${updated.name}\u201D is now live on Explore.`
          : `\u201C${updated.name}\u201D was unpublished.`
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    const target = businesses.find((b) => b.business_id === deleteId);
    if (!target) return;
    setBusyId(target.business_id);
    try {
      await deleteBusinessAsAdmin(target.business_id);
      setBusinesses((prev) => prev.filter((b) => b.business_id !== target.business_id));
      setDeleteId(null);
      await removeFromHomeSections(target.business_id); // home + featured ids
      showFlash(`\u201C${target.name}\u201D was deleted.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const tagName = (id) => tags.find((t) => t.category_id === id)?.category_name;
  const pending = businesses.filter((b) => !b.published).length;

  // ── Tag list management ────────────────────────────────────────────────
  const handleAddTag = async (e) => {
    e.preventDefault();
    const value = newTag.trim();
    if (!value) return;
    setTagBusy(true);
    setError(null);
    try {
      const created = await createBusinessTag(value);
      setTags((prev) => [...prev, created]);
      setNewTag('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setTagBusy(false);
    }
  };

  const startRename = (tag) => {
    setRenameId(tag.category_id);
    setRenameValue(tag.category_name);
  };

  const handleRename = async () => {
    const value = renameValue.trim();
    if (!value) {
      setRenameId(null);
      return;
    }
    setTagBusy(true);
    setError(null);
    try {
      const updated = await updateBusinessTag(renameId, value);
      setTags((prev) => prev.map((t) => (t.category_id === updated.category_id ? updated : t)));
      setRenameId(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setTagBusy(false);
    }
  };

  const handleDeleteTag = async (tag) => {
    setTagBusy(true);
    setError(null);
    try {
      await deleteBusinessTag(tag.category_id);
      setTags((prev) => prev.filter((t) => t.category_id !== tag.category_id));
      // Rows carrying the tag lose it server-side (FK cascade).
      setBusinesses((prev) =>
        prev.map((b) => ({ ...b, tags: (b.tags || []).filter((id) => id !== tag.category_id) }))
      );
      showFlash(`Tag \u201C${tag.category_name}\u201D was removed.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setTagBusy(false);
    }
  };

  // ── Placement pills (one per row) ────────────────────────────────────────
  // Same look as the places panel's "Show on home" pill.
  const homePill = (business) => {
    const selected = homeBusinessIds.includes(business.business_id);
    const busy = busyId === business.business_id;
    const atLimit = !selected && homeBusinessIds.length >= HOME_LIMIT;
    return (
      <button
        type="button"
        onClick={() => handleToggleOnHome(business)}
        disabled={busy || loading || atLimit}
        title={
          atLimit
            ? `Only ${HOME_LIMIT} businesses can show on the home page — untick one first`
            : selected
              ? "Shown in the home page's All places & businesses section — click to remove"
              : `Add this listing to the home page (${HOME_LIMIT} max)`
        }
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          selected
            ? 'border-brand/50 bg-brand/10 text-brand hover:bg-brand/15'
            : 'border-border bg-muted text-muted-foreground hover:border-brand hover:text-brand'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-brand' : 'bg-muted-foreground/50'}`} />
        {busy ? 'Saving…' : selected ? 'On home' : 'Off home'}
      </button>
    );
  };

  // Featured escapes carousel — an unpublished listing is not in the public
  // list, so ticking it would do nothing until it is approved.
  const featuredPill = (business) => {
    const selected = featuredRows.some((row) => row.id === business.business_id);
    const busy = busyId === business.business_id;
    const disabled = busy || loading || !business.published;
    return (
      <button
        type="button"
        onClick={() => handleToggleFeatured(business)}
        disabled={disabled}
        title={
          !business.published
            ? 'Approve the listing first — pending businesses never reach the home page'
            : selected
              ? 'On the Featured escapes carousel — click to remove'
              : 'Add this listing to the Featured escapes carousel'
        }
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          selected
            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-border bg-muted text-muted-foreground hover:border-amber-400 hover:text-amber-700'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-amber-500' : 'bg-muted-foreground/50'}`} />
        {busy ? 'Saving…' : selected ? 'Featured' : 'Feature'}
      </button>
    );
  };

  return (
    <div className="space-y-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Businesses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Listings submitted by business owners.
            {pending > 0 ? ` ${pending} waiting for approval.` : ' Everything is approved.'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            &ldquo;On home&rdquo; adds a listing to the home page grid &middot; &ldquo;Feature&rdquo;
            adds it to the Featured escapes carousel.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {loading && <Loader label="Loading businesses…" />}

      {!loading && !error && businesses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border px-4 py-14 text-center text-muted-foreground">
          No businesses have been submitted yet. Owner registrations appear here for approval.
        </div>
      )}

      {!loading && businesses.length > 0 && (
        <ul className="space-y-3">
          {businesses.map((business) => (
            <li
              key={business.business_id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center"
            >
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted lg:h-16 lg:w-24">
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
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                      business.published ? 'bg-brand text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {business.published ? 'Live' : 'Pending'}
                  </span>
                </div>

                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {business.short_description || business.description}
                </p>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {business.owner_name || `Owner #${business.owner_id}`}
                  {business.owner_email ? ` · ${business.owner_email}` : ''}
                  {' · added '}
                  {formatDate(business.created_at)}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(business.tags || []).length === 0 && (
                    <span className="text-xs italic text-muted-foreground">No tags</span>
                  )}
                  {(business.tags || []).map((id) => (
                    <span
                      key={id}
                      className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-dark"
                    >
                      {tagName(id) || `#${id}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {homePill(business)}
                {featuredPill(business)}
                <Button
                  size="sm"
                  variant={business.published ? 'outline' : 'primary'}
                  onClick={() => handlePublish(business)}
                  disabled={busyId === business.business_id}
                >
                  {business.published ? 'Unpublish' : 'Approve'}
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

      {/* Tag list — what owners pick from when adding a business */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">Business tags</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Owners choose from this list when adding a restaurant, hotel or vehicle rental.
          Deleting a tag removes it from every listing that uses it.
        </p>

        <form onSubmit={handleAddTag} className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="e.g. Boat Tour"
            maxLength={50}
            aria-label="New tag name"
            className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          <Button type="submit" disabled={tagBusy || !newTag.trim()}>
            Add tag
          </Button>
        </form>

        <ul className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.category_id} className="flex items-center gap-1.5">
              {renameId === tag.category_id ? (
                <>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRename();
                      }
                    }}
                    autoFocus
                    maxLength={50}
                    aria-label={`Rename ${tag.category_name}`}
                    className="w-40 rounded-full border border-brand bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <Button size="sm" onClick={handleRename} disabled={tagBusy}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRenameId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-muted-foreground">
                    {tag.category_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => startRename(tag)}
                    className="text-xs font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag)}
                    disabled={tagBusy}
                    className="text-xs font-semibold text-red-600 underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Modal open={Boolean(deleteId)} title="Delete this business?" onClose={() => setDeleteId(null)}>
        <p className="text-sm text-muted-foreground">
          This removes the owner&apos;s listing from the site permanently. It cannot be undone.
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

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2"
      >
        {flash && (
          <p className="rounded-full bg-foreground px-5 py-2.5 text-center text-sm font-semibold text-background shadow-lg">
            {flash}
          </p>
        )}
      </div>
    </div>
  );
}
