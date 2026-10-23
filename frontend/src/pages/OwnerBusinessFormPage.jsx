// OwnerBusinessFormPage — /owner/businesses/new and /owner/businesses/:id/edit
// Step 2 of the flow: the listing itself. One form for create and edit —
// create sends POST, uploads any photos already picked, then swaps the URL for
// the edit route; edit sends PUT. Photos mirror the places admin form: an
// Explore card cover, a feature card cover and "more photos" (max 10).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  createBusiness,
  deleteBusinessPhoto,
  getBusinessTags,
  getMyBusiness,
  getMyBusinessPhotos,
  setBusinessPhotoRole,
  updateBusiness,
  uploadBusinessPhoto,
} from '../services/businessService';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Common/Button';
import Loader from '../components/Common/Loader';
import Modal from '../components/Common/Modal';
import StatusBadge from '../components/BusinessListing/StatusBadge';
import { formatBytes } from '../components/Admin/StorageBar';

// Upload rules — must match the backend (utils/uploadConfig.js) and the
// places form so both galleries behave identically.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_IMAGE_LABEL = 'JPG, JPEG, PNG, WEBP or AVIF';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PHOTOS = 10; // per listing — must match businessPhotoService.MAX_PHOTOS_PER_BUSINESS
const MAX_SHORT = 160;

const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';

const EMPTY = {
  name: '',
  short_description: '',
  description: '',
  owner_name: '',
  opening_hours: '',
  phone: '',
  email: '',
  address: '',
  website_url: '',
  google_maps_url: '',
};

function Field({ id, label, hint, required, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </label>
      <input id={id} className={fieldClass} {...props} />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="border-b border-border pb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-dark">
      {children}
    </h2>
  );
}

