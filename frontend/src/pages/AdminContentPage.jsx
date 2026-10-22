// AdminContentPage — /admin/pages/:page
// Streamlined page editor focused strictly on:
//  1. Page cover media (live preview, custom photo upload, gallery picker, or default)
//  2. Hero title
//  3. Hero description (subtitle)
//  4. Company details (for Contact us page only)
// All fields and the Save changes button are placed inside a single unified card box.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Image as ImageIcon, RotateCcw, Check } from 'lucide-react';
import { getPageContent, savePageContent, uploadPageCover } from '../services/contentService';
import { getPlaces } from '../services/placeService';
import { errorMessage } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import Loader from '../components/Common/Loader';

const PAGE_CONFIG = {
  home: {
    title: 'Home page',
    intro: 'Update the hero cover media, title, and description for the home page.',
    defaultCover: '/Home%20page%20cover.mp4',
    titlePlaceholder: 'One perfect day around Wadduwa',
    subtitlePlaceholder: 'Discover verified places of interest within 25 km of Wadduwa, Sri Lanka...',
  },
  explore: {
    title: 'Explore page',
    intro: 'Update the hero banner photo, title, and description for the Explore page.',
    defaultCover: '/explore%20page%20page%20cover.jpg',
    titlePlaceholder: 'Explore places',
    subtitlePlaceholder: 'Every verified spot within 25 km of Wadduwa in one place...',
  },
  plan: {
    title: 'My Day Plan page',
    intro: 'Update the hero cover media, title, and description for the visit-plan screen.',
    defaultCover: '/My%20day%20plan%20page%20cover.mp4',
    titlePlaceholder: 'My one-day plan',
    subtitlePlaceholder: 'Your plan is kept for this browser session only, with no account...',
  },
  contact: {
    title: 'Contact us page',
    intro: 'Update the hero cover photo, title, description, and company contact details.',
    defaultCover: '/Contact%20us%20page%20page%20cover.webp',
    titlePlaceholder: 'Get in touch',
    subtitlePlaceholder: 'Questions about Wadduwa or DayTripGO? We are here to help.',
    companyFields: [
      { key: 'address', label: 'Company address', placeholder: 'Galle Road, Wadduwa, Sri Lanka' },
      { key: 'email', label: 'Email address', placeholder: 'hello@daytripgo.lk' },
      { key: 'phone', label: 'Phone number', placeholder: '+94 11 234 5678' },
      { key: 'hours', label: 'Opening hours', placeholder: 'Mon – Sat · 9:00 – 18:00' },
    ],
  },
};

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 sm:text-sm';

