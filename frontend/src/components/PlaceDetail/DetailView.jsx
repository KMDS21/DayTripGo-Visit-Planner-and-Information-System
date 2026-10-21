// DetailView — full place detail (SRS FR-5: description, opening hours, travel
// tips · FR-6: add-to-plan control · FR-7: photo · FR-8/9: map).

import Badge from '../Common/Badge';
import Button from '../Common/Button';
import PhotoGallery from './PhotoGallery';
import MapEmbed from '../MapView/MapEmbed';
import { normaliseHours } from '../../utils/formatHours';

export default function DetailView({ place, categoryName, inPlan, onAdd, added }) {
  return (
    <article className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <PhotoGallery place={place} categoryName={categoryName} />
        <MapEmbed latitude={place.latitude} longitude={place.longitude} name={place.name} />
      </div>

      {/* pb-24 on phones keeps the last block clear of the fixed action bar */}
      <div className="space-y-5 pb-24 lg:pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="category">{categoryName || 'Place'}</Badge>
        </div>

        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">{place.name}</h1>

        <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{place.description}</p>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Opening hours</h2>
          <p className="text-base">{normaliseHours(place.opening_hours) || 'Hours not specified. Contact us before visiting.'}</p>
        </section>

        {place.travel_tips && (
          <section className="rounded-2xl border border-border bg-sand/60 p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--accent-foreground)]">
              Travel tips
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed">{place.travel_tips}</p>
          </section>
        )}

        {/* Sticky bottom action bar on phones (the in-flow button below hides
            at that breakpoint); the button stays reachable while scrolling. */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur safe-b lg:hidden">
          <div className="flex items-center gap-3">
            <Button size="lg" className="flex-1" disabled={inPlan} onClick={() => onAdd(place)}>
              {inPlan ? '✓ Already in plan' : '＋ Add to my day plan'}
            </Button>
            {added && <span className="shrink-0 text-sm font-semibold text-brand">Added!</span>}
          </div>
        </div>

        {/* Desktop / tablet in-flow control */}
        <div className="hidden items-center gap-3 pt-2 lg:flex">
          <Button size="lg" disabled={inPlan} onClick={() => onAdd(place)}>
            {inPlan ? '✓ Already in your day plan' : '＋ Add to my day plan'}
          </Button>
          {added && <span className="text-sm font-semibold text-brand">Added!</span>}
        </div>
      </div>
    </article>
  );
}
