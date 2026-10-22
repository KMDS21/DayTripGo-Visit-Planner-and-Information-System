// HomePage — hero, why/how sections, the Featured escapes carousel and the
// full "All places" listing: the same cards and category selector as the
// Explore page (published places from the Attractive Places table).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Compass, Camera, ChevronDown } from 'lucide-react';
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
    <div className="space-y-20 pb-2 min-[1281px]:space-y-24">
      {/* ── Hero ─────────────────────────────────────────────────────────
          Cinematic cover (video or image) with a centred headline, subtitle
          and dual call-to-action. */}
      {/* Hero — ≤1280px: fills the visible screen (full-screen cover).
          ≥1281px: height is CAPPED via max-h so the three "Why DayTripGO"
          cards are guaranteed to be visible in the initial viewport. */}
      <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden rounded-b-[2.5rem] bg-slate-900 px-4 py-16 text-white sm:px-6 md:min-h-[calc(100svh-4rem)] min-[1281px]:min-h-[38svh] min-[1281px]:max-h-[calc(100svh-40rem)] min-[1281px]:py-10">
        {/* Cover video or image */}
        {(() => {
          const cover = get('hero_cover');
          const isVideo = !cover || cover.endsWith('.mp4') || cover.endsWith('.webm');
          if (isVideo) {
            return (
              <video
                key={cover || 'default-home-video'}
                className="absolute inset-0 h-full w-full object-cover"
                src={cover || '/Home%20page%20cover.mp4'}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
              />
            );
          }
          return (
            <img
              src={cover}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          );
        })()}

        {/* Dark cinematic overlay — keeps the white text legible over any
            photo or video frame (WCAG contrast). */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-900/55 to-slate-900/90"
        />

        {/* Centered Hero content */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-3 text-center [text-shadow:0_2px_24px_rgba(0,0,0,0.65)]">
          <h1 className="hero-in mx-auto whitespace-nowrap font-heading text-[clamp(0.55rem,2.5vw,0.85rem)] font-bold leading-tight tracking-tight sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl min-[1440px]:text-[4.25rem] min-[1600px]:text-[4.75rem]">
            {get('hero_title')}
          </h1>

          <p className="hero-in hero-in-2 mx-auto mt-2.5 max-w-2xl text-[11px] leading-relaxed text-white/90 sm:mt-5 sm:text-base lg:text-lg">
            {get('hero_subtitle')}
          </p>

          {/* Dual CTA buttons — one solid, one ghost; large touch targets */}
          <div className="hero-in hero-in-4 mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:mt-10 sm:gap-4">
            <Link
              to="/explore"
              className="group inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-bold text-slate-900 shadow-lg transition-all duration-300 hover:bg-brand hover:text-white hover:shadow-brand/30 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-base"
            >
              <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Explore places
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              to="/visit-plan"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-5 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:bg-white/20 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-base"
            >
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Build your plan
            </Link>
          </div>
        </div>

        {/* Scroll-down hint — only on screens ≤1280px where the hero is
            full-screen; nudges the visitor to scroll past the cover. */}
        <div
          aria-hidden="true"
          className="hero-in hero-in-4 absolute inset-x-0 bottom-6 z-10 flex justify-center min-[1281px]:hidden"
        >
          <span className="flex flex-col items-center gap-1 text-white/60">
            <span className="text-[11px] font-medium uppercase tracking-widest">Scroll</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </span>
        </div>
      </section>

      {/* Why DayTripGO — the three quick reasons. Visible on ALL screen sizes.
          Mobile: single-column stack for easy vertical scanning.
          Tablet and up: side-by-side 3-column grid. */}
      <section className="w-full">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Plan the day, not the paperwork
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            {
              icon: Clock,
              title: 'Opening times checked',
              text: 'Every listing carries real opening hours, so you always know when a place welcomes visitors before you set off.',
            },
            {
              icon: MapPin,
              title: 'Maps in one tap',
              text: 'Every listing carries a Google Maps link, so you can see exactly where the place sits and head straight there.',
            },
            {
              icon: Compass,
              title: 'Planning only',
              text: 'DayTripGO helps you decide and organise. No bookings, no payments and no accounts, just a clear one-day plan.',
            },
          ].map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg sm:flex-col sm:items-center sm:gap-0 sm:p-8 sm:text-center"
              >
                {/* Icon — inline on mobile, centred block on sm+ */}
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white sm:mx-auto sm:mb-4">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold tracking-tight">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured carousel (Aceternity Apple Cards) */}
      <section className="w-full">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Featured escapes</h2>
          <p className="mt-3 text-muted-foreground">A taste of each category. Tap a card for the full story.</p>
        </div>
        {/* Admin-chosen selection (see the Home page content editor); empty = default order */}
        <FeaturedCarousel
          places={places}
          categories={categories}
          featured={parseFeaturedRows(sections.featured_place_ids, sections.featured_covers)}
        />
      </section>

      {/* How it works — scenic photo backdrop with dark gradient for razor-sharp foreground clarity */}
      <section className="relative w-full overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-14 sm:px-10 sm:py-20 text-white shadow-xl">
        {/* Background photo */}
        <img
          src="/BG%20-%201.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Cinematic gradient overlay ensures all front details and text are clearly legible */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/70 to-slate-950/90"
        />

        {/* Section title & subtitle */}
        <div className="relative mx-auto max-w-2xl text-center [text-shadow:0_2px_16px_rgba(0,0,0,0.65)]">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {get('how_title')}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-lg">
            {get('how_body')}
          </p>
        </div>

        {/* 3 Step cards — frosted glass styling with high contrast readability */}
        <div className="relative mt-10 grid gap-5 sm:grid-cols-3">
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
            <div
              key={step.title}
              className="group rounded-2xl border border-white/20 bg-white/95 p-6 text-center shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-2xl sm:p-8"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand font-heading text-lg font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                {i + 1}
              </span>
              <h3 className="mt-4 font-heading text-lg font-bold tracking-tight text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* All places — the same cards as the Explore page, showing only the
          places ticked "Show on home" in the Attractive Places table. */}
      <section id="places" className="w-full space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">All places</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Our selected places within 25 km of Wadduwa — filter by category and add
              your favourites straight to your day plan.
            </p>
          </div>
          <Link
            to="/explore"
            className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
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
            limitBelowXl
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
