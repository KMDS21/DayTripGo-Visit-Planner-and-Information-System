// FeaturedCarousel — Apple Cards Carousel (Aceternity) showing the admin's
// featured selection on the home page. Places AND owner-submitted businesses
// share one row, so a featured business sits between two featured places.
//
// `featured` is the admin's selection from the panels: place rows come from
// Attractive Places, business rows from the Businesses panel (both serialised
// by utils/featuredConfig as [{ id, cover, type }, ...]). When it resolves to
// at least one existing listing, those cards are shown in the chosen order
// with their chosen covers; otherwise the original "first place of each
// category" behaviour applies.

import { Link } from 'react-router-dom';
import { Carousel, Card } from '@/components/ui/apple-cards-carousel';
import { placeImage } from '../../utils/placeImage';

function PlaceCardContent({ place }) {
  return (
    <div className="rounded-3xl bg-[#F5F5F7] p-8 dark:bg-neutral-800">
      <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-300">
        <span className="font-bold text-neutral-800 dark:text-neutral-100">{place.name}</span>. {place.description}
      </p>
      <p className="mt-3 text-sm font-semibold text-brand">
        <Link to={`/places/${place.place_id}`} className="underline underline-offset-4">
          View details →
        </Link>
      </p>
    </div>
  );
}

// Businesses have no page of their own — the link opens Explore with that
// listing's popup already showing (see ExplorePage + BusinessPreviewModal).
function BusinessCardContent({ business }) {
  return (
    <div className="rounded-3xl bg-[#F5F5F7] p-8 dark:bg-neutral-800">
      <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-300">
        <span className="font-bold text-neutral-800 dark:text-neutral-100">{business.name}</span>.{' '}
        {business.short_description || business.description}
      </p>
      <p className="mt-3 text-sm font-semibold text-brand">
        <Link
          to="/explore"
          state={{ previewBusinessId: business.business_id }}
          className="underline underline-offset-4"
        >
          View listing →
        </Link>
      </p>
    </div>
  );
}

export default function FeaturedCarousel({
  places = [],
  categories = [],
  featured = [],
  businesses = [],
  tags = [],
}) {
  if (!places.length && !businesses.length) return null;

  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name || 'Place';
  const tagName = (id) => tags.find((t) => t.category_id === id)?.category_name;

  const byId = new Map(places.map((place) => [place.place_id, place]));
  const byBusinessId = new Map(businesses.map((business) => [business.business_id, business]));

  // Admin-chosen selection first; skip listings that have since been deleted
  // or are still awaiting approval (they are not in the public lists at all).
  let cards = (featured || [])
    .map((row) => {
      // Rows without a type are place rows — the original shape.
      if (row.type === 'business') {
        const business = byBusinessId.get(row.id);
        if (!business) return null;
        const tagNames = (business.tags || []).map(tagName).filter(Boolean);
        const fallbackName = tagNames[0] || 'Business';
        return {
          key: `business-${business.business_id}`,
          category: fallbackName,
          title: business.name,
          // Custom cover first, then the owner's feature card cover, then the
          // Explore card cover.
          src: row.cover || business.featured_image_url || placeImage(business, fallbackName),
          content: <BusinessCardContent business={business} />,
        };
      }

      const place = byId.get(row.id);
      if (!place) return null;
      const cat = categoryName(place.category_id);
      return {
        key: `place-${place.place_id}`,
        category: cat,
        title: place.name,
        src: row.cover || placeImage(place, cat),
        content: <PlaceCardContent place={place} />,
      };
    })
    .filter(Boolean)
    .slice(0, 12);

  if (!cards.length) {
    // Fallback — the first place of each category, in alphabetical category
    // order (the same order as the filter pills below), capped at 12.
    const firstOfCategory = new Map();
    for (const place of places) {
      const cat = categoryName(place.category_id);
      if (!firstOfCategory.has(cat)) firstOfCategory.set(cat, place);
    }
    cards = [...firstOfCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, place]) => ({
        key: `place-${place.place_id}`,
        category: categoryName(place.category_id),
        title: place.name,
        src: placeImage(place, categoryName(place.category_id)),
        content: <PlaceCardContent place={place} />,
      }))
      .slice(0, 12);
  }

  const items = cards.map((card, index) => <Card key={card.key} index={index} card={card} />);

  return (
    <section aria-label="Featured places and businesses" className="w-full">
      <Carousel items={items} />
    </section>
  );
}
