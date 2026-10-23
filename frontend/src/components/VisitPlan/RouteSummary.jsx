// RouteSummary — displays total driving distance and estimated travel time
// between the user's starting location and all plan stops, calculated via
// the OSRM routing API (road-based, not straight-line).

import { Loader2 } from 'lucide-react';

function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
}

export default function RouteSummary({ distance, duration, stops, loading, hasUserLocation }) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[140px] items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
        <span className="text-sm font-medium text-muted-foreground">
          Calculating real road route & travel times…
        </span>
      </div>
    );
  }

  if (distance == null || duration == null) return null;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold sm:text-base text-foreground">
          Route Summary
        </h3>
        {hasUserLocation && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
            From your location
          </span>
        )}
      </div>

      {/* Clean stats without icons — big clear numbers and legible labels */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Total distance */}
        <div className="rounded-xl border border-border/60 bg-muted/30 px-2.5 py-3 text-center sm:px-3 sm:py-3.5">
          <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Total Distance
          </p>
          <p className="mt-1 font-heading text-base font-bold text-foreground sm:text-xl lg:text-2xl">
            {formatDistance(distance)}
          </p>
        </div>

        {/* Estimated travel time */}
        <div className="rounded-xl border border-border/60 bg-muted/30 px-2.5 py-3 text-center sm:px-3 sm:py-3.5">
          <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Driving Time
          </p>
          <p className="mt-1 font-heading text-base font-bold text-foreground sm:text-xl lg:text-2xl">
            {formatDuration(duration)}
          </p>
        </div>

        {/* Number of stops */}
        <div className="rounded-xl border border-border/60 bg-muted/30 px-2.5 py-3 text-center sm:px-3 sm:py-3.5">
          <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Stops
          </p>
          <p className="mt-1 font-heading text-base font-bold text-foreground sm:text-xl lg:text-2xl">
            {stops}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Road distances & driving times calculated via road network. Open Google Maps for live navigation.
      </p>
    </div>
  );
}
