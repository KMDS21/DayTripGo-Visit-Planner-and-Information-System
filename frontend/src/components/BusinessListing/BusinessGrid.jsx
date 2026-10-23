// BusinessGrid — responsive grid of BusinessCards with an empty state.
// Same column rhythm as PlaceGrid so Explore looks identical in both tabs.

import BusinessCard from './BusinessCard';

export default function BusinessGrid({ businesses, tags, onOpen }) {
  const tagNamesFor = (business) =>
    (business.tags || [])
      .map((id) => tags.find((t) => t.category_id === id)?.category_name)
      .filter(Boolean);

  if (!businesses.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
        No businesses match this filter yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {businesses.map((business) => (
        <BusinessCard
          key={business.business_id}
          business={business}
          tagNames={tagNamesFor(business)}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
