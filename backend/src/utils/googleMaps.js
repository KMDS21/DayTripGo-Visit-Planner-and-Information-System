// Google Maps helpers — URL sanity check + coordinate parsing.
// Admins paste a Google Maps link instead of typing latitude/longitude; the
// coordinates for the embedded OpenStreetMap views are derived from it.

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
    /[?&](?:q|ll|center)=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/, // ?q=lat,lng
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

module.exports = { isGoogleMapsUrl, parseCoordsFromGoogleMapsUrl };
