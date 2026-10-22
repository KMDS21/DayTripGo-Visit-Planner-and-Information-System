// PlaceGrid — responsive grid of PlaceCards with empty state (SRS FR-1, NFR-9).
// `limitBelowXl` shows only the first four cards on screens up to and including
// 1280px (the Home page uses it under its full-screen hero); every card returns
// from 1281px up. Explore always lists everything.

import PlaceCard from './PlaceCard';

export default function PlaceGrid({ places, categories, hasPlace, onAdd, onOpen, limitBelowXl }) {
  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name;

  if (!places.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
        No places match this filter yet.
      </div>
    );
  }

  // Full-width grid so cards use the whole width: 4 cards with full width
  // on lower screen sizes (<1200px), and 5 places in a line on higher display (≥1200px / xl).
  return (
    <div
      className={`w-full grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 min-[1200px]:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5${
        limitBelowXl ? ' grid-cards-4' : ''
      }`}
    >
      {places.map((place) => (
        <PlaceCard
          key={place.place_id}
          place={place}
          categoryName={categoryName(place.category_id)}
          inPlan={hasPlace(place.place_id)}
          onAdd={onAdd}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
