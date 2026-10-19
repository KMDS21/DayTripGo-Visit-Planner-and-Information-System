// ExplorePage — full public place listing as its own page (SRS FR-1 list,
// FR-2 filter one category at a time, FR-3 clear filter). The home page only
// previews a few places and links here.

import { useState } from 'react';
import { usePlaces } from '../hooks/usePlaces';
import { useVisitPlan } from '../hooks/useVisitPlan';
import usePageTitle from '../hooks/usePageTitle';
import CategoryFilter from '../components/PlaceListing/CategoryFilter';
import PlaceGrid from '../components/PlaceListing/PlaceGrid';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';

export default function ExplorePage() {
  usePageTitle();
  const { places, categories, activeCategory, loading, error, selectCategory, refresh } = usePlaces();
  const { addPlace, hasPlace } = useVisitPlan();
  const [flash, setFlash] = useState(null);

  const handleAdd = async (place) => {
    const added = await addPlace(place);
    setFlash(added ? `${place.name} added to your plan` : `${place.name} is already in your plan`);
    setTimeout(() => setFlash(null), 2500);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-brand-dark via-brand to-teal-500 px-6 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">Explore places</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Every verified spot within 25 km of Wadduwa in one place. Filter by category,
            check opening times, and add your favourites straight to the day plan.
          </p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10" />
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
        <PlaceGrid places={places} categories={categories} hasPlace={hasPlace} onAdd={handleAdd} />
      )}

      {/* Add-to-plan confirmation flash */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        {flash && (
          <p className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-lg">
            {flash}
          </p>
        )}
      </div>
    </div>
  );
}
