// AdminPlacesPage — /admin/places (protected, SRS FR-16…FR-19):
// Add / Edit place form modal (incl. server-side image upload, replace, remove),
// the full place list (cards on phones, table from md) and Delete with
// confirmation. Client-side validation with clear error messages (FR-19).

import { useCallback, useEffect, useState } from 'react';
import {
  createPlace,
  deletePlace,
  getPlaces,
  removePlaceImage,
  updatePlace,
  uploadPlaceImage,
} from '../services/placeService';
import { getCategories } from '../services/categoryService';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import { formatDistance } from '../utils/formatDistance';
import Button from '../components/Common/Button';
import Modal from '../components/Common/Modal';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';
import { formatBytes } from '../components/Admin/StorageBar';

const EMPTY_FORM = {
  name: '',
  category_id: '',
  description: '',
  opening_hours: '',
  travel_tips: '',
  distance_km: '',
  latitude: '',
  longitude: '',
  image_url: '',
};

// text-base on small screens prevents iOS Safari's focus auto-zoom (it only
// zooms inputs under 16px); sm+ keeps the compact look on desktop.
const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 sm:text-sm';

// Upload rules — must match the backend (utils/uploadConfig.js).
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_IMAGE_LABEL = 'JPG, JPEG, PNG, WEBP or AVIF';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

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

  // Image upload (form modal) — file picked locally, uploaded after the place is saved
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // object URL of the pending file
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState(null);

  const resetImageState = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    setImageBusy(false);
  }, [imagePreview]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [placeData, catData] = await Promise.all([getPlaces(), getCategories()]);
      setPlaces(placeData);
      setCategories(catData);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name || 'Uncategorised';

  // ── Add / Edit form ──────────────────────────────────────────
  const openAdd = () => {
    resetImageState();
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (place) => {
    resetImageState();
    setEditing(place);
    setForm({
      name: place.name || '',
      category_id: place.category_id || '',
      description: place.description || '',
      opening_hours: place.opening_hours || '',
      travel_tips: place.travel_tips || '',
      distance_km: place.distance_km ?? '',
      latitude: place.latitude ?? '',
      longitude: place.longitude ?? '',
      image_url:
        place.image_url && !place.image_url.startsWith('/uploads/') ? place.image_url : '',
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
    if (form.distance_km === '' || isNaN(Number(form.distance_km)) || Number(form.distance_km) < 0)
      errs.distance_km = 'Distance (km) must be a non-negative number.';
    if (form.latitude === '' || isNaN(Number(form.latitude))) errs.latitude = 'Latitude is required (number).';
    if (form.longitude === '' || isNaN(Number(form.longitude))) errs.longitude = 'Longitude is required (number).';
    return errs;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      distance_km: Number(form.distance_km),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      image_url: form.image_url.trim() || null,
      travel_tips: form.travel_tips.trim() || null,
      opening_hours: form.opening_hours.trim() || null,
    };
    try {
      let savedPlace;
      if (editing) savedPlace = await updatePlace(editing.place_id, payload);
      else savedPlace = await createPlace(payload);

      // Upload the chosen image (server folder → image_url path in the DB).
      if (imageFile) {
        try {
          savedPlace = await uploadPlaceImage(savedPlace.place_id, imageFile);
        } catch (err) {
          // Keep the modal open so the admin sees the reason (format/size/quota).
          setEditing(savedPlace);
          setFormErrors({ form: `Place saved, but the image upload failed: ${errorMessage(err)}` });
          resetImageState();
          await load();
          return;
        }
      }

      resetImageState();
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  // ── Image controls ─────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setImageError(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      e.target.value = '';
      setImageError(`Unsupported format. Allowed: ${ALLOWED_IMAGE_LABEL}.`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      e.target.value = '';
      setImageError('Image is too large — the limit is 5 MB per file.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    // A chosen file wins over the external URL field.
    setForm((prev) => ({ ...prev, image_url: '' }));
  };

  // Remove the stored server image immediately (file deleted + image_url cleared).
  const handleRemoveImage = async () => {
    if (!editing) return;
    setImageBusy(true);
    setImageError(null);
    try {
      await removePlaceImage(editing.place_id);
      setEditing((prev) => ({ ...prev, image_url: null }));
      setPlaces((prev) => prev.map((p) => (p.place_id === editing.place_id ? { ...p, image_url: null } : p)));
      // The stored path no longer exists — never write it back on the next save.
      setForm((prev) => ({ ...prev, image_url: '' }));
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
      await deletePlace(deleteTarget.place_id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Places</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit or delete places of interest, and manage their photos.
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
                      {categoryName(place.category_id)} · {formatDistance(place.distance_km)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {place.opening_hours || 'Hours not set'}
                    </p>
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
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Opening hours</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {places.map((place, i) => (
                  <tr key={place.place_id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold">{place.name}</td>
                    <td className="px-4 py-3">{categoryName(place.category_id)}</td>
                    <td className="px-4 py-3">{formatDistance(place.distance_km)}</td>
                    <td className="max-w-56 truncate px-4 py-3 text-muted-foreground" title={place.opening_hours || ''}>
                      {place.opening_hours || 'Not set'}
                    </td>
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
        title={editing ? `Edit ${editing.name}` : 'Add a new place'}
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

            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-distance">Distance from Wadduwa (km) *</label>
              <input id="f-distance" type="number" step="0.1" min="0" className={inputClass} value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} />
              {formErrors.distance_km && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.distance_km}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-description">Description *</label>
              <textarea id="f-description" rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {formErrors.description && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.description}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-hours">Opening hours</label>
              <input id="f-hours" className={inputClass} placeholder="e.g. 6:00 AM - 8:00 PM daily" value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-image-file">
                Image
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {(imagePreview || editing?.image_url) && (
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <img src={imagePreview || editing.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-[14rem] flex-1">
                  <input
                    id="f-image-file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleFileChange}
                    className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Allowed: {ALLOWED_IMAGE_LABEL} · max 5 MB per file · 500 MB server quota
                  </p>
                </div>
                {editing?.image_url && !imagePreview && (
                  <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage} disabled={imageBusy}>
                    {imageBusy ? 'Removing…' : 'Remove image'}
                  </Button>
                )}
              </div>
              {imageFile && (
                <p className="mt-1.5 text-xs font-medium text-brand-dark">
                  Selected: {imageFile.name} ({formatBytes(imageFile.size)}) — uploaded when you save.
                </p>
              )}
              {imageError && <p className="mt-1.5 text-xs font-medium text-red-600">{imageError}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-image">
                External image URL (optional)
              </label>
              <input id="f-image" className={inputClass} placeholder="https://… (optional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-lat">Latitude *</label>
              <input id="f-lat" type="number" step="0.000001" className={inputClass} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              {formErrors.latitude && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.latitude}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="f-lng">Longitude *</label>
              <input id="f-lng" type="number" step="0.000001" className={inputClass} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              {formErrors.longitude && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.longitude}</p>}
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
