// hoursRange — the admin place form edits Opening hours as a time range
// (From / To <input type="time">) plus an optional note such as "daily" or
// "visits by arrangement". The column itself stays free text (SRS §6.1
// varchar(100)) and the public screens still show that same string, so these
// two helpers translate between the three form fields and the stored value:
//
//   "5:30 AM - 8:00 PM daily"  <->  { from: '05:30', to: '20:00', note: 'daily' }

import { to12h } from './formatHours';

// "6:00 AM - 8:00 PM", "9 AM – 5 PM", "8:00 a.m. - 5:00 p.m."
const RANGE_RE =
  /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\s*[-\u2013\u2014]\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i;

function to24(hourStr, minStr, ampm) {
  let h = Number(hourStr);
  const m = Number(minStr || 0);
  const isPm = ampm.toLowerCase().replace(/\./g, '') === 'pm';
  if (isPm && h !== 12) h += 12;
  if (!isPm && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':');
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}

// Remove any time range from a note and tidy what is left, so the note never
// repeats the range the pickers already carry. "(boat rides )" → "(boat rides)".
function stripRange(text) {
  return String(text)
    .replace(RANGE_RE, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([),.;])/g, '$1')
    .replace(/^[\s,.\-\u2013\u2014]+/, '')
    .trim();
}

// Stored string -> the three form fields.
export function parseHoursRange(text) {
  const raw = String(text || '').trim();
  if (!raw) return { from: '', to: '', note: '' };

  const match = RANGE_RE.exec(raw);
  // The range only counts when it opens the string. A note that merely mentions
  // a time — "Open all day (boat rides 7:00 AM - 5:00 PM)" — stays whole instead
  // of being cut in half.
  if (match && match.index === 0) {
    return {
      from: to24(match[1], match[2], match[3]),
      to: to24(match[4], match[5], match[6]),
      note: stripRange(raw.slice(match[0].length)),
    };
  }
  return { from: '', to: '', note: raw };
}

// The three form fields -> the string saved to opening_hours. Both times are
// needed for a range; otherwise only the note is kept.
export function composeHours(from, to, note) {
  const trimmed = String(note || '').trim();
  if (!from || !to) return trimmed;
  const range = `${to12h(toMinutes(from))} - ${to12h(toMinutes(to))}`;
  const rest = stripRange(trimmed);
  return rest ? `${range} ${rest}` : range;
}
