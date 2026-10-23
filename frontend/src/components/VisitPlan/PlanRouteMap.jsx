// PlanRouteMap — live route view of the day plan (SRS FR-12/FR-13, FR-8 map service).
// Uses Leaflet + OpenStreetMap tiles with real road-based routing via OSRM (free, no API key).
// Shows user's starting point (if set) and ordered plan stops, connected by real road paths.
// Calculates total driving distance and estimated travel time, and provides a direct
// Google Maps turn-by-turn navigation link.

import { useEffect, useMemo, useState, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Button from '../Common/Button';
import { Loader2 } from 'lucide-react';

const BRAND_TEAL = '#0e7c66';
const USER_BLUE = '#2563eb';

// Numbered DayTripGO pin for planned stops
function numberedPin(number) {
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:46px;" class="drop-shadow-md">
      <svg viewBox="0 0 34 46" width="34" height="46" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 29 17 29s17-16.2 17-29C34 7.6 26.4 0 17 0z" fill="${BRAND_TEAL}"/>
        <text x="17" y="23" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#ffffff">${number}</text>
      </svg>
    </div>`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -40],
  });
}

// Distinct Starting Point pin for user location
function userPin() {
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:46px;" class="drop-shadow-lg">
      <svg viewBox="0 0 34 46" width="34" height="46" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 29 17 29s17-16.2 17-29C34 7.6 26.4 0 17 0z" fill="${USER_BLUE}"/>
        <circle cx="17" cy="17" r="9" fill="#ffffff"/>
        <circle cx="17" cy="17" r="5" fill="${USER_BLUE}"/>
      </svg>
    </div>`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -40],
  });
}

// Refits map bounds whenever the stops or user location change
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || !points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    if (points.length === 1) {
      map.setView(bounds.getCenter(), 13);
    } else {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }
  }, [map, points]);
  return null;
}

// Free Google Maps directions URL for turn-by-turn navigation
function directionsUrl(userLocation, stopPoints) {
  if (!stopPoints.length) return '#';
  const origin = userLocation
    ? `${userLocation.lat},${userLocation.lng}`
    : `${stopPoints[0].lat},${stopPoints[0].lng}`;
  const destination = `${stopPoints[stopPoints.length - 1].lat},${stopPoints[stopPoints.length - 1].lng}`;

  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  });

  const waypoints = userLocation
    ? stopPoints.slice(0, -1).slice(0, 9).map((p) => `${p.lat},${p.lng}`)
    : stopPoints.slice(1, -1).slice(0, 9).map((p) => `${p.lat},${p.lng}`);

  if (waypoints.length) {
    params.set('waypoints', waypoints.join('|'));
  }
  return `https://www.google.com/maps/dir/?${params}`;
}

export default function PlanRouteMap({ items, userLocation, onRouteCalculated }) {
  const [roadCoordinates, setRoadCoordinates] = useState([]);
  const [routingLoading, setRoutingLoading] = useState(false);
  const abortControllerRef = useRef(null);

  // Stop points derived from plan items
  const stopPoints = useMemo(
    () =>
      (items || [])
        .map((it) => {
          const lat = Number(it?.place?.latitude);
          const lng = Number(it?.place?.longitude);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
          return { lat, lng, name: it.place.name };
        })
        .filter(Boolean),
    [items]
  );

  // All points including starting user location
  const allWaypoints = useMemo(() => {
    const list = [];
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      list.push({
        lat: userLocation.lat,
        lng: userLocation.lng,
        name: userLocation.label || 'Your Location',
        isUser: true,
      });
    }
    return list.concat(stopPoints);
  }, [userLocation, stopPoints]);

  const stopIcons = useMemo(() => stopPoints.map((_, i) => numberedPin(i + 1)), [stopPoints]);
  const userPinIcon = useMemo(() => userPin(), []);

  // Fetch real road route via OSRM whenever waypoints change
  useEffect(() => {
    if (allWaypoints.length < 2) {
      setRoadCoordinates([]);
      setRoutingLoading(false);
      onRouteCalculated?.(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setRoutingLoading(true);
    onRouteCalculated?.({ loading: true });

    // OSRM coordinates are in lng,lat order
    const coordsString = allWaypoints.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('OSRM route fetch failed');
        return res.json();
      })
      .then((data) => {
        const route = data.routes?.[0];
        if (route && route.geometry?.coordinates) {
          // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
          const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRoadCoordinates(latLngs);
          onRouteCalculated?.({
            distance: route.distance, // meters
            duration: route.duration, // seconds
            loading: false,
          });
        } else {
          throw new Error('No route found in response');
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.warn('Road routing error, falling back to direct lines:', err);
        // Fallback to straight lines if OSRM is unreachable
        const straight = allWaypoints.map((p) => [p.lat, p.lng]);
        setRoadCoordinates(straight);

        // Approximate distance using straight lines
        let approxDist = 0;
        for (let i = 0; i < allWaypoints.length - 1; i++) {
          const p1 = allWaypoints[i];
          const p2 = allWaypoints[i + 1];
          const R = 6371e3;
          const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
          const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((p1.lat * Math.PI) / 180) *
              Math.cos((p2.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          approxDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        // Road winding factor ~1.3, avg speed ~35km/h
        const estRoadDist = approxDist * 1.3;
        const estSec = (estRoadDist / 1000 / 35) * 3600;

        onRouteCalculated?.({
          distance: estRoadDist,
          duration: estSec,
          loading: false,
        });
      })
      .finally(() => {
        setRoutingLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [allWaypoints, onRouteCalculated]);

  if (!stopPoints.length && !userLocation) return null;

  const defaultCenter = allWaypoints.length ? [allWaypoints[0].lat, allWaypoints[0].lng] : [6.6621, 79.9234];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-border shadow-sm">
        {/* Loading overlay for route calculation */}
        {routingLoading && (
          <div className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-xl bg-card/90 px-3 py-1.5 text-xs font-medium text-brand shadow backdrop-blur-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Calculating road route…</span>
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={false}
          className="h-80 w-full sm:h-96 lg:h-[560px]"
          aria-label="Route map of your day plan, road-based routing with stops numbered in visiting order"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Road route line (with white outline for high contrast against tiles) */}
          {roadCoordinates.length > 1 && (
            <>
              <Polyline
                positions={roadCoordinates}
                pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }}
              />
              <Polyline
                positions={roadCoordinates}
                pathOptions={{ color: BRAND_TEAL, weight: 4.5, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }}
              />
            </>
          )}

          {/* User Starting Point Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userPinIcon}>
              <Popup>
                <div className="p-1">
                  <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Starting Point
                  </span>
                  <p className="mt-1 font-semibold text-foreground">{userLocation.label || 'Your Location'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Planned Stop Markers */}
          {stopPoints.map((p, i) => (
            <Marker key={`${p.lat},${p.lng}-${i}`} position={[p.lat, p.lng]} icon={stopIcons[i]}>
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stop {i + 1} of {stopPoints.length}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          <FitBounds points={allWaypoints} />
        </MapContainer>
      </div>

      {stopPoints.length > 0 && (
        <a href={directionsUrl(userLocation, stopPoints)} target="_blank" rel="noopener noreferrer">
          <Button className="w-full">
            {userLocation ? 'Open route from your location in Google Maps' : 'Open route in Google Maps'}
          </Button>
        </a>
      )}
    </div>
  );
}
