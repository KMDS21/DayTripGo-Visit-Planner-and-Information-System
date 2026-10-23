// VisitPlanPage — /visit-plan (SRS FR-10…FR-13, NFR-7 session-based).
// Features:
// 1) First section: starting location input (auto GPS detect or address search)
// 2) Road-based route calculation & real-time travel time & distance via OSRM
// 3) Interactive Leaflet map with road line geometry & numbered stops
// 4) Reorderable stop list & Google Maps live navigation export

import { useState } from 'react';
import { useVisitPlan } from '../hooks/useVisitPlan';
import usePageTitle from '../hooks/usePageTitle';
import usePageContent from '../hooks/usePageContent';
import PlanList from '../components/VisitPlan/PlanList';
import PlanRouteMap from '../components/VisitPlan/PlanRouteMap';
import UserLocationInput from '../components/VisitPlan/UserLocationInput';
import RouteSummary from '../components/VisitPlan/RouteSummary';
import Loader from '../components/Common/Loader';

export default function VisitPlanPage() {
  usePageTitle();
  const { get } = usePageContent('plan', {
    hero_title: 'My one-day plan',
    hero_subtitle:
      'Your plan is kept for this browser session only, with no account and no personal details needed.',
  });
  const { items, loading, moveItem, removePlace, clearPlan } = useVisitPlan();

  const [userLocation, setUserLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero — compact cover video/image */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-slate-900 px-4 py-12 text-white sm:px-6 sm:py-16">
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

      {/* Main Content Area */}
      {loading ? (
        <div className="mx-auto max-w-3xl px-4">
          <Loader label="Loading your plan…" />
        </div>
      ) : items.length === 0 ? (
        <div className="mx-auto max-w-3xl px-4">
          <PlanList
            items={items}
            onMove={moveItem}
            onRemove={removePlace}
            onClear={clearPlan}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
          {/* First Section: User Starting Location & Route Summary */}
          <section className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
            <UserLocationInput
              location={userLocation}
              onLocationChange={setUserLocation}
            />
            {routeInfo ? (
              <RouteSummary
                distance={routeInfo.distance}
                duration={routeInfo.duration}
                stops={items.length}
                loading={routeInfo.loading}
                hasUserLocation={Boolean(userLocation)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-5 text-center text-muted-foreground">
                <p className="text-sm font-semibold text-foreground">Interactive Road Routing</p>
                <p className="mt-1 text-xs max-w-xs">
                  Set your starting point above or view driving distance and times calculated across your stops.
                </p>
              </div>
            )}
          </section>

          {/* Second Section: Ordered Plan List + Sticky Live Route Map */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Left: Reorderable stop list */}
            <div className="order-2 min-w-0 lg:order-1 lg:max-h-[38rem] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
              <PlanList
                items={items}
                onMove={moveItem}
                onRemove={removePlace}
                onClear={clearPlan}
              />
            </div>

            {/* Right: Road-based Map */}
            <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-24">
              <PlanRouteMap
                items={items}
                userLocation={userLocation}
                onRouteCalculated={setRouteInfo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
