// ExplorePage — full public place listing as its own page (SRS FR-1 list,
// FR-2 filter one category at a time, FR-3 clear filter) with the detail
// popup. The home page shows the same listing (cards + selector) inline.

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlaces } from '../hooks/usePlaces';
import { useVisitPlan } from '../hooks/useVisitPlan';
import usePageTitle from '../hooks/usePageTitle';
import usePageContent from '../hooks/usePageContent';
import CategoryFilter from '../components/PlaceListing/CategoryFilter';
import PlaceGrid from '../components/PlaceListing/PlaceGrid';
import PlacePreviewModal from '../components/PlaceListing/PlacePreviewModal';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';

export default function ExplorePage() {
  usePageTitle();
  const { get } = usePageContent('explore', {
    hero_title: 'Explore places',
    hero_subtitle:
      'Every verified spot within 25 km of Wadduwa in one place. Filter by category, check opening times, and add your favourites straight to the day plan.',
  });
  // Fallback or admin-chosen cover photo
  const cover = get('hero_cover') || get('explore_cover');
  const { places, categories, activeCategory, loading, error, selectCategory, refresh } = usePlaces();
  const { addPlace, hasPlace } = useVisitPlan();
  const [flash, setFlash] = useState(null);
  // Clicked place → detail popup (blurred backdrop) instead of a page change.
  // A card tapped on the home page's "All places" grid hands its place id over
  // through the router state, so that place's popup opens as soon as this page
  // has loaded: the id is kept in state and the place itself is looked up from
  // the listing (which arrives a moment later). The router state is dropped
  // straight away so a reload or a back/forward step doesn't reopen it.
  const location = useLocation();
  const navigate = useNavigate();
  const [previewId, setPreviewId] = useState(() => Number(location.state?.previewPlaceId) || null);
  const preview = previewId === null ? null : places.find((p) => p.place_id === previewId) || null;

  useEffect(() => {
    if (previewId !== null) navigate('.', { replace: true, state: null });
  }, [previewId, navigate]);

  const handleAdd = async (place) => {
    const added = await addPlace(place);
    setFlash(added ? `${place.name} added to your plan` : `${place.name} is already in your plan`);
    setTimeout(() => setFlash(null), 2500);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero — the bundled Explore page cover under a light green wash so the
          photo stays visible; the admin-chosen cover from the content editor is
          only used if that file ever fails to load, so the banner is never bare. */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-slate-900 px-4 py-12 text-white sm:px-6 sm:py-16">
        <img
          src={cover || '/explore%20page%20page%20cover.jpg'}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            const el = event.currentTarget;
            if (!cover || el.dataset.fallback === '1') return; // never loop
            el.dataset.fallback = '1';
            el.src = cover;
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/45 to-slate-900/75"
        />
        <div className="relative mx-auto max-w-3xl text-center [text-shadow:0_1px_16px_rgba(0,0,0,0.45)]">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">{get('hero_title')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            {get('hero_subtitle')}
          </p>
        </div>
      </section>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">
          {loading
            ? 'Loading places…'
            : `${places.length} ${places.length === 1 ? 'place' : 'places'}`}
        </p>
        <CategoryFilter categories={categories} activeCategory={activeCategory} onSelect={selectCategory} />
      </div>

      {/* Listing */}
      {loading && <Loader label="Loading places…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={refresh} />}
      {!loading && !error && (
        <PlaceGrid
          places={places}
          categories={categories}
          hasPlace={hasPlace}
          onAdd={handleAdd}
          onOpen={(place) => setPreviewId(place.place_id)}
        />
      )}

      {/* Place detail popup (blur backdrop) — only mounted while open; rendered
          before the flash so the "added to plan" toast stays above it. */}
      {preview && (
        <PlacePreviewModal
          place={preview}
          categoryName={categories.find((c) => c.category_id === preview.category_id)?.category_name || ''}
          inPlan={hasPlace(preview.place_id)}
          onAdd={handleAdd}
          onClose={() => setPreviewId(null)}
        />
      )}

      {/* Add-to-plan confirmation flash (max-width keeps long names on-screen) */}
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
