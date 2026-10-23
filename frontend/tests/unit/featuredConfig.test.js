// Unit — "Featured escapes" CSV/cover-pair serialisation (admin content editor)
// and the plain id lists the home page selections use.

import { describe, test, expect } from 'vitest';
import {
  BUSINESS_FEATURED_KEYS,
  parseFeaturedRows,
  parseIdCsv,
  serializeFeaturedRows,
  serializeIdCsv,
} from '../../src/utils/featuredConfig';

describe('parseFeaturedRows', () => {
  test('pairs ids with their covers in display order', () => {
    expect(parseFeaturedRows('3,7,1', '3=/uploads/places/a.png;7=')).toEqual([
      { id: 3, cover: '/uploads/places/a.png' },
      { id: 7, cover: '' },
      { id: 1, cover: '' },
    ]);
  });

  test('empty input yields no rows', () => {
    expect(parseFeaturedRows('', '')).toEqual([]);
    expect(parseFeaturedRows()).toEqual([]);
    expect(parseFeaturedRows(null, undefined)).toEqual([]);
  });

  test('drops junk ids (zero, negative, non-numeric, blanks)', () => {
    expect(parseFeaturedRows('0,-2,abc, ,5', '')).toEqual([{ id: 5, cover: '' }]);
  });

  test('tolerates spaces around ids and pairs, and stray pairs', () => {
    expect(parseFeaturedRows(' 4 , 6 ', ' =nope ; 4 = /uploads/x.png ;')).toEqual([
      { id: 4, cover: '/uploads/x.png' },
      { id: 6, cover: '' },
    ]);
  });

  test('covers for ids that are not in the list are ignored', () => {
    expect(parseFeaturedRows('4', '9=/uploads/ghost.png')).toEqual([{ id: 4, cover: '' }]);
  });
});

describe('serializeFeaturedRows', () => {
  test('emits the CSV and the id=cover pairs', () => {
    expect(
      serializeFeaturedRows([
        { id: 3, cover: '/uploads/x.png' },
        { id: 7, cover: '' },
        { id: 9 },
      ])
    ).toEqual({
      featured_place_ids: '3,7,9',
      featured_covers: '3=/uploads/x.png',
    });
  });

  test('invalid and empty rows are filtered out', () => {
    expect(
      serializeFeaturedRows([{ id: 0 }, { id: 'abc' }, null, undefined, { id: '5' }])
    ).toEqual({
      featured_place_ids: '5',
      featured_covers: '',
    });
  });

  test('no rows → both sections empty', () => {
    expect(serializeFeaturedRows([])).toEqual({
      featured_place_ids: '',
      featured_covers: '',
    });
    expect(serializeFeaturedRows(undefined)).toEqual({
      featured_place_ids: '',
      featured_covers: '',
    });
  });

  test('round-trips: parse → serialize → parse is stable', () => {
    const original = parseFeaturedRows('3,7,1', '3=/uploads/places/a.png;7=');
    const again = parseFeaturedRows(
      serializeFeaturedRows(original).featured_place_ids,
      serializeFeaturedRows(original).featured_covers
    );
    expect(again).toEqual(original);
  });

  // Businesses keep their own sections so the places editor is untouched.
  test('business rows write the business sections, not the place ones', () => {
    expect(serializeFeaturedRows([{ id: 4, cover: '' }], BUSINESS_FEATURED_KEYS)).toEqual({
      featured_business_ids: '4',
      featured_business_covers: '',
    });
    // …and the default keys still serialise to the place sections.
    expect(serializeFeaturedRows([{ id: 4, cover: '' }])).toEqual({
      featured_place_ids: '4',
      featured_covers: '',
    });
  });

  test('a business row round-trips through the business sections', () => {
    const original = [{ id: 12, cover: '' }, { id: 3, cover: '/uploads/places/b.png' }];
    const saved = serializeFeaturedRows(original, BUSINESS_FEATURED_KEYS);
    expect(parseFeaturedRows(saved.featured_business_ids, saved.featured_business_covers)).toEqual(original);
  });
});

describe('parseIdCsv / serializeIdCsv', () => {
  test('reads the home page id lists', () => {
    expect(parseIdCsv('3,7,1')).toEqual([3, 7, 1]);
    expect(parseIdCsv(' 4 , 6 ')).toEqual([4, 6]);
  });

  test('junk entries are dropped, empty input yields nothing', () => {
    expect(parseIdCsv('0,-2,abc, ,5')).toEqual([5]);
    expect(parseIdCsv('')).toEqual([]);
    expect(parseIdCsv()).toEqual([]);
    expect(parseIdCsv(null)).toEqual([]);
  });

  test('round-trips and de-duplicates', () => {
    expect(serializeIdCsv([3, 7, 1])).toBe('3,7,1');
    expect(serializeIdCsv([3, 3, 7])).toBe('3,7');
    expect(serializeIdCsv(parseIdCsv('3,7,1'))).toBe('3,7,1');
    expect(serializeIdCsv([])).toBe('');
  });

  test('drops invalid ids on the way out', () => {
    expect(serializeIdCsv([0, -1, Number.NaN, 5])).toBe('5');
  });
});
