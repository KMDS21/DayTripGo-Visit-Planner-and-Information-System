// BusinessCard — one business in the Explore "Businesses" grid.
// Businesses are read-only listings for visitors: no add-to-plan, just the
// facts a traveller needs (tags, hours, phone, address, Google Maps).

import Button from '../Common/Button';
import { placeImage } from '../../utils/placeImage';

export default function BusinessCard({ business, tagNames, onOpen }) {
  const media = (
    <>
      <img
        src={placeImage(business, tagNames[0] || 'Business')}
        alt={business.name}
        loading="lazy"
        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
          business.image_url ? '' : 'opacity-90'
        }`}
      />
      <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        {(tagNames.length ? tagNames : ['Business']).slice(0, 2).map((name) => (
          <span
            key={name}
            className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand-dark"
          >
            {name}
          </span>
        ))}
      </span>
    </>
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
      <button
        type="button"
        onClick={() => onOpen(business)}
        aria-label={`View ${business.name}`}
        className="relative block aspect-[4/3] w-full cursor-pointer overflow-hidden"
      >
        {media}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading text-lg font-bold leading-snug">
          <button
            type="button"
            onClick={() => onOpen(business)}
            className="cursor-pointer text-left hover:text-brand"
          >
            {business.name}
          </button>
        </h3>

        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
          {business.short_description || business.description}
        </p>

        {business.opening_hours && (
          <p className="text-xs font-semibold text-muted-foreground">Hours: {business.opening_hours}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpen(business)}>
            View details
          </Button>
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-brand hover:underline"
            >
              Call
            </a>
          )}
          {business.google_maps_url && (
            <a
              href={business.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-brand hover:underline"
              aria-label={`Open ${business.name} in Google Maps`}
            >
              Map ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