export default function AdminContentPage() {
  usePageTitle();
  const { page } = useParams();
  const config = PAGE_CONFIG[page];

  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const fileInputRef = useRef(null);

  // Places images for the gallery picker
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!config) {
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    setError(null);
    setSaved(false);
    setShowGallery(false);

    getPageContent(page)
      .then((data) => {
        if (alive) setValues(data || {});
      })
      .catch((err) => {
        if (alive) setError(errorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, config]);

  useEffect(() => {
    let alive = true;
    setPlacesLoading(true);
    getPlaces({ scope: 'admin' })
      .then((data) => {
        if (alive) setPlaces(data || []);
      })
      .catch(() => {
        if (alive) setPlaces([]);
      })
      .finally(() => {
        if (alive) setPlacesLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Distinct place images available as covers
  const images = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const place of places) {
      if (place.image_url && !seen.has(place.image_url)) {
        seen.add(place.image_url);
        list.push({ src: place.image_url, label: `${place.name} photo` });
      }
    }
    return list;
  }, [places]);

  if (!config) {
    return (
      <div className="py-16 text-center">
        <p className="text-2xl font-bold">Unknown page</p>
        <p className="mt-2 text-sm text-muted-foreground">No editor exists for "{page}".</p>
      </div>
    );
  }

  const currentCover = values.hero_cover || (page === 'explore' ? values.explore_cover : '') || '';
  const effectiveCover = currentCover || config.defaultCover;
  const isVideo = effectiveCover && (effectiveCover.endsWith('.mp4') || effectiveCover.endsWith('.webm'));

  const handleChange = (key) => (e) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSelectCover = (url) => {
    setValues((prev) => ({
      ...prev,
      hero_cover: url,
      ...(page === 'explore' ? { explore_cover: url } : {}),
    }));
    setSaved(false);
  };

  const handleResetCover = () => {
    setValues((prev) => ({
      ...prev,
      hero_cover: '',
      ...(page === 'explore' ? { explore_cover: '' } : {}),
    }));
    setSaved(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploadedUrl = await uploadPageCover(page, file);
      handleSelectCover(uploadedUrl);
    } catch (err) {
      setError(`Cover upload failed: ${errorMessage(err)}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const sections = {
        hero_title: typeof values.hero_title === 'string' ? values.hero_title : '',
        hero_subtitle: typeof values.hero_subtitle === 'string' ? values.hero_subtitle : '',
        hero_cover: typeof values.hero_cover === 'string' ? values.hero_cover : '',
      };
      if (page === 'explore') {
        sections.explore_cover = sections.hero_cover;
      }
      if (page === 'contact' && config.companyFields) {
        for (const field of config.companyFields) {
          sections[field.key] = typeof values[field.key] === 'string' ? values[field.key] : '';
        }
      }
      const data = await savePageContent(page, sections);
      setValues(data);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-10">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">{config.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.intro}</p>
      </header>

      {loading && <Loader label="Loading content…" />}

      {!loading && (
        <form onSubmit={handleSave} className="max-w-3xl">
          {/* Single Box: Cover + Title + Description (+ Company details for contact) + Save button */}
          <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            
            {/* ── Page Hero Cover Section ────────────────────────────────
                Hidden on the Explore page: that banner always renders the
                bundled `explore page page cover.jpg`, so a picker here would
                offer a control the site no longer reads. */}
            {page !== 'explore' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Hero cover</label>
                {currentCover ? (
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                    Custom cover
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Default bundled cover
                  </span>
                )}
              </div>

              {/* Cover Media Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-inner">
                {isVideo ? (
                  <video
                    key={effectiveCover}
                    src={effectiveCover}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={effectiveCover}
                    alt="Current cover preview"
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-xs text-white/90 truncate [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                  {currentCover ? currentCover : 'Default bundled cover'}
                </div>
              </div>

              {/* Cover Action Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading photo…' : 'Upload photo'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGallery((prev) => !prev)}
                  className="flex items-center gap-1.5"
                >
                  <ImageIcon className="h-4 w-4" />
                  {showGallery ? 'Hide place photos' : 'Choose from place photos'}
                </Button>

                {currentCover && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetCover}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to default
                  </Button>
                )}
              </div>

              {/* Expandable Place Photos Gallery */}
              {showGallery && (
                <div className="mt-3 rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Tap any photo to set it as this page's hero cover:
                  </p>
                  {placesLoading ? (
                    <Loader label="Loading place images…" />
                  ) : images.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No uploaded place photos found.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 max-h-60 overflow-y-auto p-1">
                      {images.map((img) => {
                        const isSelected = currentCover === img.src;
                        return (
                          <button
                            key={img.src}
                            type="button"
                            onClick={() => handleSelectCover(img.src)}
                            className={`group relative aspect-video overflow-hidden rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-brand ring-2 ring-brand/40 scale-[1.02]'
                                : 'border-border hover:border-brand/50'
                            }`}
                            title={img.label}
                          >
                            <img src={img.src} alt="" className="h-full w-full object-cover" />
                            {isSelected && (
                              <span className="absolute inset-0 flex items-center justify-center bg-brand/30 text-white">
                                <Check className="h-5 w-5 drop-shadow" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            <hr className="border-border" />

            {/* ── Hero Title ────────────────────────────────────────────── */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="hero-title">
                Hero title
              </label>
              <input
                id="hero-title"
                className={inputClass}
                value={values.hero_title || ''}
                onChange={handleChange('hero_title')}
                placeholder={config.titlePlaceholder}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty to keep the default title.
              </p>
            </div>

            {/* ── Hero Description ──────────────────────────────────────── */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="hero-desc">
                Hero description
              </label>
              <textarea
                id="hero-desc"
                rows={3}
                className={inputClass}
                value={values.hero_subtitle || ''}
                onChange={handleChange('hero_subtitle')}
                placeholder={config.subtitlePlaceholder}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty to keep the default description.
              </p>
            </div>

            {/* ── Company Details (Contact us page only) ─────────────────── */}
            {page === 'contact' && config.companyFields && (
              <>
                <hr className="border-border" />
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold">Company details</h2>
                    <p className="text-xs text-muted-foreground">
                      Contact information shown on the right side of the Contact Us page.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {config.companyFields.map((field) => (
                      <div key={field.key}>
                        <label className="mb-1.5 block text-sm font-semibold" htmlFor={`contact-${field.key}`}>
                          {field.label}
                        </label>
                        <input
                          id={`contact-${field.key}`}
                          className={inputClass}
                          value={values[field.key] || ''}
                          onChange={handleChange(field.key)}
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Save Feedback & Button (Inside the SAME box) ─────────── */}
            <div className="pt-2 border-t border-border space-y-3">
              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
              {saved && (
                <p role="status" className="rounded-xl bg-emerald-100 px-3.5 py-2.5 text-sm font-medium text-emerald-800">
                  Saved. The public page updates immediately.
                </p>
              )}
              <div className="flex items-center justify-between pt-1">
                <Button type="submit" disabled={saving || uploading}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
                {saved && (
                  <span className="text-xs text-muted-foreground">
                    All changes successfully saved
                  </span>
                )}
              </div>
            </div>

          </div>
        </form>
      )}
    </div>
  );
}
