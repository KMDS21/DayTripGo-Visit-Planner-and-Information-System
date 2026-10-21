// FeaturedCarousel — Apple Cards Carousel (Aceternity) showing featured places
// on the home page. Uses real place data; falls back to generated category
// gradients when no photo exists yet.
//
// `featured` is the admin's selection from the Home page content editor
// ([{ id, cover }, ...] — see utils/featuredConfig). When it resolves to at
// least one existing place, those cards are shown in the chosen order with
// their chosen covers; otherwise the original "first place of each category"
// behaviour applies.

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

export default function FeaturedCarousel({ places, categories, featured }) {
  if (!places.length) return null;

  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name || 'Place';

  // Admin-chosen selection first; skip places that have since been deleted.
  const byId = new Map(places.map((place) => [place.place_id, place]));
  let cards = (featured || [])
    .map((row) => ({ place: byId.get(row.id), cover: row.cover || '' }))
    .filter((entry) => entry.place)
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
      .map(([, place]) => ({ place, cover: '' }))
      .slice(0, 12);
  }

  const items = cards.map(({ place, cover }, index) => (
    <Card
      key={place.place_id}
      index={index}
      card={{
        category: categoryName(place.category_id),
        title: place.name,
        src: cover || placeImage(place, categoryName(place.category_id)),
        content: <PlaceCardContent place={place} />,
      }}
    />
  ));

  return (
    <section aria-label="Featured places" className="w-full">
      <Carousel items={items} />
    </section>
  );
}
