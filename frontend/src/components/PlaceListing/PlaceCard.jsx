// PlaceCard — one place in the listing grid (SRS FR-1: photo, name, category;
// FR-6 quick add-to-plan). When the parent passes `onOpen` (the Explore page),
// clicking the photo or name opens the place preview popup instead of
// navigating to the detail page. Cards never embed a map themselves: the popup
// and the detail page show the Google map from the place's Maps link; the card
// keeps a plain "Map ↗" link.

import { Link } from 'react-router-dom';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import { placeImage } from '../../utils/placeImage';

export default function PlaceCard({ place, categoryName, inPlan, onAdd, onOpen }) {
  const media = (
    <>
      <img
        src={placeImage(place)}
        alt={place.name}
        loading="lazy"
        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${place.image_url ? '' : 'opacity-90'}`}
      />
      <span className="absolute left-3 top-3">
        <Badge variant="category">{categoryName || 'Place'}</Badge>
      </span>
    </>
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(place)}
          aria-label={`View ${place.name}`}
          className="relative block aspect-[4/3] w-full cursor-pointer overflow-hidden"
        >
          {media}
        </button>
      ) : (
        <Link to={`/places/${place.place_id}`} className="relative block aspect-[4/3] overflow-hidden">
          {media}
        </Link>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading text-lg font-bold leading-snug">
          {onOpen ? (
            <button
              type="button"
              onClick={() => onOpen(place)}
              className="cursor-pointer text-left hover:text-brand"
            >
              {place.name}
            </button>
          ) : (
            <Link to={`/places/${place.place_id}`} className="hover:text-brand">
              {place.name}
            </Link>
          )}
        </h3>

        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{place.description}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={inPlan ? 'outline' : 'primary'}
            disabled={inPlan}
            onClick={() => onAdd(place)}
            aria-label={`Add ${place.name} to my day plan`}
          >
            {inPlan ? '✓ In plan' : '＋ Add to plan'}
          </Button>
          <Link
            to={`/places/${place.place_id}`}
            className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-brand hover:underline"
          >
            Details
          </Link>
          {place.google_maps_url && (
            <a
              href={place.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-brand hover:underline"
              aria-label={`Open ${place.name} in Google Maps`}
            >
              Map ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
