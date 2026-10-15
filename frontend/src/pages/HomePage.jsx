// HomePage — place listing with category filter (SRS FR-1…FR-4) plus the
// featured-places carousel and hero (plan §14.3 Step 17, T-4.1…T-4.3).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlaces } from '../hooks/usePlaces';
import { useVisitPlan } from '../hooks/useVisitPlan';
import FeaturedCarousel from '../components/PlaceListing/FeaturedCarousel';
import PlaceCard from '../components/PlaceListing/PlaceCard';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';

export default function HomePage() {
  const { places, categories, loading, error, refresh } = usePlaces();
  const { addPlace, hasPlace } = useVisitPlan();
  const [flash, setFlash] = useState(null);
  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name;

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
          {/* Highlight chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-sm font-semibold">
            {['10 verified places', '4 categories', 'No account needed', 'Free to use'].map((chip) => (
              <span key={chip} className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur">
                ✓ {chip}
              </span>
            ))}
          </div>
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

      {/* How it works — centred block before the preview band */}
      <section className="w-full">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">How DayTripGO works</h2>
          <p className="mt-2 text-muted-foreground">
            Three steps from landing on this page to standing in front of something worth the trip.
          </p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: 'Browse verified places',
              text: 'Temples, beaches, gardens and heritage sites within 25 km of Wadduwa — each one checked by our team before it is listed.',
            },
            {
              title: 'Filter and compare',
              text: 'Narrow the list by category, see opening hours and distances up front, and pick what fits into a single day.',
            },
            {
              title: 'Build your one-day plan',
              text: 'Add favourites to your plan, reorder them, and keep the whole itinerary in one place — no sign-up, no payment.',
            },
          ].map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand font-heading text-lg font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-heading text-lg font-bold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview band — a few favourites on a tinted background; the full
          listing lives on the Explore page */}
      <section id="places" className="relative w-full overflow-hidden rounded-[2rem] bg-brand-light/50 px-6 py-10 sm:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand/10" />

        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">All places</h2>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              A taste of what is out there — open Explore for the full list, category
              filters, opening hours and distances.
            </p>
          </div>
          <Link
            to="/explore"
            className="group inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Explore all places
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {loading && <Loader label="Loading places…" />}
        {!loading && error && <ErrorMessage message={error} onRetry={refresh} />}
        {!loading && !error && (
          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {places.slice(0, 4).map((place) => (
              <PlaceCard
                key={place.place_id}
                place={place}
                categoryName={categoryName(place.category_id)}
                inPlan={hasPlace(place.place_id)}
                onAdd={handleAdd}
              />
            ))}
          </div>
        )}
      </section>

      {/* Why DayTripGO — close with a clear idea of the service */}
      <section className="w-full">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">Why DayTripGO</h2>
          <p className="mt-2 text-muted-foreground">
            Travel blogs list everything; we list what is worth your day — and tell you when
            to go.
          </p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: 'Opening times checked',
              text: 'Every listing carries real opening hours and an "open now" hint, so you never travel to a closed gate.',
            },
            {
              title: 'Distances up front',
              text: 'Distances from Wadduwa town are shown on every card — you always know how far the trip is before you tap.',
            },
            {
              title: 'Planning only',
              text: 'DayTripGO helps you decide and organise. No bookings, no payments, no accounts — just a clear one-day plan.',
            },
          ].map((point) => (
            <div key={point.title} className="rounded-2xl bg-muted/40 p-6 text-center">
              <h3 className="font-heading text-base font-bold text-brand-dark">{point.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
            </div>
          ))}
        </div>
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
