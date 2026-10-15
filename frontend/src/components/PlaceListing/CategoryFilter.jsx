// CategoryFilter — filter places by one category at a time (SRS FR-2)
// with an "All" option that clears the active filter (SRS FR-3).

export default function CategoryFilter({ categories, activeCategory, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter places by category">
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={activeCategory === null}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          activeCategory === null
            ? 'bg-brand text-white'
            : 'bg-muted text-muted-foreground hover:bg-brand-light hover:text-brand-dark'
        }`}
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
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? 'bg-brand text-white'
                : 'bg-muted text-muted-foreground hover:bg-brand-light hover:text-brand-dark'
            }`}
          >
            {cat.category_name}
          </button>
        );
      })}
    </div>
  );
}
