// MapEmbed — embedded OpenStreetMap view centred on the place (SRS FR-8, FR-9).
// OpenStreetMap + Leaflet is the map service chosen in plan §4.5 (free, no quota).

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapMarker from './MapMarker';

export default function MapEmbed({ latitude, longitude, name }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const position = [lat, lng];

  return (
    <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
      <MapContainer
        center={position}      // FR-9: centred on the place
        zoom={13}              // FR-9: appropriate zoom
        scrollWheelZoom={false}
        className="h-72 w-full sm:h-80"
        aria-label={`Map showing the location of ${name}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMarker position={position} label={name} />
      </MapContainer>
    </div>
  );
}
