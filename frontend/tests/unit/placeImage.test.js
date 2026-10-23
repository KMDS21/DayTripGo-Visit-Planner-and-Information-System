// Unit — photo helper: real image URLs win, otherwise a branded per-category
// gradient SVG placeholder with the name escaped (SRS FR-1/FR-7).

import { describe, test, expect } from 'vitest';
import { placeImage, categoryGradient } from '../../src/utils/placeImage';

const decode = (dataUrl) => decodeURIComponent(dataUrl.replace('data:image/svg+xml,', ''));

describe('placeImage', () => {
  test('returns the stored image URL when there is one', () => {
    expect(placeImage({ name: 'X', image_url: '/uploads/places/a.jpg' })).toBe('/uploads/places/a.jpg');
  });

  test('generates an SVG data URL when there is no photo', () => {
    const out = placeImage({ name: 'Temple' });
    expect(out.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decode(out)).toContain('<svg');
    expect(decode(out)).toContain('Temple');
  });

  test('works even for a place with no name at all', () => {
    const out = placeImage(null);
    expect(out.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decode(out)).toContain('DayTripGO');
  });

  test('XML-escapes the name so markup in a name cannot break the SVG', () => {
    const out = placeImage({ name: '<T&F>' });
    const svg = decode(out);
    expect(svg).toContain('&lt;T&amp;F&gt;');
    expect(svg).not.toContain('<T&F>');
  });

  test('uses the category palette for the gradient', () => {
    expect(decode(placeImage({ name: 'X' }, 'Nature'))).toContain('#166534');
    expect(decode(placeImage({ name: 'X' }, 'Heritage'))).toContain('#92400e');
  });

  test('unknown categories fall back to the default Place palette', () => {
    expect(decode(placeImage({ name: 'X' }, 'Something New'))).toContain('#0e7c66');
    expect(categoryGradient('Something New')).toEqual(categoryGradient('Place'));
  });
});
