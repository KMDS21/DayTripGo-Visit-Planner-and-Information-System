// placeImage — photo helper (SRS FR-1/FR-7: photo "where available").
// Seeds store image_url = NULL, so a branded per-category gradient SVG is
// generated as a graceful placeholder until real photos are added by the admin.

const GRADIENTS = {
  Religious: ['#0e7c66', '#14b8a6'],
  Nature: ['#166534', '#84cc16'],
  Heritage: ['#92400e', '#f59e0b'],
  Cultural: ['#7e22ce', '#e879f9'],
  Place: ['#0e7c66', '#14b8a6'],
};

export function categoryGradient(categoryName = 'Place') {
  return GRADIENTS[categoryName] || GRADIENTS.Place;
}

function escapeXml(text) {
  return String(text).replace(/[<>&'"]/g, (ch) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[ch]
  );
}

export function placeImage(place, categoryName = 'Place') {
  if (place?.image_url) return place.image_url;

  const [c1, c2] = categoryGradient(categoryName);
  const name = escapeXml(place?.name || 'DayTripGO');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="600" height="450" fill="url(#g)"/>
  <g fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2">
    <circle cx="470" cy="90" r="60"/><circle cx="90" cy="380" r="90"/>
  </g>
  <path d="M300 150c-38 0-68 30-68 68 0 51 68 108 68 108s68-57 68-108c0-38-30-68-68-68z" fill="rgba(255,255,255,0.9)"/>
  <circle cx="300" cy="218" r="26" fill="${c1}"/>
  <text x="300" y="392" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="white">${name}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
