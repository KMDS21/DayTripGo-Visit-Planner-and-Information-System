// formatHours — plan §14.3 Step 21: formatHours(openTime, closeTime) → "8:00 AM – 5:00 PM".
// Also exports normaliseHours(text) which prettifies the free-text opening_hours
// stored in the DB (SRS §6.1: VARCHAR free text) for display (FR-5).

const DASH = '\u2013'; // en dash

function to12h(minutes) {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatHours(openTime, closeTime) {
  if (openTime === undefined || closeTime === undefined) return '';
  return `${openTime} ${DASH} ${closeTime}`;
}

// Prettify stored free text: unify dashes, collapse whitespace, keep the rest intact.
export function normaliseHours(text) {
  if (!text) return '';
  return String(text)
    .replace(/\s*[-\u2013\u2014]\s*/g, ` ${DASH} `)
    .replace(/\s+/g, ' ')
    .trim();
}

export { to12h };
