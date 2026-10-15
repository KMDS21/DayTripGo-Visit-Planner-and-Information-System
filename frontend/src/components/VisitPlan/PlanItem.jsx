// PlanItem — one row of the day plan: order, place details, reorder controls
// (keyboard-accessible arrows + drag handle) and remove (SRS FR-11, FR-13).

import { Link } from 'react-router-dom';
import Badge from '../Common/Badge';
import { formatDistance } from '../../utils/formatDistance';

export default function PlanItem({ item, index, total, onMove, onRemove }) {
  const place = item.place;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:gap-4 sm:p-4">
      <span
        className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark"
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
          <Badge variant="distance">{formatDistance(place.distance_km)}</Badge>
          <span className="truncate text-xs text-muted-foreground">
            {place.opening_hours || 'Hours not specified'}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          aria-label={`Move ${place.name} earlier`}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          aria-label={`Move ${place.name} later`}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onRemove(place.place_id)}
          aria-label={`Remove ${place.name} from plan`}
          className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </div>
    </li>
  );
}
