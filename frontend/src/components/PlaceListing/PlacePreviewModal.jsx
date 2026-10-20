// PlacePreviewModal — popup opened when an Explore place card is clicked:
// the place's photos (one by one, small dots to navigate), details, Google
// mini-map and add-to-plan over a blurred backdrop. No link to the separate
// detail page — the popup IS the detail view now.

import { useEffect, useState } from 'react';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import { getPlacePhotos } from '../../services/placeService';
import { googleMapEmbedSrc } from '../../utils/googleMaps';
import { placeImage } from '../../utils/placeImage';
import { formatDistance } from '../../utils/formatDistance';
import { normaliseHours } from '../../utils/formatHours';
import { isOpenFromText } from '../../utils/isOpenNow';

export default function PlacePreviewModal({ place, categoryName, inPlan, onAdd, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Esc closes, background scroll locks while it is open (same as Modal).
  useEffect(() => {
    if (!place) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [place, onClose]);

  // Load the place's photo gallery when the popup opens; with no gallery the
  // card photo is used as a single image.
  useEffect(() => {
    if (!place) return undefined;
    let alive = true;
    setPhotos([]);
    setPhotoIndex(0);
    getPlacePhotos(place.place_id)
      .then((rows) => {
        if (alive) setPhotos((rows || []).map((row) => row.photo_url));
      })
      .catch(() => {
        if (alive) setPhotos([]); // gallery unavailable — fall back to the card photo
      });
    return () => {
      alive = false;
    };
  }, [place]);

  if (!place) return null;

  const open = isOpenFromText(place.opening_hours);
  const images = photos.length > 0 ? photos : [placeImage(place, categoryName)];
  const activeIndex = Math.min(photoIndex, images.length - 1);
  // The map always comes from the place's Google Maps URL (server-resolved
  // coordinates, else parsed from the URL, else the URL itself as query).
  const mapSrc = googleMapEmbedSrc(place, 15);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-label={place.name}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
        {/* Photos — one by one (cross-fade), with the card badges over them */}
        <div className="relative h-52 w-full overflow-hidden sm:h-60">
          {images.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={`${place.name} — photo ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                i === activeIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25"
          />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge variant="category">{categoryName || 'Place'}</Badge>
            <Badge variant="distance">{formatDistance(place.distance_km)}</Badge>
            {open !== null && <Badge variant={open ? 'open' : 'closed'}>{open ? 'Open now' : 'Closed'}</Badge>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Small dots to move between the photos (hidden for a single image) */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-3">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                onClick={() => setPhotoIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? 'w-5 bg-brand'
                    : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60'
                }`}
              />
            ))}
          </div>
        )}

        <div className="space-y-4 p-5 pt-4 sm:p-6 sm:pt-5">
          <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">{place.name}</h2>

          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {place.description}
          </p>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Opening hours</h3>
            <p className="text-sm sm:text-base">
              {normaliseHours(place.opening_hours) || 'Hours not specified. Contact us before visiting.'}
            </p>
          </section>

          {place.travel_tips && (
            <section className="rounded-2xl border border-border bg-sand/60 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:var(--accent-foreground)]">
                Travel tips
              </h3>
              <p className="whitespace-pre-line text-sm leading-relaxed sm:text-base">{place.travel_tips}</p>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <Button size="lg" disabled={inPlan} onClick={() => onAdd(place)}>
              {inPlan ? '✓ Already in plan' : '＋ Add to my day plan'}
            </Button>
            {place.google_maps_url && (
              <a
                href={place.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-brand hover:underline"
              >
                Google Maps ↗
              </a>
            )}
          </div>

          {/* Google map location, under the details (from the place's Maps URL) */}
          {mapSrc && (
            <iframe
              title={`Google map of ${place.name}`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-52 w-full rounded-2xl border border-border bg-muted"
            />
          )}

          <p className="text-xs text-muted-foreground">Planning only. DayTripGO does not book or sell anything.</p>
        </div>
      </div>
    </div>
  );
}
