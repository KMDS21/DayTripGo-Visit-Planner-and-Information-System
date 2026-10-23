// Unit — request validation middleware (SRS FR-19).
// Validates the res.status().json() contract without a server.

const { validatePlace, validatePlanItems } = require('../../src/middleware/validate');

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

const VALID_PLACE = {
  name: 'Gangaramaya Temple',
  category_id: 1,
  description: 'A famous temple in Colombo.',
};

describe('validatePlace', () => {
  test('passes a valid place through to next()', () => {
    const req = { body: { ...VALID_PLACE } };
    const res = makeRes();
    const next = jest.fn();
    validatePlace(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  test('lists every missing required field in one 400', () => {
    const req = { body: {} };
    const res = makeRes();
    const next = jest.fn();
    validatePlace(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('name');
    expect(res.body.message).toContain('category_id');
    expect(res.body.message).toContain('description');
  });

  test('treats whitespace-only name/description as missing', () => {
    const req = { body: { ...VALID_PLACE, name: '   ', description: '' } };
    const res = makeRes();
    const next = jest.fn();
    validatePlace(req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('name');
    expect(res.body.message).toContain('description');
    expect(res.body.message).not.toContain('category_id');
  });

  test('rejects out-of-range or non-numeric coordinates', () => {
    const bad = [
      { latitude: 91 },
      { latitude: -91 },
      { longitude: 181 },
      { latitude: 'abc' },
    ];
    for (const extra of bad) {
      const res = makeRes();
      validatePlace({ body: { ...VALID_PLACE, ...extra } }, res, jest.fn());
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    }
  });

  test('accepts in-range coordinates and omits them entirely', () => {
    for (const extra of [{ latitude: 6.9, longitude: 79.8 }, {}, { latitude: '', longitude: null }]) {
      const res = makeRes();
      const next = jest.fn();
      validatePlace({ body: { ...VALID_PLACE, ...extra } }, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });

  test('rejects a google_maps_url that is not a Google Maps link', () => {
    const res = makeRes();
    const next = jest.fn();
    validatePlace(
      { body: { ...VALID_PLACE, google_maps_url: 'https://example.com/map' } },
      res,
      next
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Google Maps link');
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts the supported Google Maps link forms', () => {
    for (const google_maps_url of [
      'https://www.google.com/maps/place/X/@6.9,79.8,17z',
      'https://maps.app.goo.gl/AbC123',
      'https://goo.gl/maps/AbC123',
    ]) {
      const res = makeRes();
      const next = jest.fn();
      validatePlace({ body: { ...VALID_PLACE, google_maps_url } }, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });
});

describe('validatePlanItems', () => {
  test('accepts a well-formed items array', () => {
    const res = makeRes();
    const next = jest.fn();
    validatePlanItems(
      { body: { items: [{ place_id: 1, visit_order: 0 }, { place_id: 2, visit_order: 1 }] } },
      res,
      next
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  test('rejects a missing or non-array items payload', () => {
    for (const body of [{}, { items: 'nope' }, { items: null }]) {
      const res = makeRes();
      const next = jest.fn();
      validatePlanItems({ body }, res, next);
      expect(res.statusCode).toBe(400);
      expect(next).not.toHaveBeenCalled();
    }
  });

  test('rejects an item missing place_id or a numeric visit_order', () => {
    const badItems = [
      [{ place_id: 1 }],
      [{ place_id: 1, visit_order: 'x' }],
      [{ visit_order: 0 }],
      [null],
    ];
    for (const items of badItems) {
      const res = makeRes();
      const next = jest.fn();
      validatePlanItems({ body: { items } }, res, next);
      expect(res.statusCode).toBe(400);
      expect(next).not.toHaveBeenCalled();
    }
  });
});
