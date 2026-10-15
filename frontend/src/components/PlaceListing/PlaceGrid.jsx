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

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
