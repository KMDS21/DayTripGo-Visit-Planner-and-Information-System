// PlaceGrid — responsive grid of PlaceCards with empty state (SRS FR-1, NFR-9).

import PlaceCard from './PlaceCard';

export default function PlaceGrid({ places, categories, hasPlace, onAdd }) {
  const categoryName = (id) => categories.find((c) => c.category_id === id)?.category_name;

  if (!places.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
        No places match this filter yet.
      </div>
    );
  }

  // Capped at 4 columns (was 5 at 2xl) so cards stay readable on wide
  // screens; the grid is centred with a max width so it doesn't stretch
  // edge-to-edge on 2K+ monitors.
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {places.map((place) => (
        <PlaceCard
          key={place.place_id}
          place={place}
          categoryName={categoryName(place.category_id)}
          inPlan={hasPlace(place.place_id)}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}
