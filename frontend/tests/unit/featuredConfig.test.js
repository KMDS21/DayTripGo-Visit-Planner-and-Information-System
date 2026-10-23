// Unit — "Featured escapes" CSV/cover-pair serialisation (admin content editor).

import { describe, test, expect } from 'vitest';
import { parseFeaturedRows, serializeFeaturedRows } from '../../src/utils/featuredConfig';

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
});
