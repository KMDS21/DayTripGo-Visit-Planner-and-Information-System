// AdminPlacesPage — /admin/places (protected, SRS FR-16…FR-19):
// Add / Edit place form modal (incl. the photo gallery: upload up to 10 photos
// per place and choose which one is the public "card photo"), the full place
// list (cards on phones, table from md) and Delete with confirmation.
// Client-side validation with clear error messages (FR-19).

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPlace,
  deletePlace,
  getPlacePhotos,
  getPlaces,
  removePlacePhoto,
  setPlacePrimaryPhoto,
  setPlacePublished,
  updatePlace,
  uploadPlacePhoto,
} from '../services/placeService';
import { getCategories } from '../services/categoryService';
import { getPageContent, savePageContent } from '../services/contentService';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import { parseFeaturedRows, serializeFeaturedRows } from '../utils/featuredConfig';
import { parseCoordsFromGoogleMapsUrl } from '../utils/googleMaps';
import { composeHours, parseHoursRange } from '../utils/hoursRange';
import Button from '../components/Common/Button';
import Modal from '../components/Common/Modal';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';
import { formatBytes } from '../components/Admin/StorageBar';

const EMPTY_FORM = {
  name: '',
  category_id: '',
  description: '',
  // Opening hours are edited as a time range plus an optional note; the two
  // are joined back into the single free-text string on save (hoursRange.js).
  hours_from: '',
  hours_to: '',
  hours_note: '',
  travel_tips: '',
  google_maps_url: '',
  // Publish selections (UI only — never sent to the places API)
  showInFeatured: false,
};

// text-base on small screens prevents iOS Safari's focus auto-zoom (it only
// zooms inputs under 16px); sm+ keeps the compact look on desktop.
const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 sm:text-sm';

// Upload rules — must match the backend (utils/uploadConfig.js).
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_IMAGE_LABEL = 'JPG, JPEG, PNG, WEBP or AVIF';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PHOTOS = 10; // per place — must match placePhotoService.MAX_PHOTOS_PER_PLACE

