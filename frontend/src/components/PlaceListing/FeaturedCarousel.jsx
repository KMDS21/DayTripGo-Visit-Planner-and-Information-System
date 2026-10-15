// FeaturedCarousel — Apple Cards Carousel (Aceternity) showing featured places
// on the home page. Uses real place data; falls back to generated category
// gradients when no photo exists yet.

import { Link } from 'react-router-dom';
import { Carousel, Card } from '@/components/ui/apple-cards-carousel';
import { formatDistance } from '../../utils/formatDistance';
import { placeImage } from '../../utils/placeImage';

function PlaceCardContent({ place }) {
  return (
    <div className="rounded-3xl bg-[#F5F5F7] p-8 dark:bg-neutral-800">
      <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-300">
        <span className="font-bold text-neutral-800 dark:text-neutral-100">{place.name}</span> — {place.description}
      </p>
      <p className="mt-3 text-sm font-semibold text-brand">
        {formatDistance(place.distance_km)} from Wadduwa ·{' '}
        <Link to={`/places/${place.place_id}`} className="underline underline-offset-4">
          View details →
        </Link>
      </p>
    </div>
  );
}

export default function FeaturedCarousel({ places, categories }) {
  if (!places.length) return null;

  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name || 'Place';

  // Up to 6 featured places — the first place of each category, shown in the
  // same alphabetical category order as the filter pills below.
  const firstOfCategory = new Map();
  for (const place of places) {
    const cat = categoryName(place.category_id);
    if (!firstOfCategory.has(cat)) firstOfCategory.set(cat, place);
  }
  const featured = [...firstOfCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, place]) => place)
    .slice(0, 6);

  const cards = featured.map((place, index) => (
    <Card
      key={place.place_id}
      index={index}
      card={{
        category: categoryName(place.category_id),
        title: place.name,
        src: placeImage(place, categoryName(place.category_id)),
        content: <PlaceCardContent place={place} />,
      }}
    />
  ));

  return (
    <section aria-label="Featured places" className="w-full">
      <Carousel items={cards} />
    </section>
  );
}
