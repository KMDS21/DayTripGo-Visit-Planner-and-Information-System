// CategoryFilter — filter places by one category at a time (SRS FR-2)
// with an "All" option that clears the active filter (SRS FR-3).
// On phones the pills sit in a single horizontal scroll-snap row (rather than
// wrapping onto three+ lines); from sm up they wrap as before.

export default function CategoryFilter({ categories, activeCategory, onSelect }) {
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
      aria-label="Filter places by category"
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={activeCategory === null}
        className={`snap-start ${pillClass(activeCategory === null)}`}
      >
        All
      </button>
      {categories.map((cat) => {
        const active = activeCategory === cat.category_id;
        return (
          <button
            key={cat.category_id}
            type="button"
            onClick={() => onSelect(active ? null : cat.category_id)}
            aria-pressed={active}
            className={`snap-start ${pillClass(active)}`}
          >
            {cat.category_name}
          </button>
        );
      })}
    </div>
  );
}
