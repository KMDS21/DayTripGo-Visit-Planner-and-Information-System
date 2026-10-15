// MapMarker — single place marker with a custom DayTripGO pin (SRS FR-8).

import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:34px;height:46px;">
    <svg viewBox="0 0 34 46" width="34" height="46" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 29 17 29s17-16.2 17-29C34 7.6 26.4 0 17 0z" fill="#0e7c66"/>
      <circle cx="17" cy="17" r="6.5" fill="#ffffff"/>
    </svg>
  </div>`,
  iconSize: [34, 46],
  iconAnchor: [17, 46],
  popupAnchor: [0, -40],
});

export default function MapMarker({ position, label }) {
  return (
    <Marker position={position} icon={pinIcon}>
      <Popup>{label}</Popup>
    </Marker>
  );
}