export default function OwnerBusinessFormPage() {
  usePageTitle();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { owner } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [tags, setTags] = useState([]); // tag list from the API
  const [selectedTags, setSelectedTags] = useState([]); // category ids
  const [business, setBusiness] = useState(null); // the saved row (null until created)
  const [photos, setPhotos] = useState([]); // saved photos

  // Photos picked but not uploaded yet. Covers are single files; the gallery
  // queue holds the rest (they upload right after the listing is saved).
  const [pendingExplore, setPendingExplore] = useState(null);
  const [pendingFeatured, setPendingFeatured] = useState(null);
  const [pendingGallery, setPendingGallery] = useState([]);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);
  const slotRef = useRef('gallery');

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(() => location.state?.notice || null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(''); // '' | 'Saving…' | 'Uploading photos…'
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    setError(null);
    try {
      const [row, saved] = await Promise.all([getMyBusiness(id), getMyBusinessPhotos(id)]);
      setBusiness(row);
      setPhotos(saved || []);
      setForm({
        name: row.name || '',
        short_description: row.short_description || '',
        description: row.description || '',
        owner_name: row.owner_name || '',
        opening_hours: row.opening_hours || '',
        phone: row.phone || '',
        email: row.email || '',
        address: row.address || '',
        website_url: row.website_url || '',
        google_maps_url: row.google_maps_url || '',
      });
      setSelectedTags(row.tags || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getBusinessTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  // A fresh listing starts from the account: the contact name, email and phone
  // the owner signed up with. Editing never overwrites what they typed.
  useEffect(() => {
    if (isEdit) return;
    setForm((prev) => ({
      ...prev,
      owner_name: prev.owner_name || owner?.full_name || '',
      email: prev.email || owner?.email || '',
      phone: prev.phone || owner?.phone || '',
    }));
  }, [isEdit, owner?.full_name, owner?.email, owner?.phone]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleTag = (categoryId) =>
    setSelectedTags((prev) =>
      prev.includes(categoryId) ? prev.filter((t) => t !== categoryId) : [...prev, categoryId]
    );

  // ── Photo slots ──────────────────────────────────────────────────────────
  const primaryPhoto = photos.find((p) => p.is_primary);
  const featuredPhoto = photos.find((p) => p.is_featured);
  const exploreImg = pendingExplore?.url || primaryPhoto?.photo_url || business?.image_url || '';
  const featuredImg = pendingFeatured?.url || featuredPhoto?.photo_url || exploreImg;

  // "More photos" excludes whatever is serving as a cover.
  const coverUrls = new Set(
    [primaryPhoto?.photo_url, featuredPhoto?.photo_url, business?.image_url].filter(Boolean)
  );
  const galleryPhotos = photos.filter(
    (p) => !p.is_primary && !p.is_featured && !coverUrls.has(p.photo_url)
  );
  const totalPhotos =
    photos.length + (pendingExplore ? 1 : 0) + (pendingFeatured ? 1 : 0) + pendingGallery.length;

  const openPicker = (slot) => {
    slotRef.current = slot;
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFilesChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    const slot = slotRef.current;
    slotRef.current = 'gallery';
    e.target.value = '';
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

    const asPending = (file) => ({ file, url: URL.createObjectURL(file), name: file.name, size: file.size });

    if (slot === 'explore' || slot === 'featured') {
      const entry = asPending(accepted[0]);
      if (slot === 'explore') {
        setPendingExplore((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return entry;
        });
      } else {
        setPendingFeatured((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return entry;
        });
      }
      if (firstError) setImageError(firstError);
      return;
    }

    // Gallery — cap the whole listing at MAX_PHOTOS (covers included).
    const room = MAX_PHOTOS - totalPhotos;
    if (room <= 0) {
      setImageError(`A listing can have at most ${MAX_PHOTOS} photos — remove one first.`);
      return;
    }
    const clipped = accepted.slice(0, room);
    if (clipped.length < accepted.length) {
      firstError = `Only ${room} more photo${room === 1 ? '' : 's'} fit — a listing can have at most ${MAX_PHOTOS}.`;
    }
    if (clipped.length > 0) setPendingGallery((prev) => [...prev, ...clipped.map(asPending)]);
    if (firstError) setImageError(firstError);
  };

  const dropPendingCover = (slot) => {
    const setter = slot === 'explore' ? setPendingExplore : setPendingFeatured;
    setter((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  const dropPendingGallery = (idx) => {
    setPendingGallery((prev) => {
      const removed = prev[idx];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const applyGallery = (result) => {
    setPhotos(result.photos || []);
    setBusiness(result.business);
  };

  // Everything queued has been uploaded (or the save was rejected) — release
  // the object URLs so the chips do not linger as "New".
  const clearPending = () => {
    if (pendingExplore) URL.revokeObjectURL(pendingExplore.url);
    if (pendingFeatured) URL.revokeObjectURL(pendingFeatured.url);
    pendingGallery.forEach((file) => URL.revokeObjectURL(file.url));
    setPendingExplore(null);
    setPendingFeatured(null);
    setPendingGallery([]);
  };

  const handleDeletePhoto = async (photoId) => {
    setImageBusy(true);
    setImageError(null);
    try {
      applyGallery(await deleteBusinessPhoto(id, photoId));
    } catch (err) {
      setImageError(errorMessage(err));
    } finally {
      setImageBusy(false);
    }
  };

  // Promote a saved photo to one of the two cover slots.
  const handleSetCover = async (photoId, role) => {
    setImageBusy(true);
    setImageError(null);
    try {
      applyGallery(await setBusinessPhotoRole(id, photoId, role));
    } catch (err) {
      setImageError(errorMessage(err));
    } finally {
      setImageBusy(false);
    }
  };

  const handleClearAll = async () => {
    setConfirmClear(false);
    if (photos.length === 0 && pendingGallery.length === 0 && !pendingExplore && !pendingFeatured) {
      return;
    }
    setImageBusy(true);
    setImageError(null);
    setPendingGallery((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    setPendingExplore((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setPendingFeatured((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    try {
      for (const photo of [...photos]) {
        applyGallery(await deleteBusinessPhoto(id, photo.photo_id));
      }
    } catch (err) {
      setImageError(errorMessage(err));
    } finally {
      setImageBusy(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.name.trim() || !form.description.trim()) {
      return 'Business name and description are both required.';
    }
    if (form.short_description.trim().length > MAX_SHORT) {
      return `The short description must be ${MAX_SHORT} characters or fewer.`;
    }
    if (form.owner_name.trim().length > 150) {
      return 'The contact name must be 150 characters or fewer.';
    }
    return null;
  };

  // Upload everything still queued locally, oldest cover first (the Explore
  // cover sets the card image, so it must land before the rest are judged).
  const flushPhotos = async (saved) => {
    let current = saved;
    const queue = [];
    if (pendingExplore) queue.push(['explore', pendingExplore.file]);
    if (pendingFeatured) queue.push(['featured', pendingFeatured.file]);
    for (const file of pendingGallery) queue.push(['gallery', file.file]);

    for (const [role, file] of queue) {
      const result = await uploadBusinessPhoto(current.business_id, file, role);
      current = result.business;
      setPhotos(result.photos || []);
      setBusiness(result.business);
    }
    return current;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const payload = { ...form, tags: selectedTags };
    setBusy(true);
    try {
      setPhase(isEdit ? 'Saving…' : 'Creating your listing…');
      const saved = isEdit ? await updateBusiness(id, payload) : await createBusiness(payload);
      setBusiness(saved);

      const hasPending =
        pendingExplore || pendingFeatured || pendingGallery.length > 0;
      if (hasPending) {
        setPhase('Uploading photos…');
        await flushPhotos(saved);
      }

      if (isEdit) {
        clearPending();
        setNotice('Business updated.');
        await load();
      } else {
        clearPending();
        // Swap to the edit route — everything below is a second visit.
        navigate(`/owner/businesses/${saved.business_id}/edit`, {
          replace: true,
          state: {
            notice:
              'Business created — it stays hidden until an admin approves it. Add the rest of your photos below.',
          },
        });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPhase('');
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading business…" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {isEdit ? 'Edit business' : 'Add your listing'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit ? (
              <span className="inline-flex items-center gap-2">
                Changes are saved straight to your listing. <StatusBadge published={business?.published} />
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  1 · Account done
                </span>
                <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  2 · Your listing
                </span>
              </span>
            )}
          </p>
        </div>
        <Link
          to="/owner/businesses"
          className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          ← Back to my businesses
        </Link>
      </header>

      {notice && (
        <p className="rounded-xl bg-brand-light px-3.5 py-2.5 text-sm font-medium text-brand-dark">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <section className="space-y-4">
          <SectionTitle>Listing</SectionTitle>
          <Field
            id="name"
            label="Business name"
            required
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Coastal Vehicle Rentals"
          />
          <Field
            id="short_description"
            label="Short description"
            type="text"
            maxLength={MAX_SHORT}
            value={form.short_description}
            onChange={set('short_description')}
            placeholder="One line for the Explore card — what you offer."
            hint={`${form.short_description.length}/${MAX_SHORT} characters · shown on the card; the full description opens in the popup.`}
          />
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold">
              Description<span className="ml-1 text-brand">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={set('description')}
              placeholder="What do you offer, who is it for, and what should a visitor know?"
              className={`${fieldClass} resize-y`}
            />
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-semibold">
              Category <span className="font-normal text-muted-foreground">(pick all that apply)</span>
            </legend>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No tags available yet — ask an admin to add them.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.category_id);
                  return (
                    <button
                      key={tag.category_id}
                      type="button"
                      onClick={() => toggleTag(tag.category_id)}
                      aria-pressed={active}
                      className={`min-h-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-brand text-white'
                          : 'bg-muted text-muted-foreground hover:bg-brand-light hover:text-brand-dark'
                      }`}
                    >
                      {active ? '✓ ' : ''}
                      {tag.category_name}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        </section>

        <section className="space-y-4">
          <SectionTitle>Owner &amp; contact</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="owner_name"
              label="Owner / contact name"
              type="text"
              value={form.owner_name}
              onChange={set('owner_name')}
              placeholder="Nimal Perera"
              hint="Who visitors should ask for."
            />
            <Field
              id="opening_hours"
              label="Opening hours"
              type="text"
              value={form.opening_hours}
              onChange={set('opening_hours')}
              placeholder="08:00 - 20:00"
            />
            <Field
              id="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+94 77 000 0000"
            />
            <Field
              id="email"
              label="Contact email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="hello@example.com"
            />
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle>Location</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="address"
              label="Address"
              type="text"
              value={form.address}
              onChange={set('address')}
              placeholder="Galle Road, Wadduwa"
            />
            <Field
              id="website_url"
              label="Website"
              type="url"
              value={form.website_url}
              onChange={set('website_url')}
              placeholder="https://example.com"
            />
            <div className="sm:col-span-2">
              <Field
                id="google_maps_url"
                label="Google Maps link"
                type="url"
                value={form.google_maps_url}
                onChange={set('google_maps_url')}
                placeholder="https://www.google.com/maps/…"
                hint="Visitors use this to find you."
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/owner/businesses')}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={busy}>
            {phase || (isEdit ? 'Save changes' : 'Create listing')}
          </Button>
        </div>
      </form>

      {/* ── Photos ──────────────────────────────────────────────────────── */}
      <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
          <SectionTitle>Photos</SectionTitle>
          <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand">
            {totalPhotos}/{MAX_PHOTOS}
          </span>
        </div>

        {!business?.business_id && (
          <p className="rounded-xl bg-muted/60 px-3.5 py-2.5 text-xs font-medium text-muted-foreground">
            Create the listing first and the photos below are uploaded with it — nothing is lost if you
            pick them now.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 1. Explore card cover */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Explore card cover</p>
              <span className="text-[11px] font-medium text-brand">Shown on the card</span>
            </div>
            <div className="mt-1.5">
              {exploreImg ? (
                <figure className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                  <img src={exploreImg} alt="" className="h-full w-full object-cover" />
                  <figcaption className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    {pendingExplore ? 'New cover' : 'Explore card cover'}
                  </figcaption>
                  <div className="absolute inset-x-0 bottom-0 flex items-stretch bg-black/55 text-[11px] font-semibold text-white">
                    <button type="button" onClick={() => openPicker('explore')} className="flex-1 py-1 hover:bg-white/25">
                      Change photo
                    </button>
                    {pendingExplore && (
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
                  onClick={() => openPicker('explore')}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand/50 bg-brand/[0.07] text-brand transition-colors hover:border-brand hover:bg-brand/15"
                >
                  <span className="text-2xl leading-none">＋</span>
                  <span className="text-xs font-semibold">Add Explore card cover</span>
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              The photo on your card across the Explore page.
            </p>
          </div>

          {/* 2. Feature card cover */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Feature card cover</p>
              <span className="text-[11px] font-medium text-muted-foreground">Optional</span>
            </div>
            <div className="mt-1.5">
              {featuredImg ? (
                <figure className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                  <img src={featuredImg} alt="" className="h-full w-full object-cover" />
                  <figcaption className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    {pendingFeatured ? 'New cover' : featuredPhoto ? 'Feature card cover' : 'From Explore cover'}
                  </figcaption>
                  <div className="absolute inset-x-0 bottom-0 flex items-stretch bg-black/55 text-[11px] font-semibold text-white">
                    <button type="button" onClick={() => openPicker('featured')} className="flex-1 py-1 hover:bg-white/25">
                      {pendingFeatured || featuredPhoto ? 'Change photo' : 'Upload custom cover'}
                    </button>
                    {pendingFeatured && (
                      <button
                        type="button"
                        onClick={() => dropPendingCover('featured')}
                        className="border-l border-white/25 px-2 text-red-300 hover:bg-white/25"
                      >
                        Cancel
                      </button>
                    )}
                    {!pendingFeatured && featuredPhoto && business?.business_id && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(featuredPhoto.photo_id, 'gallery')}
                        title="Revert to the Explore card cover"
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
                  onClick={() => openPicker('featured')}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand/50 bg-brand/[0.07] text-brand transition-colors hover:border-brand hover:bg-brand/15"
                >
                  <span className="text-2xl leading-none">＋</span>
                  <span className="text-xs font-semibold">Add feature card cover</span>
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              A second cover for featuring your listing; falls back to the Explore cover.
            </p>
          </div>
        </div>

        {/* 3. More photos */}
        <div className="border-t border-border pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">More photos</p>
              <p className="text-xs text-muted-foreground">
                Extra photos in your listing&apos;s gallery — covers are kept separate above.
              </p>
            </div>
            {totalPhotos > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={imageBusy || busy}
                className="rounded-full border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Remove all photos
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryPhotos.map((photo) => (
              <figure
                key={photo.photo_id}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
              >
                <img src={photo.photo_url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleSetCover(photo.photo_id, 'explore')}
                  disabled={imageBusy}
                  className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[11px] font-semibold text-white hover:bg-black/75 disabled:opacity-50"
                >
                  Use as card cover
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.photo_id)}
                  disabled={imageBusy}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-black/80 disabled:opacity-50"
                >
                  ✕
                </button>
              </figure>
            ))}

            {pendingGallery.map((file, idx) => (
              <figure
                key={`${file.name}-${idx}`}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-brand/60 bg-muted"
              >
                <img src={file.url} alt="" className="h-full w-full object-cover" />
                <span
                  title={`${file.name} · ${formatBytes(file.size)}`}
                  className="absolute left-1.5 top-1.5 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-bold text-white"
                >
                  New
                </span>
                <button
                  type="button"
                  onClick={() => dropPendingGallery(idx)}
                  className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[11px] font-semibold text-white hover:bg-black/75"
                >
                  Remove
                </button>
              </figure>
            ))}

            {totalPhotos < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => openPicker('gallery')}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand/50 bg-brand/[0.07] text-brand transition-colors hover:border-brand hover:bg-brand/15"
              >
                <span className="text-2xl leading-none">＋</span>
                <span className="text-xs font-semibold">Add photo</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            aria-label="Add photos"
            accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFilesChange}
            className="hidden"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Up to {MAX_PHOTOS} photos per listing · {ALLOWED_IMAGE_LABEL} · max 5 MB each.
          </p>
          {imageError && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {imageError}
            </p>
          )}
        </div>
      </section>

      {!isEdit && (
        <p className="rounded-xl bg-muted/60 px-3.5 py-2.5 text-xs font-medium text-muted-foreground">
          Your listing starts as <span className="font-bold text-foreground">Pending</span> and appears
          on Explore once an admin approves it.
        </p>
      )}

      <Modal open={confirmClear} title="Remove all photos?" onClose={() => setConfirmClear(false)}>
        <p className="text-sm text-muted-foreground">
          This deletes every photo of{' '}
          <span className="font-semibold text-foreground">{business?.name || 'this listing'}</span>,
          including the Explore card cover and the feature card cover. It cannot be undone — you can
          upload replacements afterwards.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearAll} disabled={imageBusy}>
            {imageBusy ? 'Removing…' : 'Remove all'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
