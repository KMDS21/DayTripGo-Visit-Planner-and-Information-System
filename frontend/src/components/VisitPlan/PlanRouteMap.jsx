// PlanRouteMap — live route view of the day plan (SRS FR-12/FR-13, FR-8 map service).
// OpenStreetMap + Leaflet is the map service chosen in plan §4.5 (free, no quota),
// the same stack the place-detail map uses. Stops are numbered in visit order and
// the route line is derived from the ordered items, so any reorder / add / remove
// immediately redraws the route and refits the map.
//
// A free "Open route in Google Maps" directions link (origin -> stops in order ->
// destination) sits under the map for real turn-by-turn on the day; it needs no
// API key.

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Button from '../Common/Button';

const BRAND_TEAL = '#0e7c66'; // matches the DayTripGO pin in MapMarker

// Numbered DayTripGO pin — same silhouette as MapMarker, with the stop number in it.
function numberedPin(number) {
  return L.divIcon({
    className: '',
    html: `<div style="width:34px;height:46px;">
      <svg viewBox="0 0 34 46" width="34" height="46" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 29 17 29s17-16.2 17-29C34 7.6 26.4 0 17 0z" fill="${BRAND_TEAL}"/>
        <text x="17" y="23" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="700" fill="#ffffff">${number}</text>
      </svg>
    </div>`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -40],
  });
}

// Refits the viewport to the whole route whenever the stop list changes, so the
// full route is always visible after an add / remove / reorder.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    if (points.length === 1) {
      map.setView(bounds.getCenter(), 14);
    } else {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }
  }, [map, points]);
  return null;
}

// Free Google Maps directions URL for the ordered stops (no API key needed).
// The URL API allows up to 9 waypoints, so first stop -> middle stops -> last stop.
function directionsUrl(points) {
  const params = new URLSearchParams({
    api: '1',
    origin: `${points[0].lat},${points[0].lng}`,
    destination: `${points[points.length - 1].lat},${points[points.length - 1].lng}`,
    travelmode: 'driving',
  });
  const middle = points.slice(1, -1).slice(0, 9).map((p) => `${p.lat},${p.lng}`);
  if (middle.length) params.set('waypoints', middle.join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

export default function PlanRouteMap({ items }) {
  // Ordered stop list derived from the plan; invalid coordinates are skipped.
  const points = useMemo(
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

  const icons = useMemo(() => points.map((_, i) => numberedPin(i + 1)), [points]);

  if (!points.length) return null;

  const positions = points.map((p) => [p.lat, p.lng]);
  const total = points.length;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
        <MapContainer
          center={positions[0]}
          zoom={12}
          scrollWheelZoom={false}
          className="h-72 w-full sm:h-96 lg:h-[560px]"
          aria-label="Route map of your day plan, stops numbered in visiting order"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {total > 1 && (
            <>
              {/* White casing under the teal route keeps the line readable on the tiles */}
              <Polyline positions={positions} pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.9 }} />
              <Polyline positions={positions} pathOptions={{ color: BRAND_TEAL, weight: 4, opacity: 0.95 }} />
            </>
          )}
          {points.map((p, i) => (
            <Marker key={`${p.lat},${p.lng}`} position={[p.lat, p.lng]} icon={icons[i]}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                Stop {i + 1} of {total}
              </Popup>
            </Marker>
          ))}
          <FitBounds points={points} />
        </MapContainer>
      </div>

      <a href={directionsUrl(points)} target="_blank" rel="noopener noreferrer">
        <Button className="w-full">Open route in Google Maps</Button>
      </a>
    </div>
  );
}
