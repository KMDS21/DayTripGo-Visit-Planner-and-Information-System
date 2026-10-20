// Google Maps helpers — URL sanity check + coordinate parsing + short-link
// resolution. Admins paste a Google Maps link instead of typing coordinates;
// the coordinates for every map view are derived from it.

// Accepts the common share forms:
//   https://www.google.com/maps/.../@6.9028,79.8699,17z
//   https://maps.app.goo.gl/AbC123        (short links — no coordinates)
//   https://goo.gl/maps/...
function isGoogleMapsUrl(url) {
  const text = String(url || '').trim();
  return (
    /^https:\/\/(?:www\.|m\.)?google\.[a-z.]+\/maps\b/i.test(text) ||
    /^https:\/\/maps\.app\.goo\.gl\//i.test(text) ||
    /^https:\/\/goo\.gl\/maps\//i.test(text)
  );
}

// Extracts { lat, lng } from the URL when it carries coordinates; returns
// null for short links (maps.app.goo.gl) or anything unrecognised.
function parseCoordsFromGoogleMapsUrl(url) {
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

// ── Short share links (maps.app.goo.gl, goo.gl/maps) ─────────────────────
// They carry no coordinates in the URL itself. Follow the redirect ONCE
// server-side and parse the destination; successes are cached for the life
// of the process, failed resolutions are retried after a minute.
const RESOLVE_CACHE = new Map(); // url -> { coords: {lat,lng}|null, at: number }
const RESOLVE_TIMEOUT_MS = 4000;
const NEGATIVE_TTL_MS = 60 * 1000;

function isShortMapsLink(url) {
  const text = String(url || '');
  return /^https:\/\/maps\.app\.goo\.gl\//i.test(text) || /^https:\/\/goo\.gl\/maps\//i.test(text);
}

async function resolveCoordsFromGoogleMapsUrl(url) {
  const text = String(url || '').trim();
  const direct = parseCoordsFromGoogleMapsUrl(text);
  if (direct || !isShortMapsLink(text)) return direct;

  const cached = RESOLVE_CACHE.get(text);
  if (cached && (cached.coords || Date.now() - cached.at < NEGATIVE_TTL_MS)) return cached.coords;

  let coords = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
    const res = await fetch(text, { redirect: 'follow', signal: controller.signal });
    clearTimeout(timer);
    coords = (res && res.url && parseCoordsFromGoogleMapsUrl(res.url)) || null;
  } catch {
    coords = null; // offline / timeout — keep the plain link, no map
  }
  RESOLVE_CACHE.set(text, { coords, at: Date.now() });
  return coords;
}

module.exports = { isGoogleMapsUrl, parseCoordsFromGoogleMapsUrl, resolveCoordsFromGoogleMapsUrl };
