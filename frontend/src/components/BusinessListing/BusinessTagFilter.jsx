// BusinessTagFilter — filter businesses by one tag at a time (Restaurant,
// Hotel, Vehicle Rental…) with an "All" option that clears the filter.
// Same pill behaviour as CategoryFilter: horizontal scroll-snap row on
// phones, wrapping from sm up.

export default function BusinessTagFilter({ tags, activeTag, onSelect }) {
  const pillClass = (active) =>
    `shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors min-h-10 ${
      active
        ? 'bg-brand text-white'
        : 'bg-muted text-muted-foreground hover:bg-brand-light hover:text-brand-dark'
    }`;

  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      role="group"
      aria-label="Filter businesses by tag"
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={activeTag === null}
        className={`snap-start ${pillClass(activeTag === null)}`}
      >
        All
      </button>
      {tags.map((tag) => {
        const active = activeTag === tag.category_id;
        return (
          <button
            key={tag.category_id}
            type="button"
            onClick={() => onSelect(active ? null : tag.category_id)}
            aria-pressed={active}
            className={`snap-start ${pillClass(active)}`}
          >
            {tag.category_name}
          </button>
        );
      })}
    </div>
  );
}
