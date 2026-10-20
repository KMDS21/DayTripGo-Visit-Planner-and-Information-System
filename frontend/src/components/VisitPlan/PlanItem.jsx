// PlanItem — one row of the day plan: order, place details, reorder controls
// (keyboard-accessible arrows + drag handle) and remove (SRS FR-11, FR-13).
// Below sm the row stacks: name + meta on top, order badge + controls on a
// second line with ~44px touch targets (HTML5 drag does not fire on touch,
// so the arrows are the primary reorder method on phones).

import { Link } from 'react-router-dom';
import Badge from '../Common/Badge';
import { formatDistance } from '../../utils/formatDistance';

const controlClass =
  'flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:opacity-30';

export default function PlanItem({ item, index, total, onMove, onRemove }) {
  const place = item.place;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      {/* Mobile: badge + name share the top row; desktop keeps the old inline layout */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="hidden h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark sm:flex"
          aria-hidden="true"
          title="Drag to reorder"
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            <Link to={`/places/${place.place_id}`} className="hover:text-brand">
              {place.name}
            </Link>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark sm:hidden" aria-hidden="true">
              {index + 1}
            </span>
            <Badge variant="distance">{formatDistance(place.distance_km)}</Badge>
            <span className="truncate text-xs text-muted-foreground">
              {place.opening_hours || 'Hours not specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls — own row on mobile so targets stay big; inline at sm+ */}
      <div className="flex shrink-0 items-center justify-between gap-1 border-t border-border/60 pt-2 sm:justify-end sm:border-0 sm:pt-0">
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          aria-label={`Move ${place.name} earlier`}
          className={`${controlClass} text-muted-foreground hover:bg-muted hover:text-foreground`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          aria-label={`Move ${place.name} later`}
          className={`${controlClass} text-muted-foreground hover:bg-muted hover:text-foreground`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onRemove(place.place_id)}
          aria-label={`Remove ${place.name} from plan`}
          className={`${controlClass} text-red-500 hover:bg-red-50 hover:text-red-700`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </div>
    </li>
  );
}
