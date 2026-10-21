import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Compass, Sparkles, Check, Plus, ExternalLink } from 'lucide-react';
import { placeImage } from '../../utils/placeImage';

export default function HeroLocationCarousel({
  places = [],
  categories = [],
  hasPlace,
  onAddPlace,
  onOpenPlace,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name || 'Place';

  // Curate up to 5 diverse, high-quality location cards for the hero
  const cards = (() => {
    if (!places || places.length === 0) return [];

    // Prioritize published places with images across different categories
    const withImages = places.filter((p) => Boolean(p.image_url));
    const pool = withImages.length >= 4 ? withImages : places;

    // Pick places with diverse categories if possible
    const seenCat = new Set();
    const diverse = [];
    for (const p of pool) {
      if (!seenCat.has(p.category_id)) {
        seenCat.add(p.category_id);
        diverse.push(p);
      }
    }
    // Fill up to 5
    for (const p of pool) {
      if (diverse.length >= 5) break;
      if (!diverse.some((d) => d.place_id === p.place_id)) {
        diverse.push(p);
      }
    }
    return diverse.slice(0, 5);
  })();

  const total = cards.length;

  // Auto-advance timer (every 4.5s) unless paused
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  if (total === 0) return null;

  const activePlace = cards[currentIndex];
  const nextPlace = cards[(currentIndex + 1) % total];
  const inPlan = hasPlace ? hasPlace(activePlace.place_id) : false;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const activeImage = placeImage(activePlace, categoryName(activePlace.category_id));
  const nextImage = placeImage(nextPlace, categoryName(nextPlace.category_id));

  return (
    <div
      className="relative w-full max-w-sm sm:max-w-md lg:max-w-[390px] xl:max-w-[420px] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Featured Locations Carousel"
    >
      {/* Top ambient header badge */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Top Locations
        </span>
        <span className="text-xs font-medium text-white/60">
          <span className="font-bold text-white">{currentIndex + 1}</span> of {total}
        </span>
      </div>

      {/* 3D Stack container */}
      <div className="relative aspect-[4/5] w-full">
        {/* Behind peeking card for 3D depth */}
        {total > 1 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 scale-[0.96] rounded-3xl overflow-hidden border border-white/10 bg-slate-800 shadow-2xl opacity-60 transition-all duration-500 pointer-events-none"
          >
            <img
              src={nextImage}
              alt=""
              className="h-full w-full object-cover blur-[0.5px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
          </div>
        )}

        {/* Active interactive card */}
        <div
          onClick={() => onOpenPlace?.(activePlace)}
          className="group relative h-full w-full cursor-pointer overflow-hidden rounded-3xl border border-white/20 bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 hover:border-white/35 hover:shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
        >
          {/* Background image with gentle zoom on hover */}
          <img
            key={activePlace.place_id}
            src={activeImage}
            alt={activePlace.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 animate-in fade-in"
          />

          {/* Cinematic dark scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/20" />

          {/* Top pill bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-300" />
              {categoryName(activePlace.category_id)}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
              <MapPin className="h-3 w-3 text-brand-light" />
              Wadduwa area
            </span>
          </div>

          {/* Bottom content section */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
            <h3 className="font-heading text-2xl font-bold leading-tight sm:text-[1.65rem] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)] group-hover:text-brand-light transition-colors">
              {activePlace.name}
            </h3>

            {activePlace.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/80 sm:text-sm">
                {activePlace.description}
              </p>
            )}

            {/* Quick action buttons row */}
            <div className="mt-4 flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPlace?.(activePlace);
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition-all hover:bg-brand hover:text-white"
              >
                <span>View Details</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPlace?.(activePlace);
                }}
                title={inPlan ? 'Already in your day plan' : 'Add to your day plan'}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md transition-all ${
                  inPlan
                    ? 'border-emerald-400/60 bg-emerald-500/25 text-emerald-200'
                    : 'border-white/30 bg-white/15 text-white hover:border-white/50 hover:bg-white/25'
                }`}
              >
                {inPlan ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>In plan</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Pagination underneath */}
      <div className="mt-3.5 flex items-center justify-between px-1">
        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5">
          {cards.map((card, idx) => (
            <button
              key={card.place_id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-7 bg-brand shadow-sm shadow-brand/50'
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Prev / Next Chevrons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous location"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next location"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20 active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
