// VisitPlanPage — /visit-plan (SRS FR-10…FR-13, NFR-7 session-based).
// Layout: stacked and full width on phones/tablets (route map first, plan list
// below) so both are clearly visible on small screens; on large screens the
// ordered plan list sits left and the live route map right, with the map column
// sticking while the list scrolls. An empty plan shows only the empty-state card.

import { useVisitPlan } from '../hooks/useVisitPlan';
import usePageTitle from '../hooks/usePageTitle';
import usePageContent from '../hooks/usePageContent';
import PlanList from '../components/VisitPlan/PlanList';
import PlanRouteMap from '../components/VisitPlan/PlanRouteMap';
import Loader from '../components/Common/Loader';

export default function VisitPlanPage() {
  usePageTitle();
  const { get } = usePageContent('plan', {
    hero_title: 'My one-day plan',
    hero_subtitle:
      'Your plan is kept for this browser session only, with no account and no personal details needed.',
  });
  const { items, loading, moveItem, removePlace, clearPlan } = useVisitPlan();

  return (
    <div className="space-y-10 pb-8">
      {/* Hero — compact cover matching the Contact page size: cover video
          under a dark cinematic wash so the white copy stays readable (the
          dark background remains as the fallback if the video never arrives). */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-slate-900 px-4 py-12 text-white sm:px-6 sm:py-16">
        {/* Cover video or image */}
        {(() => {
          const cover = get('hero_cover');
          const isVideo = !cover || cover.endsWith('.mp4') || cover.endsWith('.webm');
          if (isVideo) {
            return (
              <video
                key={cover || 'default-plan-video'}
                className="absolute inset-0 h-full w-full object-cover"
                src={cover || '/My%20day%20plan%20page%20cover.mp4'}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
              />
            );
          }
          return (
            <img
              src={cover}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          );
        })()}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-900/50 to-slate-900/80"
        />
        <div className="relative mx-auto w-full max-w-3xl text-center [text-shadow:0_1px_16px_rgba(0,0,0,0.45)]">
          <h1 className="hero-in font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">{get('hero_title')}</h1>
          <p className="hero-in hero-in-2 mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            {get('hero_subtitle')}
          </p>
        </div>
      </section>

      {/* Layout: mobile/tablet stacked and full width (route map first, plan list
          below) so both stay clearly visible; large screens list left, map right. */}
      {loading ? (
        <div className="mx-auto max-w-3xl">
          <Loader label="Loading your plan…" />
        </div>
      ) : items.length === 0 ? (
        <div className="mx-auto max-w-3xl">
          <PlanList
            items={items}
            onMove={moveItem}
            onRemove={removePlace}
            onClear={clearPlan}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-8">
          {/* At lg+ the list scrolls inside its height (aligned with the map
              column: map h-[560px] + directions button row) so a long plan never
              pushes the map off screen; below lg it flows full width instead. */}
          <div className="order-2 min-w-0 lg:order-1 lg:max-h-[38rem] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            <PlanList
              items={items}
              onMove={moveItem}
              onRemove={removePlace}
              onClear={clearPlan}
            />
          </div>
          <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-24">
            <PlanRouteMap items={items} />
          </div>
        </div>
      )}
    </div>
  );
}
