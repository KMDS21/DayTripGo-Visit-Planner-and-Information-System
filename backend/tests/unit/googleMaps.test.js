// Unit — Google Maps URL validation, coordinate parsing and short-link
// resolution (the admin paste-a-link flow behind every map view).

const {
  isGoogleMapsUrl,
  parseCoordsFromGoogleMapsUrl,
  resolveCoordsFromGoogleMapsUrl,
} = require('../../src/utils/googleMaps');

describe('isGoogleMapsUrl', () => {
  test.each([
    'https://www.google.com/maps/place/Sri+Lanka/@6.9028,79.8699,17z',
    'https://m.google.com/maps/place/X/@6.9,79.8,17z',
    'https://maps.app.goo.gl/AbC123',
    'https://goo.gl/maps/AbC123',
  ])('accepts %s', (url) => {
    expect(isGoogleMapsUrl(url)).toBe(true);
  });

  test.each([
    'https://www.google.com/search?q=places',
    'https://example.com/maps/@6.9,79.8',
    'not a url',
    '',
    null,
    undefined,
  ])('rejects %s', (url) => {
    expect(isGoogleMapsUrl(url)).toBe(false);
  });
});

describe('parseCoordsFromGoogleMapsUrl', () => {
  test('reads @lat,lng from a standard share URL', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps/place/X/@6.9028,79.8699,17z')).toEqual({
      lat: 6.9028,
      lng: 79.8699,
    });
  });

  test('reads the !3d…!4d… data form', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps/place/?ihave=!3d6.9028!4d79.8699')).toEqual({
      lat: 6.9028,
      lng: 79.8699,
    });
  });

  test('reads ?q=lat,lng', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps?q=6.9028,79.8699')).toEqual({
      lat: 6.9028,
      lng: 79.8699,
    });
  });

  test('returns null for a short link (no coordinates in the URL)', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://maps.app.goo.gl/AbC123')).toBeNull();
  });

  test('rejects out-of-range coordinates', () => {
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps/@91,100,17z')).toBeNull();
    expect(parseCoordsFromGoogleMapsUrl('https://www.google.com/maps/@10,181,17z')).toBeNull();
  });

  test('handles null / empty input', () => {
    expect(parseCoordsFromGoogleMapsUrl(null)).toBeNull();
    expect(parseCoordsFromGoogleMapsUrl('')).toBeNull();
  });
});

describe('resolveCoordsFromGoogleMapsUrl', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  test('returns coordinates straight from a full URL without fetching', async () => {
    global.fetch = jest.fn();
    const coords = await resolveCoordsFromGoogleMapsUrl(
      'https://www.google.com/maps/place/X/@6.9028,79.8699,17z'
    );
    expect(coords).toEqual({ lat: 6.9028, lng: 79.8699 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns null for a non-short URL with no coordinates, without fetching', async () => {
    global.fetch = jest.fn();
    await expect(resolveCoordsFromGoogleMapsUrl('https://example.com/page')).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('follows a short link once and parses the destination', async () => {
    // Unique URL each run — the module caches resolutions for process life.
    const short = `https://maps.app.goo.gl/unit-${Date.now()}`;
    global.fetch = jest.fn().mockResolvedValue({
      url: 'https://www.google.com/maps/place/X/@6.9028,79.8699,17z',
    });
    await expect(resolveCoordsFromGoogleMapsUrl(short)).resolves.toEqual({ lat: 6.9028, lng: 79.8699 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('a failed resolution returns null (offline/timeout safe)', async () => {
    // Fake timers so the 4s abort timer the resolver arms on a rejected fetch
    // can be flushed here instead of leaking past the end of the test run.
    jest.useFakeTimers();
    try {
      const short = `https://maps.app.goo.gl/unit-fail-${Date.now()}`;
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      await expect(resolveCoordsFromGoogleMapsUrl(short)).resolves.toBeNull();
      jest.advanceTimersByTime(5000);
    } finally {
      jest.useRealTimers();
    }
  });

  test('the second call for the same short link is served from cache', async () => {
    const short = `https://maps.app.goo.gl/unit-cache-${Date.now()}`;
    global.fetch = jest.fn().mockResolvedValue({
      url: 'https://www.google.com/maps/place/X/@6.9028,79.8699,17z',
    });
    const first = await resolveCoordsFromGoogleMapsUrl(short);
    const second = await resolveCoordsFromGoogleMapsUrl(short);
    expect(second).toEqual(first);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
