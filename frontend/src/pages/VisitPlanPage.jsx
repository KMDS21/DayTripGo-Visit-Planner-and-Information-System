// VisitPlanPage — /visit-plan (SRS FR-10…FR-13, NFR-7 session-based).

import { useVisitPlan } from '../hooks/useVisitPlan';
import usePageTitle from '../hooks/usePageTitle';
import PlanList from '../components/VisitPlan/PlanList';
import Loader from '../components/Common/Loader';

export default function VisitPlanPage() {
  usePageTitle('My Day Plan');
  const { items, loading, totalDistance, moveItem, removePlace, clearPlan } = useVisitPlan();

  return (
    <div className="space-y-10 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-brand-dark via-brand to-teal-500 px-6 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">My one-day plan</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Your plan is kept for this browser session only — no account, no personal
            details needed.
          </p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10" />
      </section>

      <div className="mx-auto max-w-3xl space-y-6">
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
    </div>
  );
}
