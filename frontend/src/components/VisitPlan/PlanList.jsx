// PlanList — consolidated one-day plan view (SRS FR-12) with reorder (FR-13)
// and remove (FR-11). Shows the running total distance between selected places.

import { Link } from 'react-router-dom';
import Button from '../Common/Button';
import DragReorder from './DragReorder';
import PlanItem from './PlanItem';
import { formatDistance } from '../../utils/formatDistance';

export default function PlanList({ items, totalDistance, onMove, onRemove, onClear }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-heading text-2xl font-bold">Your day plan is empty</p>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Browse the places list and tap “Add to plan” to start building your one-day trip around Wadduwa.
        </p>
        <Link to="/">
          <Button className="mt-6">Explore places</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-light px-5 py-4 lg:sticky lg:top-0 lg:z-10">
        <p className="text-sm text-brand-dark">
          <span className="font-bold">{items.length}</span> place{items.length > 1 ? 's' : ''} in your day plan ·
          roughly <span className="font-bold">{formatDistance(totalDistance)}</span> of travel
        </p>
        {/* Soft-red button (light tint + red text, was a faint ghost link) so the
            clear action is clearly visible without a heavy solid red; sticky at
            lg+ so it stays in reach while the list column scrolls. */}
        <Button variant="danger-soft" onClick={onClear}>
          Clear plan
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag rows (or use the ↑ ↓ buttons) to set your visiting order, as this is the order you would follow on the
        day.
      </p>

      <DragReorder items={items} onMove={onMove}>
        {(item, index) => (
          <PlanItem item={item} index={index} total={items.length} onMove={onMove} onRemove={onRemove} />
        )}
      </DragReorder>
    </div>
  );
}
