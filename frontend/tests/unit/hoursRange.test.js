// Unit — the admin place-form Opening hours time-range <-> stored string
// translation (SRS §6.1 varchar(100) free text).

import { describe, test, expect } from 'vitest';
import { parseHoursRange, composeHours } from '../../src/utils/hoursRange';

describe('parseHoursRange', () => {
  test('parses a full range with a trailing note', () => {
    expect(parseHoursRange('5:30 AM - 8:00 PM daily')).toEqual({
      from: '05:30',
      to: '20:00',
      note: 'daily',
    });
  });

  test('parses times written without minutes and with dotted meridiems', () => {
    expect(parseHoursRange('8:00 a.m. - 5:00 p.m.')).toEqual({
      from: '08:00',
      to: '17:00',
      note: '',
    });
    expect(parseHoursRange('9 AM – 5 PM')).toEqual({ from: '09:00', to: '17:00', note: '' });
  });

  test('handles noon and midnight correctly', () => {
    expect(parseHoursRange('12:00 PM - 12:00 AM')).toEqual({
      from: '12:00',
      to: '00:00',
      note: '',
    });
    expect(parseHoursRange('12:00 AM - 11:59 PM')).toEqual({
      from: '00:00',
      to: '23:59',
      note: '',
    });
  });

  test('empty input yields three empty fields', () => {
    expect(parseHoursRange('')).toEqual({ from: '', to: '', note: '' });
    expect(parseHoursRange(null)).toEqual({ from: '', to: '', note: '' });
    expect(parseHoursRange(undefined)).toEqual({ from: '', to: '', note: '' });
  });

  test('text without a leading range keeps the whole string as the note', () => {
    expect(parseHoursRange('Visits by arrangement')).toEqual({
      from: '',
      to: '',
      note: 'Visits by arrangement',
    });
  });

  test('a range in the MIDDLE of the text is not treated as the range', () => {
    const raw = 'Open all day (boat rides 7:00 AM - 5:00 PM)';
    expect(parseHoursRange(raw)).toEqual({ from: '', to: '', note: raw });
  });
});

describe('composeHours', () => {
  test('builds "range + note" from the three fields', () => {
    expect(composeHours('05:30', '20:00', 'daily')).toBe('5:30 AM - 8:00 PM daily');
  });

  test('range with no note produces just the range', () => {
    expect(composeHours('08:00', '17:00', '  ')).toBe('8:00 AM - 5:00 PM');
  });

  test('a missing side falls back to the note alone', () => {
    expect(composeHours('08:00', '', 'visits by arrangement')).toBe('visits by arrangement');
    expect(composeHours('', '', 'daily')).toBe('daily');
    expect(composeHours('', '', '')).toBe('');
  });

  test('a range repeated inside the note is stripped (no duplication)', () => {
    expect(composeHours('08:00', '17:00', 'daily (7:00 AM - 5:00 PM)')).toBe('8:00 AM - 5:00 PM daily');
  });

  test('round-trips: compose → parse returns the same fields', () => {
    const stored = composeHours('05:30', '20:00', 'daily');
    expect(parseHoursRange(stored)).toEqual({ from: '05:30', to: '20:00', note: 'daily' });
  });
});
