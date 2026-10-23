// Google Maps helpers (frontend) — coordinate parsing for instant previews.
// The backend owns the authoritative parsing + short-link resolution; this
// mirror only powers the live map thumbnail in the admin place form.

export function parseCoordsFromGoogleMapsUrl(url) {
  const text = String(url || '');
  const patterns = [
    /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/, // /maps/.../@lat,lng,z
    /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/, // data in the URL hash
    /[?&](?:q|ll|center|query)=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/, // ?q=lat,lng
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }
  return null;
}

// Google embed URL for a place — always sourced from the place's Google Maps
// link, accurately:
//   1. coordinates resolved from the link (server follows short links);
//   2. coordinates parsed straight out of the link (full URLs);
//   3. the link itself as the query — Google resolves short links inside the
//      iframe — so a place with a Maps URL ALWAYS gets its map.
export function googleMapEmbedSrc(place, zoom = 15) {
  if (!place) return null;
  if (place.latitude != null && place.longitude != null) {
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
    }
  }
  const url = String(place.google_maps_url || '').trim();
  if (!url) return null;
  const parsed = parseCoordsFromGoogleMapsUrl(url);
  if (parsed) return `https://maps.google.com/maps?q=${parsed.lat},${parsed.lng}&z=${zoom}&output=embed`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
}
