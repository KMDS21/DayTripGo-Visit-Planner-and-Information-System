// HomePage — hero, why/how sections, the Featured escapes carousel (places and
// businesses mixed by the admin's choice) and the full "All places" listing:
// the same cards as the Explore page (published places plus the businesses the
// admin ticked "Show on home" for).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Compass, Camera, ChevronDown } from 'lucide-react';
import { usePlaces } from '../hooks/usePlaces';
import { useBusinesses } from '../hooks/useBusinesses';
import { useVisitPlan } from '../hooks/useVisitPlan';
import usePageTitle from '../hooks/usePageTitle';
import usePageContent from '../hooks/usePageContent';
import FeaturedCarousel from '../components/PlaceListing/FeaturedCarousel';
import PlaceCard from '../components/PlaceListing/PlaceCard';
import BusinessCard from '../components/BusinessListing/BusinessCard';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';
import { parseFeaturedRows, parseIdCsv } from '../utils/featuredConfig';

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
  const {
    businesses,
    tags: businessTags,
    loading: businessesLoading,
    error: businessesError,
    refresh: refreshBusinesses,
  } = useBusinesses();
  const { addPlace, hasPlace } = useVisitPlan();
  const [flash, setFlash] = useState(null);
  const navigate = useNavigate();

  // Only the places the admin ticked "Show on home" for (Attractive Places
  // table) appear here; with no selection yet the whole published list shows.
  const homeIds = parseIdCsv(sections.home_place_ids);
  const listedPlaces = homeIds.length > 0 ? places.filter((place) => homeIds.includes(place.place_id)) : places;

  // Businesses are chosen the same way from the Businesses panel ("Show on
  // home"), one tick per listing — no tick, no card. Only approved listings
  // are in the list at all, so a pending or unpublished one never appears.
  const homeBusinessIds = parseIdCsv(sections.home_business_ids);
  const listedBusinesses =
    homeBusinessIds.length > 0
      ? businesses.filter((business) => homeBusinessIds.includes(business.business_id))
      : [];

  // One grid for both listings, alternating place / business so the four cards
  // shown on tablets and phones always include businesses when any are chosen.
  const mergedItems = [];
  for (let i = 0; i < Math.max(listedPlaces.length, listedBusinesses.length); i += 1) {
    if (i < listedPlaces.length) mergedItems.push({ type: 'place', place: listedPlaces[i] });
    if (i < listedBusinesses.length) mergedItems.push({ type: 'business', business: listedBusinesses[i] });
  }

  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name;
  const tagNamesFor = (business) =>
    (business.tags || [])
      .map((id) => businessTags.find((t) => t.category_id === id)?.category_name)
      .filter(Boolean);

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

  // Businesses have no page of their own — the card opens Explore on the
  // Businesses tab with that listing's popup showing.
  const openBusinessOnExplore = (business) => {
    navigate('/explore', { state: { previewBusinessId: business.business_id } });
  };

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 min-[1281px]:space-y-24 pb-2">
      {/* ── Hero ─────────────────────────────────────────────────────────
          Cinematic cover (video or image) with a centred headline, subtitle
          and dual call-to-action. */}
      {/* Hero — ≤1280px: fills the visible screen (full-screen cover).
          ≥1281px: height is CAPPED via max-h so the three "Why DayTripGO"
          cards are guaranteed to be visible in the initial viewport. */}
      <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden rounded-b-[2.5rem] bg-slate-900 px-4 py-12 text-white sm:px-6 md:min-h-[calc(100svh-4rem)] min-[1281px]:min-h-[38svh] min-[1281px]:max-h-[calc(100svh-40rem)] min-[1281px]:py-10">
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

        {/* Lighter cinematic overlay — lets the cover video/photo show vibrantly while keeping text legible */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/20 to-slate-950/65"
        />

        {/* Centered Hero content */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-3 text-center [text-shadow:0_2px_24px_rgba(0,0,0,0.75)]">
          <h1 className="hero-in mx-auto max-w-[15ch] font-heading text-[clamp(2rem,9vw,2.65rem)] font-bold leading-[1.06] tracking-tight sm:max-w-none sm:whitespace-nowrap sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl min-[1440px]:text-[4.25rem] min-[1600px]:text-[4.75rem]">
            {get('hero_title')}
          </h1>

          <p className="hero-in hero-in-2 mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-white/95 sm:mt-5 sm:text-base lg:text-lg">
            {get('hero_subtitle')}
          </p>

          {/* Dual CTA buttons — reliable touch targets on mobile (44px min height) */}
          <div className="hero-in hero-in-4 mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
            <Link
              to="/explore"
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-slate-900 shadow-lg transition-all duration-300 hover:bg-brand hover:text-white hover:shadow-brand/30 sm:px-8 sm:py-3.5 sm:text-base"
            >
              <Camera className="h-4 w-4" />
              Explore places
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              to="/visit-plan"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/50 bg-white/15 px-6 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/70 hover:bg-white/25 sm:px-8 sm:py-3.5 sm:text-base"
            >
              <MapPin className="h-4 w-4" />
              Build your plan
            </Link>
          </div>
        </div>

        {/* Scroll-down hint — only on screens ≤1280px where the hero is
            full-screen; nudges the visitor to scroll past the cover. */}
        <div
          aria-hidden="true"
          className="hero-in hero-in-4 absolute inset-x-0 bottom-4 z-10 flex justify-center sm:bottom-6 min-[1281px]:hidden"
        >
          <span className="flex flex-col items-center gap-1 text-white/70">
            <span className="text-[10px] font-medium uppercase tracking-widest sm:text-[11px]">Scroll</span>
            <ChevronDown className="h-4 w-4 animate-bounce sm:h-5 sm:w-5" />
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

      {/* Featured carousel (Aceternity Apple Cards) — the admin picks the
          places in Attractive Places and the businesses in the Businesses
          panel; both feed one row, places first in the order they were ticked. */}
      <section className="w-full">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Featured escapes</h2>
          <p className="mt-3 text-muted-foreground">A taste of each category. Tap a card for the full story.</p>
        </div>
        <FeaturedCarousel
          places={places}
          categories={categories}
          businesses={businesses}
          tags={businessTags}
          featured={[
            ...parseFeaturedRows(sections.featured_place_ids, sections.featured_covers).map((row) => ({
              ...row,
              type: 'place',
            })),
            ...parseFeaturedRows(sections.featured_business_ids, sections.featured_business_covers).map((row) => ({
              ...row,
              type: 'business',
            })),
          ]}
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

        {/* Cinematic gradient overlay — lighter to let the scenic backdrop shine through */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-900/35 to-slate-950/55"
        />

        {/* Section title & subtitle — subtitle gets the wider measure so the
            tagline reads as one line instead of breaking early */}
        <div className="relative mx-auto max-w-3xl text-center [text-shadow:0_2px_16px_rgba(0,0,0,0.65)]">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {get('how_title')}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-lg">
            {get('how_body')}
          </p>
        </div>

        {/* 3 Step cards — always ONE row of glass panes (grid-cols-3 at every
            width; type and padding scale down instead of stacking). */}
        <div className="relative mt-10 grid grid-cols-3 gap-2.5 sm:gap-5">
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
              title: 'Build your one day plan',
              text: 'Add favourites to your plan, reorder them, and keep the whole itinerary in one place, with no sign up and no payment.',
            },
          ].map((step) => (
            <div
              key={step.title}
              className="group relative flex flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-white/25 via-white/12 to-white/8 p-3 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/25 hover:shadow-[0_16px_44px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.75)] sm:p-8"
            >
              {/* Top glare — the pane catching the sky above it */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -top-10 h-24 bg-gradient-to-b from-white/45 via-white/10 to-transparent blur-sm"
              />
              {/* Diagonal sheen — light streaking across the glass, slides up on hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/3 -rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-md transition-transform duration-700 group-hover:translate-y-1/4"
              />

              <h3 className="relative font-heading text-[13px] font-bold leading-tight tracking-tight text-white sm:text-lg md:text-xl [text-shadow:0_1px_10px_rgba(0,0,0,0.45)]">
                {step.title}
              </h3>
              <p className="relative mt-1.5 text-[10px] leading-snug text-white/90 sm:mt-2.5 sm:text-sm sm:leading-relaxed">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* All places — the same cards as the Explore page: every published
          place (or just the ones ticked "Show on home" in Attractive Places)
          plus the businesses ticked "Show on home" in the Businesses panel. */}
      <section id="places" className="w-full space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              All places &amp; businesses
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Everything selected for this page within 25 km of Wadduwa — add your favourite places
              straight to your day plan, or tap a business for its hours, contact details and map.
            </p>
          </div>
          <Link
            to="/explore"
            className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Explore everything
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {(loading || businessesLoading) && <Loader label="Loading listings…" />}
        {/* One error box per listing that failed; the other one still renders. */}
        {error && <ErrorMessage message={error} onRetry={refresh} />}
        {businessesError && <ErrorMessage message={businessesError} onRetry={refreshBusinesses} />}

        {!loading && !businessesLoading && mergedItems.length > 0 && (
          <div className="grid grid-cards-4 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {mergedItems.map((item) =>
              item.type === 'business' ? (
                <BusinessCard
                  key={`business-${item.business.business_id}`}
                  business={item.business}
                  tagNames={tagNamesFor(item.business)}
                  onOpen={openBusinessOnExplore}
                />
              ) : (
                <PlaceCard
                  key={`place-${item.place.place_id}`}
                  place={item.place}
                  categoryName={categoryName(item.place.category_id)}
                  inPlan={hasPlace(item.place.place_id)}
                  onAdd={handleAdd}
                  onOpen={openOnExplore}
                />
              )
            )}
          </div>
        )}

        {!loading && !businessesLoading && mergedItems.length === 0 && !error && !businessesError && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Nothing is selected for this page yet — published places and businesses ticked
            &ldquo;Show on home&rdquo; appear here.
          </div>
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
