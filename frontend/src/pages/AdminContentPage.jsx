// AdminContentPage — /admin/pages/:page
// Separate editor per public page (Home / Explore / My Day Plan / Contact us).
// Each text field is saved to `page_content` and shown on the public page with
// a built-in fallback, so nothing breaks when a field is left empty.
//
// Beyond the text fields:
//  - Home gets a "Featured escapes" section: pick which places the home-page
//    carousel shows (in order) and the cover image of each card.
//  - Explore gets a "Cover photo" section: pick any image uploaded on the
//    Places page as the banner photo behind the Explore hero.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPageContent, savePageContent } from '../services/contentService';
import { getPlaces } from '../services/placeService';
import { errorMessage } from '../services/api';
import { parseFeaturedRows, serializeFeaturedRows } from '../utils/featuredConfig';
import usePageTitle from '../hooks/usePageTitle';
import Button from '../components/Common/Button';
import Loader from '../components/Common/Loader';

// Editable text fields per page — "Heroes + key texts" scope agreed for this pass.
const PAGE_CONFIG = {
  home: {
    title: 'Home page',
    intro: 'Hero banner, the intro sections and the Featured escapes carousel of the home page.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text', hint: 'Shown over the green gradient at the top.' },
      { key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
      { key: 'why_title', label: '"Why DayTripGO" heading', type: 'text' },
      { key: 'why_body', label: '"Why DayTripGO" text', type: 'textarea' },
      { key: 'how_title', label: '"How DayTripGO works" heading', type: 'text' },
      { key: 'how_body', label: '"How DayTripGO works" text', type: 'textarea' },
    ],
  },
  explore: {
    title: 'Explore page',
    intro: 'The banner visitors see above the place grid.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text' },
      { key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
    ],
  },
  plan: {
    title: 'My Day Plan page',
    intro: 'The banner at the top of the visit-plan screen.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text' },
      { key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
    ],
  },
  contact: {
    title: 'Contact us page',
    intro: 'Banner text and the company details card on the right.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text' },
      { key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'hours', label: 'Opening hours', type: 'text' },
    ],
  },
};

// The carousel shows at most 12 cards (FeaturedCarousel cap).
const MAX_FEATURED = 12;

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 sm:text-sm';

