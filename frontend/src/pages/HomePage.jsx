// HomePage — hero, why/how sections, the Featured escapes carousel and the
// full "All places" listing: the same cards and category selector as the
// Explore page (published places from the Attractive Places table).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlaces } from '../hooks/usePlaces';
import { useVisitPlan } from '../hooks/useVisitPlan';
import usePageTitle from '../hooks/usePageTitle';
import usePageContent from '../hooks/usePageContent';
import FeaturedCarousel from '../components/PlaceListing/FeaturedCarousel';
import PlaceGrid from '../components/PlaceListing/PlaceGrid';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';
import { parseFeaturedRows } from '../utils/featuredConfig';

export default function HomePage() {
  usePageTitle();
  const { get, sections } = usePageContent('home', {
    hero_title: 'One perfect day around Wadduwa',
    hero_subtitle:
      'Discover verified places of interest within 25 km of Wadduwa, Sri Lanka, such as temples, gardens, waterfalls and beaches, and build a simple one-day visit plan.',
    why_title: 'Why DayTripGO',
    why_body: 'Travel blogs list everything; we list what is worth your day, and tell you when to go.',
    how_title: 'How DayTripGO works',
    how_body: 'Three steps from landing on this page to standing in front of something worth the trip.',
  });
  const { places, categories, loading, error, refresh } = usePlaces();
  const { addPlace, hasPlace } = useVisitPlan();
  const [flash, setFlash] = useState(null);
  const navigate = useNavigate();

  // Only the places the admin ticked "Show on home" for (Attractive Places
  // table) appear here; with no selection yet the whole published list shows.
  const homeIds = String(sections.home_place_ids || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  const listedPlaces = homeIds.length > 0 ? places.filter((place) => homeIds.includes(place.place_id)) : places;

  const handleAdd = async (place) => {
    const added = await addPlace(place);
    setFlash(added ? `${place.name} added to your plan` : `${place.name} is already in your plan`);
    setTimeout(() => setFlash(null), 2500);
  };

  // Tapping a card in the All places grid heads to the Explore page and hands
  // the place id over in the router state, so that place's detail popup opens
  // there as soon as the listing has loaded (see ExplorePage).
  const openOnExplore = (place) => {
    navigate('/explore', { state: { previewPlaceId: place.place_id } });
  };

  return (
    <div className="space-y-14 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-brand-dark via-brand to-teal-500 px-4 py-12 text-white sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {get('hero_title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            {get('hero_subtitle')}
          </p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10" />
      </section>

      {/* Why DayTripGO — clear idea of the service, right under the hero */}
      <section className="w-full">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{get('why_title')}</h2>
          <p className="mt-2 text-muted-foreground">
            {get('why_body')}
          </p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: 'Opening times checked',
              text: 'Every listing carries real opening hours and an "open now" hint, so you never travel to a closed gate.',
            },
            {
              title: 'Maps in one tap',
              text: 'Every listing carries a Google Maps link, so you can see exactly where the place sits and head straight there.',
            },
            {
              title: 'Planning only',
              text: 'DayTripGO helps you decide and organise. No bookings, no payments and no accounts, just a clear one-day plan.',
            },
          ].map((point) => (
            <div key={point.title} className="rounded-2xl bg-muted/40 p-6 text-center">
              <h3 className="font-heading text-base font-bold text-brand-dark">{point.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured carousel (Aceternity Apple Cards) */}
      <section className="w-full">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-2 font-heading text-2xl font-bold sm:text-3xl">Featured escapes</h2>
          <p className="mb-2 text-muted-foreground">A taste of each category. Tap a card for the full story.</p>
        </div>
        {/* Admin-chosen selection (see the Home page content editor); empty = default order */}
        <FeaturedCarousel
          places={places}
          categories={categories}
          featured={parseFeaturedRows(sections.featured_place_ids, sections.featured_covers)}
        />
      </section>

      {/* How it works — tinted band */}
      <section className="relative w-full overflow-hidden rounded-[2rem] bg-brand-light/50 px-6 py-10 sm:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand/10" />

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{get('how_title')}</h2>
          <p className="mt-2 text-muted-foreground">
            {get('how_body')}
          </p>
        </div>
        <div className="relative mt-6 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: 'Browse verified places',
              text: 'Temples, beaches, gardens and heritage sites within 25 km of Wadduwa, each one checked by our team before it is listed.',
            },
            {
              title: 'Filter and compare',
              text: 'Narrow the list by category, see opening hours up front, and pick what fits into a single day.',
            },
            {
              title: 'Build your one-day plan',
              text: 'Add favourites to your plan, reorder them, and keep the whole itinerary in one place, with no sign-up and no payment.',
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

      {/* All places — the same cards as the Explore page, showing only the
          places ticked "Show on home" in the Attractive Places table. */}
      <section id="places" className="w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">All places</h2>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              Our selected places within 25 km of Wadduwa — filter by category and add
              your favourites straight to your day plan.
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
          <PlaceGrid
            places={listedPlaces}
            categories={categories}
            hasPlace={hasPlace}
            onAdd={handleAdd}
            onOpen={openOnExplore}
          />
        )}
      </section>

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
