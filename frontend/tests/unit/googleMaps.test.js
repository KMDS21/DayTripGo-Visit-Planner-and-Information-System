// Unit — frontend Google Maps mirror: coordinate parsing + the embed-src
// resolution ladder behind the admin live map thumbnail.

import { describe, test, expect } from 'vitest';
import {
  parseCoordsFromGoogleMapsUrl,
  googleMapEmbedSrc,
} from '../../src/utils/googleMaps';

describe('parseCoordsFromGoogleMapsUrl', () => {
  test('reads @lat,lng', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps/place/X/@6.9028,79.8699,17z')).toEqual({
      lat: 6.9028,
      lng: 79.8699,
    });
  });

  test('reads the !3d…!4d… form', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps/?data=!3d6.9!4d79.8')).toEqual({
      lat: 6.9,
      lng: 79.8,
    });
  });

  test('reads ?q=lat,lng', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps?q=6.9028,79.8699')).toEqual({
      lat: 6.9028,
      lng: 79.8699,
    });
  });

  test('short links and garbage return null', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://maps.app.goo.gl/AbC123')).toBeNull();
    expect(parseCoordsFromGoogleMapsUrl('https://example.com')).toBeNull();
    expect(parseCoordsFromGoogleMapsUrl(null)).toBeNull();
  });

  test('out-of-range coordinates are rejected', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps/@91,200,17z')).toBeNull();
  });
});

describe('googleMapEmbedSrc', () => {
  test('uses the place coordinates when present', () => {
    expect(googleMapEmbedSrc({ latitude: 6.9, longitude: 79.8 })).toBe(
      'https://maps.google.com/maps?q=6.9,79.8&z=15&output=embed'
    );
  });

  test('honours the zoom parameter', () => {
    expect(googleMapEmbedSrc({ latitude: 6.9, longitude: 79.8 }, 12)).toContain('&z=12&');
  });

  test('falls back to coordinates parsed from the Maps link', () => {
    const place = { google_maps_url: 'https://www.google.com/maps/place/X/@6.9028,79.8699,17z' };
    expect(googleMapEmbedSrc(place)).toBe(
      'https://maps.google.com/maps?q=6.9028,79.8699&z=15&output=embed'
    );
  });

  test('falls back to the raw link as the query for short links', () => {
    const place = { google_maps_url: 'https://maps.app.goo.gl/AbC123' };
    expect(googleMapEmbedSrc(place)).toBe(
      `https://maps.google.com/maps?q=${encodeURIComponent('https://maps.app.goo.gl/AbC123')}&output=embed`
    );
  });

  test('non-finite coordinates fall through to the link branch', () => {
    expect(googleMapEmbedSrc({ latitude: 'abc', longitude: 'x' })).toBeNull();
    expect(
      googleMapEmbedSrc({ latitude: 'abc', longitude: 'x', google_maps_url: 'https://maps.app.goo.gl/Zz' })
    ).toContain('maps.app.goo.gl');
  });

  test('null place or no sources → null', () => {
    expect(googleMapEmbedSrc(null)).toBeNull();
    expect(googleMapEmbedSrc({})).toBeNull();
    expect(googleMapEmbedSrc({ latitude: null, longitude: null, google_maps_url: '' })).toBeNull();
  });
});