export default function AdminPlacesPage() {
  usePageTitle();

  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // place being edited, or null = add
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [publishBusyId, setPublishBusyId] = useState(null); // row being toggled
  const [homeBusyId, setHomeBusyId] = useState(null); // row being toggled

  // Photo gallery (form modal) — saved photos of the place being edited plus
  // files picked locally, which upload right after the place is saved.
  const [photos, setPhotos] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]); // { file, url, name, size }
  const [photosLoading, setPhotosLoading] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);
  // Cover-slot picks: the file chosen through a cover slot becomes that page's
  // cover (uploaded together with the gallery on save). fileTargetRef records
  // which slot opened the shared file input.
  const [pendingExploreCover, setPendingExploreCover] = useState(null); // { file, url, name, size }
  const [pendingFeaturedCover, setPendingFeaturedCover] = useState(null);
  const fileTargetRef = useRef('gallery');

  const resetImageState = useCallback(() => {
    setPendingFiles((prev) => {
      prev.forEach((pending) => URL.revokeObjectURL(pending.url));
      return [];
    });
    setPendingExploreCover((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setPendingFeaturedCover((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    fileTargetRef.current = 'gallery';
    setImageError(null);
    setImageBusy(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [placeData, catData] = await Promise.all([getPlaces({ scope: 'admin' }), getCategories()]);
      setPlaces(placeData);
      setCategories(catData);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Current home/explore page content — feeds the cover selections in the
  // modal (same sections the content editors manage).
  const [pageContent, setPageContent] = useState({ home: {}, explore: {} });
  const refreshContent = useCallback(async () => {
    try {
      const [home, explore] = await Promise.all([getPageContent('home'), getPageContent('explore')]);
      setPageContent({ home: home || {}, explore: explore || {} });
    } catch {
      // Content API unavailable — the toggles simply start unchecked.
    }
  }, []);

  useEffect(() => {
    load();
    refreshContent();
  }, [load, refreshContent]);

  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name || 'Uncategorised';

  // ── Add / Edit form ──────────────────────────────────────────
  // Live preview of the string the From/To pickers + note will be saved as,
  // so the admin sees exactly what visitors will read.
  const hoursPreview = composeHours(form.hours_from, form.hours_to, form.hours_note);

  const openAdd = () => {
    resetImageState();
    setEditing(null);
    setPhotos([]);
    setPhotosLoading(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (place) => {
    resetImageState();
    setEditing(place);
    setPhotos([]); // never show another place's gallery while loading
    setPhotosLoading(true);
    getPlacePhotos(place.place_id)
      .then((rows) => setPhotos(rows || []))
      .catch(() => setPhotos([])) // gallery unavailable before migration 004 — empty state
      .finally(() => setPhotosLoading(false));
    const featuredRows = parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers);
    setForm({
      name: place.name || '',
      category_id: place.category_id || '',
      description: place.description || '',
      ...parseHoursRange(place.opening_hours),
      travel_tips: place.travel_tips || '',
      google_maps_url: place.google_maps_url || '',
      showInFeatured: featuredRows.some((row) => row.id === place.place_id),
    });
    setFormErrors({});
    setFormOpen(true);
  };

  // FR-19: validate required fields before save; show errors if invalid.
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.category_id) errs.category_id = 'Category is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (Boolean(form.hours_from) !== Boolean(form.hours_to))
      errs.hours = 'Set both an opening and a closing time, or leave both empty.';
    const mapUrl = form.google_maps_url.trim();
    if (mapUrl && !/^https:\/\/(www\.|m\.)?google\.[a-z.]+\/maps\b/i.test(mapUrl) && !/^https:\/\/maps\.app\.goo\.gl\//i.test(mapUrl) && !/^https:\/\/goo\.gl\/maps\//i.test(mapUrl))
      errs.google_maps_url = 'Enter a Google Maps link, e.g. https://www.google.com/maps/… or https://maps.app.goo.gl/…';
    return errs;
  };

  // ── Publish the modal's cover selections ─────────────────────
  // Writes the same page_content sections the Home/Explore editors manage:
  // explore cover photo, Featured escapes membership + card cover.
  // coverPaths = { explore, featured } — photos chosen through the cover slots
  // (paths captured during upload); they win over the place's card photo.
  const publishPlaceToggles = async (place, coverPaths = {}) => {
    const placeId = place.place_id;
    const imagePath = place.image_url || '';
    const oldPath = editing?.image_url || '';
    const currentCover = pageContent.explore.explore_cover || '';
    const explorePath = coverPaths.explore || imagePath;
    const featuredPath = coverPaths.featured || imagePath;
    const requests = [];

    // Explore cover — no checkbox: an upload through the Explore cover slot
    // directly sets it (and that photo also becomes the card photo), and the
    // current cover owner's banner follows a card-photo change.
    const ownsCover = Boolean(currentCover) && (currentCover === imagePath || currentCover === oldPath);
    if ((Boolean(coverPaths.explore) || ownsCover) && explorePath && currentCover !== explorePath) {
      requests.push(savePageContent('explore', { explore_cover: explorePath }));
    }

    // Featured escapes membership + card cover.
    let rows = parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers);
    const before = JSON.stringify(serializeFeaturedRows(rows));
    const inFeatured = rows.some((row) => row.id === placeId);
    if (form.showInFeatured) {
      if (!inFeatured && rows.length >= 12) {
        throw new Error('Featured escapes already has 12 places — remove one in the Home page editor first.');
      }
      rows = rows.map((row) => (row.id === placeId ? { id: row.id, cover: featuredPath } : row));
      if (!inFeatured) rows = [...rows, { id: placeId, cover: featuredPath }];
    } else if (inFeatured) {
      rows = rows.filter((row) => row.id !== placeId);
    }
    const after = JSON.stringify(serializeFeaturedRows(rows));
    if (before !== after) requests.push(savePageContent('home', serializeFeaturedRows(rows)));

    await Promise.all(requests);
    if (requests.length > 0) await refreshContent();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    // Explicit payload — the two publishing toggles are UI-only.
    const payload = {
      name: form.name,
      category_id: Number(form.category_id),
      description: form.description,
      google_maps_url: form.google_maps_url.trim() || null,
      travel_tips: form.travel_tips.trim() || null,
      opening_hours: composeHours(form.hours_from, form.hours_to, form.hours_note) || null,
    };
    try {
      let savedPlace;
      if (editing) savedPlace = await updatePlace(editing.place_id, payload);
      else savedPlace = await createPlace(payload);

      // Upload the pending photos (server folder → place_photos rows; the first
      // photo of a place automatically becomes the card photo). A file chosen
      // through a cover slot becomes that page's cover path.
      let exploreCoverPath = '';
      let featuredCoverPath = '';
      if (pendingFiles.length > 0) {
        try {
          const seen = new Set(photos.map((row) => row.photo_id));
          for (const pending of pendingFiles) {
            const result = await uploadPlacePhoto(savedPlace.place_id, pending.file);
            savedPlace = result.place; // keeps image_url (card photo) in sync
            const fresh = (result.photos || []).filter((row) => !seen.has(row.photo_id));
            (result.photos || []).forEach((row) => seen.add(row.photo_id));
            const created = fresh[fresh.length - 1];
            if (created && pendingFeaturedCover && pending.file === pendingFeaturedCover.file) {
              featuredCoverPath = created.photo_url;
            }
            if (created && pendingExploreCover && pending.file === pendingExploreCover.file) {
              exploreCoverPath = created.photo_url;
              // Directly wired with the card cover: the banner photo uploaded
              // through the slot also becomes the place's card photo.
              const primary = await setPlacePrimaryPhoto(savedPlace.place_id, created.photo_id);
              savedPlace = primary.place;
              setPhotos(primary.photos || []);
            } else {
              setPhotos(result.photos || []);
            }
          }
        } catch (err) {
          // Keep the modal open so the admin sees the reason (format/size/quota).
          setEditing(savedPlace);
          setFormErrors({ form: `Place saved, but a photo upload failed: ${errorMessage(err)}` });
          resetImageState();
          getPlacePhotos(savedPlace.place_id).then((rows) => setPhotos(rows || [])).catch(() => {});
          await load();
          refreshContent();
          return;
        }
      }

      // Apply the cover selections to the page content.
      try {
        await publishPlaceToggles(savedPlace, { explore: exploreCoverPath, featured: featuredCoverPath });
      } catch (err) {
        setEditing(savedPlace);
        setFormErrors({ form: `Place saved, but publishing to the page failed: ${errorMessage(err)}` });
        resetImageState();
        await load();
        refreshContent();
        return;
      }

      resetImageState();
      setFormOpen(false);
      await load();
      refreshContent();
    } catch (err) {
      setFormErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  // ── Photo gallery controls ────────────────────────────────
  // Opens the shared file input for one of the cover slots; the first file
  // picked through a slot is designated as that cover on save.
  const openFilePicker = (target = 'gallery') => {
    fileTargetRef.current = target;
    fileInputRef.current && fileInputRef.current.click();
  };

  // Pick one or more files (validated client-side, capped at MAX_PHOTOS total).
  const handleFilesChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-picking the same file later
    // Which slot opened the picker? Reset immediately so an empty selection
    // cannot misdirect the next pick.
    const target = fileTargetRef.current;
    fileTargetRef.current = 'gallery';
    setImageError(null);
    if (chosen.length === 0) return;

    const room = MAX_PHOTOS - (photos.length + pendingFiles.length);
    if (room <= 0) {
      setImageError(`A place can have at most ${MAX_PHOTOS} photos — remove one first.`);
      return;
    }

    const accepted = [];
    let firstError = null;
    for (const file of chosen) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        firstError = firstError || `Unsupported format (${file.name}). Allowed: ${ALLOWED_IMAGE_LABEL}.`;
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        firstError = firstError || `${file.name} is too large — the limit is 5 MB per file.`;
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length > room) {
      firstError = `Only ${room} more photo${room === 1 ? '' : 's'} fit — a place can have at most ${MAX_PHOTOS}.`;
    }
    const clipped = accepted.slice(0, room);
    if (clipped.length > 0) {
      const entries = clipped.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      }));
      setPendingFiles((prev) => [...prev, ...entries]);
      // A cover slot opened this picker: its first file becomes that cover,
      // and the matching selection switches on automatically.
      if (target === 'explore') {
        setPendingExploreCover(entries[0]);
      }
      if (target === 'featured') {
        setPendingFeaturedCover(entries[0]);
        setForm((prev) => ({ ...prev, showInFeatured: true }));
      }
    }
    if (firstError) setImageError(firstError);
  };

  // Drop a not-yet-uploaded photo from the queue.
  const dropPending = (idx) => {
    const removed = pendingFiles[idx];
    if (removed) {
      URL.revokeObjectURL(removed.url);
      // A cover slot pointing at the dropped file loses its designation too.
      setPendingExploreCover((prev) => (prev && prev.url === removed.url ? null : prev));
      setPendingFeaturedCover((prev) => (prev && prev.url === removed.url ? null : prev));
    }
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Apply a gallery response: photos list, editing place (image_url = card
  // photo) and the row in the page's place table all stay in sync.
  const applyGallery = (result) => {
    setPhotos(result.photos || []);
    setEditing(result.place);
    setPlaces((prev) =>
      prev.map((p) => (p.place_id === result.place.place_id ? { ...p, image_url: result.place.image_url } : p))
    );
  };


  // A photo file is about to disappear: clear any cover in the page sections
  // that pointed at it, or the public site would show a broken image.
  const syncCoversAfterPhotoGone = async (removedPath) => {
    try {
      const tasks = [];
      if (removedPath && (pageContent.explore.explore_cover || '') === removedPath) {
        tasks.push(savePageContent('explore', { explore_cover: '' }));
      }
      let rows = parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers);
      if (removedPath && rows.some((row) => row.id === editing?.place_id && row.cover === removedPath)) {
        rows = rows.map((row) =>
          row.id === editing?.place_id && row.cover === removedPath ? { ...row, cover: '' } : row
        );
        tasks.push(savePageContent('home', serializeFeaturedRows(rows)));
      }
      await Promise.all(tasks);
    } catch {
      // Best-effort cleanup; the content editors can fix it by hand.
    }
    refreshContent();
  };

  // Delete a photo (file + row). If it was the card photo, the service
  // promotes the next one automatically.
  const handleDeletePhoto = async (photoId) => {
    if (!editing) return;
    setImageBusy(true);
    setImageError(null);
    try {
      const target = photos.find((p) => p.photo_id === photoId);
      const result = await removePlacePhoto(editing.place_id, photoId);
      applyGallery(result);
      if (target?.photo_url) await syncCoversAfterPhotoGone(target.photo_url);
    } catch (err) {
      setImageError(errorMessage(err));
    } finally {
      setImageBusy(false);
    }
  };

  // ── Delete (FR-18) ───────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const target = deleteTarget;
      await deletePlace(target.place_id);
      setDeleteTarget(null);

      // Drop the deleted place from the page sections (its image file is
      // gone too, so any cover reference to it would break).
      try {
        const tasks = [];
        const oldPath = target.image_url || '';
        if (oldPath && (pageContent.explore.explore_cover || '') === oldPath) {
          tasks.push(savePageContent('explore', { explore_cover: '' }));
        }
        let rows = parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers);
        if (rows.some((row) => row.id === target.place_id)) {
          rows = rows.filter((row) => row.id !== target.place_id);
          tasks.push(savePageContent('home', serializeFeaturedRows(rows)));
        }
        await Promise.all(tasks);
      } catch {
        // Best-effort cleanup; the content editors can fix it by hand.
      }

      await load();
      refreshContent();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // ── Publish / unpublish (show on the public site) ──────────────
  // Rows fetched before migration 005 has no `published` field — count that
  // as published (the column defaults to true).
  const isPublished = (place) => place.published !== false;

  const togglePublish = async (place) => {
    const next = !isPublished(place);
    setPublishBusyId(place.place_id);
    try {
      const updated = await setPlacePublished(place.place_id, next);
      setPlaces((prev) =>
        prev.map((p) => (p.place_id === place.place_id ? { ...p, published: updated.published } : p))
      );
    } catch (err) {
      setError(errorMessage(err)); // shown above the list with a Retry button
    } finally {
      setPublishBusyId(null);
    }
  };

  // Pill button per row — click to publish/unpublish the place.
  const publishPill = (place) => {
    const published = isPublished(place);
    const busy = publishBusyId === place.place_id;
    return (
      <button
        type="button"
        onClick={() => togglePublish(place)}
        disabled={busy}
        title={
          published
            ? 'Shown on the public site — click to unpublish'
            : 'Hidden from the public site — click to publish'
        }
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
          published
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
            : 'border-border bg-muted text-muted-foreground hover:border-brand hover:text-brand'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`}
        />
        {busy ? 'Saving…' : published ? 'Published' : 'Unpublished'}
      </button>
    );
  };

  // "Show on home" selection — stored in the home page's content sections
  // (home_place_ids, comma-separated), the same storage the content editors
  // use. The home page's All places section shows only the selected rows.
  const homePlaceIds = String(pageContent.home.home_place_ids || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  const toggleOnHome = async (place) => {
    const next = homePlaceIds.includes(place.place_id)
      ? homePlaceIds.filter((id) => id !== place.place_id)
      : [...homePlaceIds, place.place_id];
    setHomeBusyId(place.place_id);
    try {
      await savePageContent('home', { home_place_ids: next.join(',') });
      await refreshContent();
    } catch (err) {
      setError(errorMessage(err)); // shown above the list with a Retry button
    } finally {
      setHomeBusyId(null);
    }
  };

  // Pill button per row — click to show/hide the place in the home listing.
  const homePill = (place) => {
    const selected = homePlaceIds.includes(place.place_id);
    const busy = homeBusyId === place.place_id;
    return (
      <button
        type="button"
        onClick={() => toggleOnHome(place)}
        disabled={busy}
        title={
          selected
            ? "Shown in the home page's All places section — click to remove"
            : 'Add this place to the home page listing'
        }
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
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

  // ── Cover slots (photo section, part 1) ──────────────────────
  const currentExploreCover = pageContent.explore.explore_cover || '';
  const currentFeaturedRow = editing
    ? parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers).find(
        (row) => row.id === editing.place_id
      )
    : null;

  // Explore cover slot: a newly chosen file, else this place's photo when it
  // is the current Explore cover.
  let exploreSlotImg = '';
  let exploreSlotBadge = 'Explore cover';
  if (pendingExploreCover) {
    exploreSlotImg = pendingExploreCover.url;
    exploreSlotBadge = 'New cover';
  } else if (
    currentExploreCover &&
    (photos.some((row) => row.photo_url === currentExploreCover) || currentExploreCover === editing?.image_url)
  ) {
    exploreSlotImg = currentExploreCover;
  }

  // Featured cover slot (unlocked by the toggle): a newly chosen file, else
  // the stored carousel cover, else the card photo fallback.
  let featuredSlotImg = '';
  let featuredSlotBadge = 'Featured cover';
  if (pendingFeaturedCover) {
    featuredSlotImg = pendingFeaturedCover.url;
    featuredSlotBadge = 'New cover';
  } else if (currentFeaturedRow?.cover) {
    featuredSlotImg = currentFeaturedRow.cover;
  } else if (editing?.image_url) {
    featuredSlotImg = editing.image_url;
    featuredSlotBadge = 'Card photo';
  }

  // Cover-designated photos stay OUT of the "More photos" grid — that section
  // is only for extra photos of the location; the covers live in their slots.
  const savedCoverPaths = new Set();
  if (exploreSlotImg && !exploreSlotImg.startsWith('blob:')) savedCoverPaths.add(exploreSlotImg);
  if (!pendingFeaturedCover && currentFeaturedRow?.cover) savedCoverPaths.add(currentFeaturedRow.cover);
  const coverPendingUrls = new Set(
    [pendingExploreCover, pendingFeaturedCover].filter(Boolean).map((entry) => entry.url)
  );
  const galleryPhotos = photos.filter((row) => !savedCoverPaths.has(row.photo_url));
  const galleryPending = pendingFiles
    .map((pending, idx) => ({ pending, idx }))
    .filter(({ pending }) => !coverPendingUrls.has(pending.url));
  const dropPendingByUrl = (url) => {
    const idx = pendingFiles.findIndex((entry) => entry.url === url);
    if (idx >= 0) dropPending(idx);
  };

  return (
    <div className="space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Attractive Places</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit or delete attractive places and manage their photos.
          </p>
        </div>
        <Button onClick={openAdd}>＋ Add place</Button>
      </header>

      {loading && <Loader label="Loading places…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          {/* Card list — phones/tablets below md (a 640px table forces
              horizontal scrolling there, which is painful on a phone). */}
          <ul className="space-y-3 md:hidden">
            {places.map((place, i) => (
              <li key={place.place_id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      <span className="mr-2 text-sm text-muted-foreground">{i + 1}.</span>
                      {place.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {categoryName(place.category_id)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {publishPill(place)}
                      {homePill(place)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(place)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => setDeleteTarget(place)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
            {places.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
                No places yet. Add the first one.
              </li>
            )}
          </ul>

          {/* Table — md and up */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-sm md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Show on public site</th>
                  <th className="px-4 py-3">Show on home</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {places.map((place, i) => (
                  <tr key={place.place_id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold">{place.name}</td>
                    <td className="px-4 py-3">{categoryName(place.category_id)}</td>
                    <td className="px-4 py-3">{publishPill(place)}</td>
                    <td className="px-4 py-3">{homePill(place)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(place)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(place)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {places.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No places yet. Add the first one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add / Edit modal (FR-16, FR-17, FR-19) */}
      <Modal
        open={formOpen}
        title={editing ? editing.name : 'Add a new place'}
        onClose={() => {
          setFormOpen(false);
          resetImageState();
        }}
        wide
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-name">Name *</label>
              <input id="f-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {formErrors.name && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-category">Category *</label>
              <select id="f-category" className={inputClass} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
              {formErrors.category_id && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.category_id}</p>}
            </div>

            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold">Opening hours</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="f-hours-from">Opens</label>
                  <input id="f-hours-from" type="time" className={inputClass} value={form.hours_from} onChange={(e) => setForm({ ...form, hours_from: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="f-hours-to">Closes</label>
                  <input id="f-hours-to" type="time" className={inputClass} value={form.hours_to} onChange={(e) => setForm({ ...form, hours_to: e.target.value })} />
                </div>
              </div>
              <label className="mb-1.5 mt-3 block text-xs font-medium text-muted-foreground" htmlFor="f-hours">Note <span className="font-normal">(optional)</span></label>
              <input id="f-hours" className={inputClass} placeholder="e.g. daily, or visits by arrangement" value={form.hours_note} onChange={(e) => setForm({ ...form, hours_note: e.target.value })} />
              {hoursPreview && <p className="mt-1.5 text-xs text-muted-foreground">Visitors see: {hoursPreview}</p>}
              {formErrors.hours && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.hours}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-description">Description *</label>
              <textarea id="f-description" rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {formErrors.description && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.description}</p>}
            </div>

            {/* Photo section — divided into (1) cover photos and (2) more photos */}
            <div className="sm:col-span-2 rounded-2xl border border-brand/30 bg-brand/[0.06] p-4">
              {/* 1) Cover photos — the Explore cover slot on the left, its
                  selecting options on the right; selecting "Show in Featured
                  escapes" unlocks the upload for that cover. */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">Add photo to Explore page cover</p>
                  <div className="mt-1.5">
                    {exploreSlotImg ? (
                      <figure className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                        <img src={exploreSlotImg} alt="" className="h-full w-full object-cover" />
                        <figcaption className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow">
                          {exploreSlotBadge}
                        </figcaption>
                        <div className="absolute inset-x-0 bottom-0 flex items-stretch bg-black/55 text-[11px] font-semibold text-white">
                          <button
                            type="button"
                            onClick={() => openFilePicker('explore')}
                            className="flex-1 py-1 hover:bg-white/25"
                          >
                            Change photo
                          </button>
                          {pendingExploreCover && (
                            <button
                              type="button"
                              onClick={() => dropPendingByUrl(pendingExploreCover.url)}
                              className="border-l border-white/25 px-2 text-red-300 hover:bg-white/25"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </figure>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openFilePicker('explore')}
                        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand/50 bg-brand/[0.07] text-brand transition-colors hover:border-brand hover:bg-brand/15"
                      >
                        <span className="text-2xl leading-none">＋</span>
                        <span className="text-xs font-semibold">Add cover photo</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Uploaded here it becomes the card photo and the banner behind the Explore page hero — no extra
                    selection needed.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-brand"
                      checked={form.showInFeatured}
                      onChange={(e) => setForm({ ...form, showInFeatured: e.target.checked })}
                    />
                    <span>
                      <span className="block text-sm font-medium">Show in Featured escapes (home page)</span>
                      <span className="block text-xs text-muted-foreground">
                        Adds this place to the home page carousel (up to 12).
                      </span>
                    </span>
                  </label>

                  {/* Unlocked by the selection above: upload the carousel cover */}
                  {form.showInFeatured && (
                    <div>
                      <p className="text-sm font-semibold">Upload image to that cover</p>
                      <div className="mt-1.5">
                        {featuredSlotImg ? (
                          <figure className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                            <img src={featuredSlotImg} alt="" className="h-full w-full object-cover" />
                            <figcaption className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow">
                              {featuredSlotBadge}
                            </figcaption>
                            <div className="absolute inset-x-0 bottom-0 flex items-stretch bg-black/55 text-[11px] font-semibold text-white">
                              <button
                                type="button"
                                onClick={() => openFilePicker('featured')}
                                className="flex-1 py-1 hover:bg-white/25"
                              >
                                Change photo
                              </button>
                              {pendingFeaturedCover && (
                                <button
                                  type="button"
                                  onClick={() => dropPendingByUrl(pendingFeaturedCover.url)}
                                  className="border-l border-white/25 px-2 text-red-300 hover:bg-white/25"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </figure>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openFilePicker('featured')}
                            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand/50 bg-brand/[0.07] text-brand transition-colors hover:border-brand hover:bg-brand/15"
                          >
                            <span className="text-2xl leading-none">＋</span>
                            <span className="text-xs font-semibold">Upload image</span>
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Card cover in the Featured escapes carousel.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2) More photos — the rest of the gallery */}
              <div className="mt-4 border-t border-brand/20 pt-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-brand">More photos</p>
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-bold text-brand">
                    {photos.length + pendingFiles.length}/{MAX_PHOTOS}
                  </span>
                </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Saved photos — cover picks live in their slots above */}
                {galleryPhotos.map((photo) => (
                  <figure
                    key={photo.photo_id}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img src={photo.photo_url} alt="" className="h-full w-full object-cover" />
                    {photo.is_primary && (
                      <figcaption className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        Card photo
                      </figcaption>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.photo_id)}
                      disabled={imageBusy}
                      className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[11px] font-semibold text-white hover:bg-black/75 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </figure>
                ))}

                {/* Chosen but not uploaded yet (upload on save) — cover picks stay in their slots */}
                {galleryPending.map(({ pending, idx }) => (
                  <figure
                    key={`${pending.name}-${idx}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-brand/60 bg-muted"
                  >
                    <img src={pending.url} alt="" className="h-full w-full object-cover" />
                    <span
                      title={`${pending.name} · ${formatBytes(pending.size)}`}
                      className="absolute left-1.5 top-1.5 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-bold text-white"
                    >
                      New
                    </span>
                    <button
                      type="button"
                      onClick={() => dropPending(idx)}
                      className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[11px] font-semibold text-white hover:bg-black/75"
                    >
                      Remove
                    </button>
                  </figure>
                ))}

                {/* Add tile */}
                {!photosLoading && photos.length + pendingFiles.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => openFilePicker('gallery')}
                    className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand/50 bg-brand/[0.07] text-brand transition-colors hover:border-brand hover:bg-brand/15"
                  >
                    <span className="text-2xl leading-none">＋</span>
                    <span className="text-xs font-semibold">Add photo</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                id="f-image-file"
                type="file"
                multiple
                aria-label="Add photos"
                accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFilesChange}
                className="hidden"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Up to {MAX_PHOTOS} photos per place · {ALLOWED_IMAGE_LABEL} · max 5 MB each · 500 MB server quota.
                Photos upload on save; the first becomes the card photo, and the Explore cover slot above always sets
                the card photo directly.
              </p>
              {photosLoading && <p className="mt-1 text-xs text-muted-foreground">Loading photos…</p>}
              {imageError && <p className="mt-1.5 text-xs font-medium text-red-600">{imageError}</p>}
              </div>
            </div>

            <div className={`sm:col-span-2 grid gap-4 ${editing ? '' : 'sm:grid-cols-2'}`}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-maps">
                  Google Maps location URL
                </label>
                <input
                  id="f-maps"
                  className={inputClass}
                  placeholder="https://www.google.com/maps/… (copy the link from Google Maps)"
                  value={form.google_maps_url}
                  onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
                />
                {formErrors.google_maps_url && (
                  <p className="mt-1 text-xs font-medium text-red-600">{formErrors.google_maps_url}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Shown as a Map link on the place card. The map coordinates are taken from it automatically.
                </p>
              </div>

              {/* Live location thumbnail beside the field — only when adding a
                  new place; editing an existing place doesn't need it. */}
              {!editing &&
                (() => {
                  const mapUrl = form.google_maps_url.trim();
                  const parsed = parseCoordsFromGoogleMapsUrl(mapUrl);
                  return parsed ? (
                    <iframe
                      title="Location preview"
                      src={`https://maps.google.com/maps?q=${parsed.lat},${parsed.lng}&z=14&output=embed`}
                      loading="lazy"
                      className="h-44 w-full rounded-xl border border-border bg-muted"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 text-center text-xs text-muted-foreground">
                      {mapUrl
                        ? 'No instant preview for this link — short links resolve after saving.'
                        : 'Paste a Google Maps link and the location preview appears here.'}
                    </div>
                  );
                })()}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-tips">Travel tips</label>
              <textarea id="f-tips" rows={2} className={inputClass} value={form.travel_tips} onChange={(e) => setForm({ ...form, travel_tips: e.target.value })} />
            </div>
          </div>

          {formErrors.form && (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {formErrors.form}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add place'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation (FR-18) */}
      <Modal open={Boolean(deleteTarget)} title="Delete place?" onClose={() => setDeleteTarget(null)}>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
