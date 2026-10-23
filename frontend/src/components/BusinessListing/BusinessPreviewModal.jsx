// BusinessPreviewModal — popup opened when an Explore business card is
// clicked: the cover photo, tag chips, description, hours, contact details
// and the Google map. Read-only — there is no add-to-plan for businesses.

import { useEffect, useState } from 'react';
import Button from '../Common/Button';
import { getBusinessPhotos } from '../../services/businessService';
import { googleMapEmbedSrc } from '../../utils/googleMaps';
import { placeImage } from '../../utils/placeImage';
import { normaliseHours } from '../../utils/formatHours';

export default function BusinessPreviewModal({ business, tagNames, onClose }) {
  // Gallery — public endpoint, approved listings only (empty when the owner
  // has not uploaded photos yet, which falls back to the card cover).
  const [photos, setPhotos] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotos([]);
    setPhotoIndex(0);
    if (!business?.business_id) return undefined;
    let alive = true;
    getBusinessPhotos(business.business_id)
      .then((rows) => {
        if (alive) setPhotos(rows || []);
      })
      .catch(() => {
        if (alive) setPhotos([]); // gallery unavailable — fall back to the cover
      });
    return () => {
      alive = false;
    };
  }, [business?.business_id]);

  // Esc closes, background scroll locks while it is open (same as Modal).
  useEffect(() => {
    if (!business) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [business, onClose]);

  if (!business) return null;

  const tags = tagNames && tagNames.length ? tagNames : ['Business'];
  const mapSrc = googleMapEmbedSrc(business, 15);
  // Gallery first (the card cover leads), the Explore card cover when there
  // are no photos yet.
  const ordered = [...photos].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || Number(b.is_featured) - Number(a.is_featured)
  );
  const images = ordered.length > 0 ? ordered.map((row) => row.photo_url) : [placeImage(business, tags[0])];
  const activeIndex = Math.min(photoIndex, images.length - 1);
  const contactRows = [
    business.address && { label: 'Address', value: business.address },
    business.phone && { label: 'Phone', value: business.phone, href: `tel:${business.phone}` },
    business.email && { label: 'Email', value: business.email, href: `mailto:${business.email}` },
    business.website_url && {
      label: 'Website',
      value: business.website_url.replace(/^https?:\/\//, ''),
      href: business.website_url,
    },
  ].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-label={business.name}
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          {/* Left column — details, hours, contact, map */}
          <div className="order-2 space-y-4 lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand-dark"
                >
                  {name}
                </span>
              ))}
            </div>

            <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">
              {business.name}
            </h2>

            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {business.description}
            </p>

            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Opening hours
              </h3>
              <p className="text-sm sm:text-base">
                {normaliseHours(business.opening_hours) ||
                  'Hours not specified. Contact the business before visiting.'}
              </p>
            </section>

            {contactRows.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact
                </h3>
                <dl className="space-y-1 text-sm">
                  {contactRows.map((row) => (
                    <div key={row.label} className="flex gap-3">
                      <dt className="w-20 shrink-0 font-semibold text-muted-foreground">{row.label}</dt>
                      <dd className="min-w-0 break-words">
                        {row.href ? (
                          <a
                            href={row.href}
                            target={row.href.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="underline-offset-4 hover:text-brand hover:underline"
                          >
                            {row.value}
                          </a>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              {business.google_maps_url && (
                <Button
                  size="lg"
                  onClick={() => window.open(business.google_maps_url, '_blank', 'noopener,noreferrer')}
                >
                  Open in Google Maps ↗
                </Button>
              )}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-brand hover:underline"
                >
                  Call {business.phone}
                </a>
              )}
            </div>

            {mapSrc && (
              <iframe
                title={`Google map of ${business.name}`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-52 w-full rounded-2xl border border-border bg-muted"
              />
            )}
          </div>

          {/* Right column — the photo area, with the other images in a small
              box underneath (top on phones, so the picture leads). */}
          <div className="order-1 space-y-3 lg:order-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
              {images.map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt={`${business.name} — photo ${i + 1}`}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                    i === activeIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
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

            {/* Small box of the other images — only worth showing from 2 up */}
            {images.length > 1 && (
              <div className="rounded-2xl border border-border bg-muted/40 p-2.5">
                <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  More photos
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => setPhotoIndex(i)}
                      aria-label={`Show photo ${i + 1} of ${images.length}`}
                      aria-current={i === activeIndex}
                      className={`relative aspect-square overflow-hidden rounded-lg transition-shadow ${
                        i === activeIndex
                          ? 'ring-2 ring-brand ring-offset-2 ring-offset-background'
                          : 'hover:ring-2 hover:ring-muted-foreground/30 hover:ring-offset-2 hover:ring-offset-background'
                      }`}
                    >
                      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="rounded-2xl border border-border bg-muted/40 px-3.5 py-3 text-xs text-muted-foreground">
              {business.owner_name ? `Listed by ${business.owner_name}` : 'Listed by the business owner'} on
              DayTripGO. Details are kept up to date by the owner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
