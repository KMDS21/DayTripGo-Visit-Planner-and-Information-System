// isOpenNow — plan §14.3 Step 21 + SRS FR-4 (Optional: open/closed indicator
// computed from the stored opening_hours free text).
// Returns true / false, or null when hours cannot be parsed (no badge shown).

import { to12h } from './formatHours';

const RANGE_RE =
  /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\s*[-\u2013\u2014]\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i;

function toMinutes(hourStr, minStr, ampm) {
  let h = Number(hourStr);
  const m = Number(minStr || 0);
  const isPm = ampm.toLowerCase().replace(/\./g, '') === 'pm';
  if (isPm && h !== 12) h += 12;
  if (!isPm && h === 12) h = 0;
  return h * 60 + m;
}

// Parse "5:30 AM - 8:00 PM daily" style text → { open, close } minutes, or null.
export function parseHours(text) {
  if (!text) return null;
  if (/open all day|24\s*hours|always open/i.test(text)) return { open: 0, close: 24 * 60 };
  const match = String(text).match(RANGE_RE);
  if (!match) return null;
  const open = toMinutes(match[1], match[2], match[3]);
  const close = toMinutes(match[4], match[5], match[6]);
  return { open, close };
}

// Plan signature: isOpenNow(openTime, closeTime) with "8:00 AM" style strings.
export function isOpenNow(openTime, closeTime) {
  const open = parseHours(`${openTime} - ${closeTime}`);
  if (!open) return false;
  return isOpenFromRange(open);
}

function isOpenFromRange({ open, close }) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  if (open === 0 && close === 24 * 60) return true;
  if (close > open) return mins >= open && mins < close;
  return mins >= open || mins < close; // closes after midnight
}

// Practical helper for stored free text: null = unknown (hide badge).
export function isOpenFromText(text) {
  const range = parseHours(text);
  if (!range) return null;
  return isOpenFromRange(range);
}

export { to12h };
