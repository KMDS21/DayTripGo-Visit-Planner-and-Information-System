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
  const [confirmClear, setConfirmClear] = useState(false); // "Remove all photos" dialog
  const [publishBusyId, setPublishBusyId] = useState(null); // row being toggled
  const [homeBusyId, setHomeBusyId] = useState(null); // row being toggled

  // Photo gallery (form modal) — saved photos of the place being edited plus
  // files picked locally, which upload right after the place is saved.
  // Photo gallery (form modal) — saved photos of the place being edited plus
  // files picked locally, which upload right after the place is saved.
  const [photos, setPhotos] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]); // { file, url, name, size, cover }
  const [photosLoading, setPhotosLoading] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);
  const [pendingExploreCover, setPendingExploreCover] = useState(null); // { file, url, name, size, cover: 'explore' }
  const [pendingFeaturedCover, setPendingFeaturedCover] = useState(null); // { file, url, name, size, cover: 'featured' }
  const [customFeaturedCoverRemoved, setCustomFeaturedCoverRemoved] = useState(false);
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
    setCustomFeaturedCoverRemoved(false);
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
    setCustomFeaturedCoverRemoved(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (place) => {
    resetImageState();
    setEditing(place);
    setPhotos([]); // never show another place's gallery while loading
    setPhotosLoading(true);
    setCustomFeaturedCoverRemoved(false);
    getPlacePhotos(place.place_id)
      .then((rows) => setPhotos(rows || []))
      .catch(() => setPhotos([])) // gallery unavailable before migration 004 — empty state
      .finally(() => setPhotosLoading(false));
    const featuredRows = parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers);
    // parseHoursRange returns { from, to, note } with 24-hour values — mapped
    // onto the form's own keys so the pickers show the stored hours.
    const hours = parseHoursRange(place.opening_hours);
    setForm({
      name: place.name || '',
      category_id: place.category_id || '',
      description: place.description || '',
      hours_from: hours.from,
      hours_to: hours.to,
      hours_note: hours.note,
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
  // ── Publish the modal's cover selections ─────────────────────
  const publishPlaceToggles = async (place, coverPaths = {}) => {
    const placeId = place.place_id;
    const imagePath = place.image_url || '';
    const oldPath = editing?.image_url || '';
    const currentCover = pageContent.explore.explore_cover || '';
    const requests = [];

    // Keep site-wide explore cover in sync if this place was previously the owner
    const ownsCover = Boolean(currentCover) && (currentCover === imagePath || currentCover === oldPath);
    if (ownsCover && imagePath && currentCover !== imagePath) {
      requests.push(savePageContent('explore', { explore_cover: imagePath }));
    }

    // Featured escapes membership + card cover.
    let rows = parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers);
    const inFeatured = rows.some((row) => row.id === placeId);
    const existingFeaturedCover = rows.find((row) => row.id === placeId)?.cover || '';

    let featuredPath = existingFeaturedCover;
    if (coverPaths.featured) {
      featuredPath = coverPaths.featured;
    } else if (customFeaturedCoverRemoved) {
      featuredPath = '';
    }

    const before = JSON.stringify(serializeFeaturedRows(rows));
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

    return { explore: imagePath, featured: form.showInFeatured ? featuredPath : '' };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    // Explicit payload — the publishing toggles are UI-only.
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

      let featuredCoverPath = '';

      // Upload pending photos
      if (pendingFiles.length > 0) {
        try {
          // 1. Upload explore card cover (if newly picked) and set as primary
          const exploreFile = pendingFiles.find((p) => p.cover === 'explore');
          if (exploreFile) {
            const result = await uploadPlacePhoto(savedPlace.place_id, exploreFile.file);
            const fresh = (result.photos || []);
            const created = fresh[fresh.length - 1];
            if (created) {
              const primary = await setPlacePrimaryPhoto(savedPlace.place_id, created.photo_id);
              savedPlace = primary.place;
              setPhotos(primary.photos || []);
            }
          }

          // 2. Upload featured cover (if newly picked)
          const featuredFile = pendingFiles.find((p) => p.cover === 'featured');
          if (featuredFile) {
            const result = await uploadPlacePhoto(savedPlace.place_id, featuredFile.file);
            const fresh = (result.photos || []);
            const created = fresh[fresh.length - 1];
            if (created) {
              featuredCoverPath = created.photo_url;
              setPhotos(result.photos || []);
            }
          }

          // 3. Upload additional gallery photos
          const galleryFiles = pendingFiles.filter((p) => p.cover !== 'explore' && p.cover !== 'featured');
          for (const pending of galleryFiles) {
            const result = await uploadPlacePhoto(savedPlace.place_id, pending.file);
            savedPlace = result.place;
            setPhotos(result.photos || []);
          }
        } catch (err) {
          setEditing(savedPlace);
          setFormErrors({ form: `Place saved, but a photo upload failed: ${errorMessage(err)}` });
          resetImageState();
          getPlacePhotos(savedPlace.place_id).then((rows) => setPhotos(rows || [])).catch(() => {});
          await load();
          refreshContent();
          return;
        }
      }

      // Apply the cover selections to the page content
      try {
        await publishPlaceToggles(savedPlace, { featured: featuredCoverPath });
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
      await refreshContent();
    } catch (err) {
      setFormErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  // ── Photo gallery controls ────────────────────────────────
  const openFilePicker = (target = 'gallery') => {
    fileTargetRef.current = target;
    fileInputRef.current && fileInputRef.current.click();
  };

  // Pick one or more files (validated client-side, capped at MAX_PHOTOS total).
  const handleFilesChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    e.target.value = '';
    const target = fileTargetRef.current;
    fileTargetRef.current = 'gallery';
    setImageError(null);
    if (chosen.length === 0) return;

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
    if (accepted.length === 0) {
      if (firstError) setImageError(firstError);
      return;
    }

    if (target === 'explore') {
      const file = accepted[0];
      const entry = {
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        cover: 'explore',
      };
      setPendingExploreCover((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return entry;
      });
      setPendingFiles((prev) => [
        ...prev.filter((p) => p.cover !== 'explore'),
        entry,
      ]);
      return;
    }

    if (target === 'featured') {
      const file = accepted[0];
      const entry = {
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        cover: 'featured',
      };
      setPendingFeaturedCover((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return entry;
      });
      setCustomFeaturedCoverRemoved(false);
      setPendingFiles((prev) => [
        ...prev.filter((p) => p.cover !== 'featured'),
        entry,
      ]);
      setForm((prev) => ({ ...prev, showInFeatured: true }));
      return;
    }

    // target === 'gallery'
    const currentTotal = photos.length + pendingFiles.length;
    const room = MAX_PHOTOS - currentTotal;
    if (room <= 0) {
      setImageError(`A place can have at most ${MAX_PHOTOS} photos — remove one first.`);
      return;
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
        cover: 'gallery',
      }));
      setPendingFiles((prev) => [...prev, ...entries]);
    }
    if (firstError) setImageError(firstError);
  };

  const dropPendingCover = (type) => {
    if (type === 'explore') {
      setPendingExploreCover((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      setPendingFiles((prev) => prev.filter((p) => p.cover !== 'explore'));
    } else if (type === 'featured') {
      setPendingFeaturedCover((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      setPendingFiles((prev) => prev.filter((p) => p.cover !== 'featured'));
    }
  };

  // Drop a not-yet-uploaded photo from the queue.
  const dropPending = (idx) => {
    const removed = pendingFiles[idx];
    if (removed) {
      URL.revokeObjectURL(removed.url);
      if (removed.cover === 'explore') setPendingExploreCover(null);
      if (removed.cover === 'featured') setPendingFeaturedCover(null);
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
  // `removedPaths` takes one path or several (a full wipe passes them all).
  const syncCoversAfterPhotoGone = async (removedPaths) => {
    const paths = new Set(
      (Array.isArray(removedPaths) ? removedPaths : [removedPaths]).filter(Boolean)
    );
    if (paths.size === 0) {
      refreshContent();
      return;
    }
    try {
      const tasks = [];
      if (paths.has(pageContent.explore.explore_cover || '')) {
        tasks.push(savePageContent('explore', { explore_cover: '' }));
      }
      let rows = parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers);
      if (rows.some((row) => row.id === editing?.place_id && paths.has(row.cover))) {
        rows = rows.map((row) =>
          row.id === editing?.place_id && paths.has(row.cover) ? { ...row, cover: '' } : row
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
      if (target?.photo_url) await syncCoversAfterPhotoGone([target.photo_url]);
    } catch (err) {
      setImageError(errorMessage(err));
    } finally {
      setImageBusy(false);
    }
  };

  // ── Remove every photo of this place ─────────────────────────
  // There is no bulk endpoint, so the rows and server files go one at a time
  // (at most MAX_PHOTOS). Each response is applied as it lands so the card
  // photo promotion stays in sync, then the page covers that pointed at any of
  // the removed photos are cleared. Stopped at the first failure — the button
  // can be pressed again for whatever is left.
  const handleClearAllPhotos = async () => {
    if (!editing) return;
    setConfirmClear(false);
    if (photos.length === 0 && pendingFiles.length === 0) return;

    setImageBusy(true);
    setImageError(null);
    resetImageState(); // un-uploaded picks go too, and their cover designations

    const removedPaths = [];
    try {
      for (const photo of [...photos]) {
        const result = await removePlacePhoto(editing.place_id, photo.photo_id);
        removedPaths.push(photo.photo_url);
        applyGallery(result);
      }
      setCoverRecord(NO_COVER_RECORD);
      await syncCoversAfterPhotoGone(removedPaths);
      await load();
      await refreshContent();
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

  // ── Cover slots and More photos ──────────────────────────────
  const currentFeaturedRow = editing
    ? parseFeaturedRows(pageContent.home.featured_place_ids, pageContent.home.featured_covers).find(
        (row) => row.id === editing.place_id
      )
    : null;

  // 1. Explore card cover slot (place's primary/card photo):
  let exploreSlotImg = '';
  let exploreSlotBadge = 'Explore card cover';
  if (pendingExploreCover) {
    exploreSlotImg = pendingExploreCover.url;
    exploreSlotBadge = 'New cover';
  } else if (editing?.image_url) {
    exploreSlotImg = editing.image_url;
    exploreSlotBadge = 'Explore card cover';
  } else {
    const primary = photos.find((p) => p.is_primary);
    if (primary) {
      exploreSlotImg = primary.photo_url;
      exploreSlotBadge = 'Explore card cover';
    }
  }

  // 2. Featured escapes cover slot (unlocked by showInFeatured checkbox):
  let featuredSlotImg = '';
  let featuredSlotBadge = 'Featured cover';
  const hasCustomFeaturedSaved = Boolean(!customFeaturedCoverRemoved && currentFeaturedRow?.cover);
  if (pendingFeaturedCover) {
    featuredSlotImg = pendingFeaturedCover.url;
    featuredSlotBadge = 'New cover';
  } else if (hasCustomFeaturedSaved) {
    featuredSlotImg = currentFeaturedRow.cover;
    featuredSlotBadge = 'Featured cover';
  } else if (exploreSlotImg) {
    featuredSlotImg = exploreSlotImg;
    featuredSlotBadge = 'From Explore cover';
  }

  // 3. URLs that belong to covers and MUST NOT appear in "More photos":
  const coverUrlsToExclude = new Set();
  if (editing?.image_url) coverUrlsToExclude.add(editing.image_url);
  if (exploreSlotImg && !exploreSlotImg.startsWith('blob:')) coverUrlsToExclude.add(exploreSlotImg);
  if (hasCustomFeaturedSaved && !currentFeaturedRow.cover.startsWith('blob:')) {
    coverUrlsToExclude.add(currentFeaturedRow.cover);
  }
  if (featuredSlotImg && !featuredSlotImg.startsWith('blob:') && featuredSlotImg !== exploreSlotImg) {
    coverUrlsToExclude.add(featuredSlotImg);
  }

  // Deduplicate and filter out cover photos for the "More photos" section
  const seenGalleryUrls = new Set();
  const galleryPhotos = [];
  for (const photo of photos) {
    if (photo.is_primary) continue;
    if (coverUrlsToExclude.has(photo.photo_url)) continue;
    if (seenGalleryUrls.has(photo.photo_url)) continue;
    seenGalleryUrls.add(photo.photo_url);
    galleryPhotos.push(photo);
  }

  // Only gallery-tagged files in pending:
  const galleryPending = pendingFiles
    .map((pending, idx) => ({ pending, idx }))
    .filter(({ pending }) => pending.cover !== 'explore' && pending.cover !== 'featured');

  const galleryCount = photos.length + pendingFiles.length;
  const moreCount = galleryPhotos.length + galleryPending.length;

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
            {/* Name and Category share the first row. */}
            <div>
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
              {/* 1) Dedicated Cover photos section */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 1. Explore card cover slot */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Explore card cover</p>
                    <span className="text-[11px] font-medium text-brand">Required for card</span>
                  </div>
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
                              onClick={() => dropPendingCover('explore')}
                              className="border-l border-white/25 px-2 text-red-300 hover:bg-white/25"
                            >
                              Cancel
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
                        <span className="text-xs font-semibold">Add Explore card cover</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    The primary photo displayed on the place card across the Explore page and listings.
                  </p>
                </div>

                {/* 2. Featured escapes (home page) cover slot */}
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

                  {form.showInFeatured && (
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Featured escapes cover</p>
                        <span className="text-[11px] font-medium text-muted-foreground">Carousel image</span>
                      </div>
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
                                {hasCustomFeaturedSaved || pendingFeaturedCover ? 'Change photo' : 'Upload custom cover'}
                              </button>
                              {pendingFeaturedCover && (
                                <button
                                  type="button"
                                  onClick={() => dropPendingCover('featured')}
                                  className="border-l border-white/25 px-2 text-red-300 hover:bg-white/25"
                                >
                                  Cancel
                                </button>
                              )}
                              {!pendingFeaturedCover && hasCustomFeaturedSaved && (
                                <button
                                  type="button"
                                  onClick={() => setCustomFeaturedCoverRemoved(true)}
                                  title="Revert back to the Explore card cover"
                                  className="border-l border-white/25 px-2 text-amber-300 hover:bg-white/25"
                                >
                                  Use card cover
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
                            <span className="text-xs font-semibold">Upload Featured cover</span>
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Card cover in the home page carousel (defaults to Explore card cover if no custom cover is set).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2) More photos — only additional photos */}
              <div className="mt-4 border-t border-brand/20 pt-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-brand">More photos</p>
                    <p className="text-xs text-muted-foreground">
                      Additional photos for the place popup gallery (covers are kept separate above).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-bold text-brand">
                      {galleryPhotos.length + galleryPending.length} photos
                    </span>
                    {(photos.length > 0 || pendingFiles.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setConfirmClear(true)}
                        disabled={imageBusy || saving || photosLoading}
                        className="rounded-full border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove all photos
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {/* Saved additional photos */}
                  {galleryPhotos.map((photo) => (
                    <figure
                      key={photo.photo_id}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      <img src={photo.photo_url} alt="" className="h-full w-full object-cover" />
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

                  {/* Pending additional photos */}
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

                  {/* Add photo tile */}
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
                  Up to {MAX_PHOTOS} photos per place · {ALLOWED_IMAGE_LABEL} · max 5 MB each.
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

      {/* Remove-all-photos confirmation */}
      <Modal open={confirmClear} title="Remove all photos?" onClose={() => setConfirmClear(false)}>
        <p className="text-sm text-muted-foreground">
          This deletes every photo of{' '}
          <span className="font-semibold text-foreground">{editing?.name || 'this place'}</span>, including the card
          photo and the Explore and Featured covers. This cannot be undone — you can upload replacements afterwards.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleClearAllPhotos} disabled={imageBusy}>
            {imageBusy ? 'Removing…' : 'Remove all'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
