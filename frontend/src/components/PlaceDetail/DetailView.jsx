// DetailView — full place detail (SRS FR-5: description, opening hours, travel
// tips, distance · FR-6: add-to-plan control · FR-7: photo · FR-8/9: map).

import Badge from '../Common/Badge';
import Button from '../Common/Button';
import PhotoGallery from './PhotoGallery';
import MapEmbed from '../MapView/MapEmbed';
import { formatDistance } from '../../utils/formatDistance';
import { normaliseHours } from '../../utils/formatHours';
import { isOpenFromText } from '../../utils/isOpenNow';

export default function DetailView({ place, categoryName, inPlan, onAdd, added }) {
  const open = isOpenFromText(place.opening_hours);

  return (
    <article className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <PhotoGallery place={place} categoryName={categoryName} />
        <MapEmbed latitude={place.latitude} longitude={place.longitude} name={place.name} />
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="category">{categoryName || 'Place'}</Badge>
          <Badge variant="distance">{formatDistance(place.distance_km)} from Wadduwa</Badge>
          {open !== null && <Badge variant={open ? 'open' : 'closed'}>{open ? 'Open now' : 'Closed'}</Badge>}
        </div>

        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">{place.name}</h1>

        <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{place.description}</p>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Opening hours</h2>
          <p className="text-base">{normaliseHours(place.opening_hours) || 'Hours not specified — contact before visiting.'}</p>
        </section>

        {place.travel_tips && (
          <section className="rounded-2xl border border-border bg-sand/60 p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--accent-foreground)]">
              Travel tips
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed">{place.travel_tips}</p>
          </section>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button size="lg" disabled={inPlan} onClick={() => onAdd(place)}>
            {inPlan ? '✓ Already in your day plan' : '＋ Add to my day plan'}
          </Button>
          {added && <span className="text-sm font-semibold text-brand">Added!</span>}
        </div>

        <p className="text-xs text-muted-foreground">
          Planning only — DayTripGO does not book or sell anything.
        </p>
      </div>
    </article>
  );
}
