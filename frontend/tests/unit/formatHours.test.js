// Unit — opening-hours formatting (plan §14.3 Step 21, SRS FR-5).

import { describe, test, expect } from 'vitest';
import { formatHours, normaliseHours, to12h } from '../../src/utils/formatHours';

describe('to12h', () => {
  test.each([
    [0, '12:00 AM'],
    [480, '8:00 AM'],
    [330, '5:30 AM'],
    [719, '11:59 AM'],
    [720, '12:00 PM'],
    [725, '12:05 PM'],
    [1020, '5:00 PM'],
    [1439, '11:59 PM'],
  ])('to12h(%i) → %s', (minutes, expected) => {
    expect(to12h(minutes)).toBe(expected);
  });
});

describe('formatHours', () => {
  test('joins the two times with an en dash', () => {
    expect(formatHours('8:00 AM', '5:00 PM')).toBe('8:00 AM – 5:00 PM');
  });

  test('returns an empty string when either side is missing', () => {
    expect(formatHours(undefined, undefined)).toBe('');
    expect(formatHours('8:00 AM', undefined)).toBe('');
    expect(formatHours(undefined, '5:00 PM')).toBe('');
  });
});

describe('normaliseHours', () => {
  test('unifies hyphen/em/en dashes into a spaced en dash', () => {
    expect(normaliseHours('9:00 - 17:00')).toBe('9:00 – 17:00');
    expect(normaliseHours('9:00 – 17:00')).toBe('9:00 – 17:00');
    expect(normaliseHours('Mon—Sat 8:00 AM - 5:00 PM')).toBe('Mon – Sat 8:00 AM – 5:00 PM');
  });

  test('collapses whitespace and trims the ends', () => {
    expect(normaliseHours('  8:00 AM    -   5:00 PM  ')).toBe('8:00 AM – 5:00 PM');
    expect(normaliseHours('Daily\n  8:00 AM-5:00 PM')).toBe('Daily 8:00 AM – 5:00 PM');
  });

  test('returns an empty string for empty input', () => {
    expect(normaliseHours('')).toBe('');
    expect(normaliseHours(null)).toBe('');
    expect(normaliseHours(undefined)).toBe('');
  });
});
