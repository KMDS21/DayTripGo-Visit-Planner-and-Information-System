// HomePage — place listing with category filter (SRS FR-1…FR-4) plus the
// featured-places carousel and hero (plan §14.3 Step 17, T-4.1…T-4.3).

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlaces } from '../hooks/usePlaces';
import { useVisitPlan } from '../hooks/useVisitPlan';
import CategoryFilter from '../components/PlaceListing/CategoryFilter';
import FeaturedCarousel from '../components/PlaceListing/FeaturedCarousel';
import PlaceGrid from '../components/PlaceListing/PlaceGrid';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';

export default function HomePage() {
  const { places, categories, activeCategory, loading, error, selectCategory, refresh } = usePlaces();
  const { addPlace, hasPlace } = useVisitPlan();
  const [flash, setFlash] = useState(null);
  const { hash } = useLocation();

  // Explore → /#places scrolls to the listing (re-runs after data loads so the
  // final grid position is respected).
  useEffect(() => {
    if (hash === '#places') {
      document.getElementById('places')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hash, loading]);

  const handleAdd = async (place) => {
    const added = await addPlace(place);
    setFlash(added ? `${place.name} added to your plan` : `${place.name} is already in your plan`);
    setTimeout(() => setFlash(null), 2500);
  };

  return (
    <div className="space-y-14 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-brand-dark via-brand to-teal-500 px-6 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl">
            One perfect day around Wadduwa
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Discover verified places of interest within 25 km of Wadduwa, Sri Lanka — temples, gardens, waterfalls
            and beaches — and build a simple one-day visit plan.
          </p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10" />
      </section>

      {/* Featured carousel (Aceternity Apple Cards) */}
      <section className="w-full">
        <h2 className="mb-2 px-2 font-heading text-2xl font-bold sm:text-3xl">Featured escapes</h2>
        <p className="mb-4 px-2 text-muted-foreground">A taste of each category — tap a card for the full story.</p>
        <FeaturedCarousel places={places} categories={categories} />
      </section>

      {/* Listing + filter */}
      <section id="places" className="w-full">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">All places</h2>
          <CategoryFilter categories={categories} activeCategory={activeCategory} onSelect={selectCategory} />
        </div>

        {loading && <Loader label="Loading places…" />}
        {!loading && error && <ErrorMessage message={error} onRetry={refresh} />}
        {!loading && !error && (
          <PlaceGrid places={places} categories={categories} hasPlace={hasPlace} onAdd={handleAdd} />
        )}
      </section>

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