export default function AdminContentPage() {
  usePageTitle();
  const { page } = useParams();
  const config = PAGE_CONFIG[page];

  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Places + their uploaded images feed the Featured escapes and cover pickers.
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const needsPlaces = page === 'home' || page === 'explore';

  useEffect(() => {
    let alive = true;
    if (!config) {
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    setError(null);
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
    if (!needsPlaces) return () => {};
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
  }, [needsPlaces]);

  // Unique uploaded images (every place photo doubles as a possible cover).
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

  const placeById = useMemo(() => {
    const map = new Map();
    for (const place of places) map.set(place.place_id, place);
    return map;
  }, [places]);

  // The featured selection lives in `values` as the two text sections and is
  // parsed into rows for the UI, so there is a single source of truth.
  const featuredRows = useMemo(
    () => (page === 'home' ? parseFeaturedRows(values.featured_place_ids, values.featured_covers) : []),
    [page, values.featured_place_ids, values.featured_covers]
  );

  const setFeaturedRows = (rows) => {
    setValues((prev) => ({ ...prev, ...serializeFeaturedRows(rows) }));
    setSaved(false);
  };

  const addFeatured = () => {
    const used = new Set(featuredRows.map((row) => row.id));
    const next = places.find((place) => !used.has(place.place_id));
    if (!next) return;
    setFeaturedRows([...featuredRows, { id: next.place_id, cover: '' }]);
  };

  const changeFeaturedPlace = (index, placeId) => {
    // A new place starts with its own photo as the cover.
    setFeaturedRows(featuredRows.map((row, i) => (i === index ? { id: Number(placeId), cover: '' } : row)));
  };

  const changeFeaturedCover = (index, cover) => {
    setFeaturedRows(featuredRows.map((row, i) => (i === index ? { ...row, cover } : row)));
  };

  const removeFeatured = (index) => {
    setFeaturedRows(featuredRows.filter((_, i) => i !== index));
  };

  const setExploreCover = (cover) => {
    setValues((prev) => ({ ...prev, explore_cover: cover }));
    setSaved(false);
  };

  if (!config) {
    return (
      <div className="py-16 text-center">
        <p className="text-2xl font-bold">Unknown page</p>
        <p className="mt-2 text-sm text-muted-foreground">No editor exists for "{page}".</p>
      </div>
    );
  }

  const handleChange = (key) => (e) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const sections = {};
      for (const field of config.fields) {
        sections[field.key] = typeof values[field.key] === 'string' ? values[field.key] : '';
      }
      if (page === 'home') Object.assign(sections, serializeFeaturedRows(featuredRows));
      if (page === 'explore') sections.explore_cover = typeof values.explore_cover === 'string' ? values.explore_cover : '';
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
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          {/* Text fields */}
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {config.fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-semibold" htmlFor={`c-${field.key}`}>
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`c-${field.key}`}
                    rows={3}
                    className={inputClass}
                    value={values[field.key] || ''}
                    onChange={handleChange(field.key)}
                  />
                ) : (
                  <input
                    id={`c-${field.key}`}
                    className={inputClass}
                    value={values[field.key] || ''}
                    onChange={handleChange(field.key)}
                  />
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {field.hint || 'Leave empty to keep the built-in wording.'}
                </p>
              </div>
            ))}
          </div>

          {/* Featured escapes picker (home only) */}
          {page === 'home' && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold">Featured escapes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose which places the Featured escapes carousel on the home page shows, in order, and the cover
                image of each card.{' '}
                {featuredRows.length === 0 &&
                  'Nothing selected yet, so the home page shows the first place of each category.'}
              </p>

              {placesLoading && <Loader label="Loading places…" />}

              {!placesLoading && (
                <>
                  <div className="mt-4 space-y-3">
                    {featuredRows.map((row, index) => {
                      const place = placeById.get(row.id);
                      const effective = row.cover || place?.image_url || '';
                      return (
                        <div
                          key={`${row.id}-${index}`}
                          className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3"
                        >
                          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            {effective ? (
                              <img src={effective} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                No photo
                              </span>
                            )}
                          </div>
                          <select
                            className={`${inputClass} min-w-40 flex-1`}
                            value={row.id}
                            onChange={(e) => changeFeaturedPlace(index, e.target.value)}
                            aria-label="Featured place"
                          >
                            {places.map((p) => {
                              const usedElsewhere = featuredRows.some((r, i) => i !== index && r.id === p.place_id);
                              return (
                                <option key={p.place_id} value={p.place_id} disabled={usedElsewhere}>
                                  {p.name}
                                  {usedElsewhere ? ' (already featured)' : ''}
                                </option>
                              );
                            })}
                          </select>
                          <select
                            className={`${inputClass} min-w-40 flex-1`}
                            value={row.cover}
                            onChange={(e) => changeFeaturedCover(index, e.target.value)}
                            aria-label="Card cover photo"
                          >
                            <option value="">{place?.image_url ? "Place's own photo" : 'No photo yet'}</option>
                            {images.map((img) => (
                              <option key={img.src} value={img.src}>
                                {img.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeatured(index)}
                            aria-label={`Remove ${place?.name || 'featured place'}`}
                          >
                            ✕
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFeatured}
                      disabled={featuredRows.length >= MAX_FEATURED || places.length === 0}
                    >
                      ＋ Add featured place
                    </Button>
                    {featuredRows.length >= MAX_FEATURED && (
                      <span className="text-xs text-muted-foreground">Maximum {MAX_FEATURED} cards.</span>
                    )}
                    {places.length === 0 && (
                      <span className="text-xs text-muted-foreground">Add places first on the Attractive Places page.</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Explore cover photo picker */}
          {page === 'explore' && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold">Cover photo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick the photo shown behind the Explore page banner. Any image uploaded on the Attractive Places page can be
                used.
              </p>

              {placesLoading && <Loader label="Loading images…" />}

              {!placesLoading && (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setExploreCover('')}
                      className={`flex aspect-video items-center justify-center overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-brand-dark via-brand to-teal-500 text-xs font-semibold text-white transition-colors ${
                        values.explore_cover ? 'border-border opacity-70 hover:opacity-100' : 'border-brand ring-2 ring-brand/40'
                      }`}
                    >
                      Default
                    </button>
                    {images.map((img) => {
                      const selected = values.explore_cover === img.src;
                      return (
                        <button
                          type="button"
                          key={img.src}
                          onClick={() => setExploreCover(img.src)}
                          title={img.label}
                          aria-label={img.label}
                          aria-pressed={selected}
                          className={`aspect-video overflow-hidden rounded-2xl border-2 transition-colors ${
                            selected ? 'border-brand ring-2 ring-brand/40' : 'border-border hover:border-brand/50'
                          }`}
                        >
                          <img src={img.src} alt="" className="h-full w-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                  {images.length === 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      No uploaded images yet. Add a photo to a place on the Attractive Places page first.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Save feedback */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
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
            <div className={error || saved ? 'pt-4' : ''}>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
