// VisitPlanPage — /visit-plan (SRS FR-10…FR-13, NFR-7 session-based).

import { useVisitPlan } from '../hooks/useVisitPlan';
import PlanList from '../components/VisitPlan/PlanList';
import Loader from '../components/Common/Loader';

export default function VisitPlanPage() {
  const { items, loading, totalDistance, moveItem, removePlace, clearPlan } = useVisitPlan();

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <header>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">My one-day plan</h1>
        <p className="mt-2 text-muted-foreground">
          Your plan is kept for this browser session only — no account, no personal details needed.
        </p>
      </header>

      {loading ? (
        <Loader label="Loading your plan…" />
      ) : (
        <PlanList
          items={items}
          totalDistance={totalDistance}
          onMove={moveItem}
          onRemove={removePlace}
          onClear={clearPlan}
        />
      )}
    </div>
  );
}
