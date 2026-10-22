// API — public read contracts via supertest against the real `app.js`:
// health, places, categories and content. No auth, no writes, real Supabase
// behind every route.

const request = require('supertest');
const app = require('../../src/app');

jest.setTimeout(30000);

test('GET /api/health reports the service with a parseable timestamp', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('OK');
  expect(res.body.service).toBe('DayTripGO API');
  expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
});

test('GET /api/places returns the success/count/data envelope', async () => {
  const res = await request(app).get('/api/places');
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.count).toBe(res.body.data.length);
  for (const place of res.body.data) {
    expect(typeof place.place_id).toBe('number');
    expect(typeof place.name).toBe('string');
    expect(place.published).toBe(true); // public list never leaks drafts
  }
});

test('GET /api/places?category= filters to that category', async () => {
  const all = await request(app).get('/api/places');
  const someCategoryId = all.body.data[0].category_id;

  const filtered = await request(app).get(`/api/places?category=${someCategoryId}`);
  expect(filtered.status).toBe(200);
  expect(filtered.body.data.length).toBeGreaterThan(0);
  for (const place of filtered.body.data) {
    expect(place.category_id).toBe(someCategoryId);
  }

  // An unknown-but-valid id yields an empty list, not an error.
  const empty = await request(app).get('/api/places?category=999999');
  expect(empty.status).toBe(200);
  expect(empty.body).toMatchObject({ success: true, count: 0, data: [] });
});

test('GET /api/places/:id returns the place; unknown id is a 404 envelope', async () => {
  const all = await request(app).get('/api/places');
  const { place_id } = all.body.data[0];

  const one = await request(app).get(`/api/places/${place_id}`);
  expect(one.status).toBe(200);
  expect(one.body.success).toBe(true);
  expect(one.body.data.place_id).toBe(place_id);

  const missing = await request(app).get('/api/places/999999999');
  expect(missing.status).toBe(404);
  expect(missing.body).toMatchObject({ success: false, message: 'Place not found.' });
});

test('GET /api/categories returns the seeded four in the standard envelope', async () => {
  const res = await request(app).get('/api/categories');
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.count).toBe(res.body.data.length);
  const names = res.body.data.map((row) => row.category_name);
  for (const seeded of ['Religious', 'Nature', 'Heritage', 'Cultural']) {
    expect(names).toContain(seeded);
  }
});

test('GET /api/content/:page returns the sections map; unknown page is a 404 envelope', async () => {
  const res = await request(app).get('/api/content/home');
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data.page).toBe('home');
  expect(typeof res.body.data.sections).toBe('object');

  const unknown = await request(app).get('/api/content/not-a-page');
  expect(unknown.status).toBe(404);
  expect(unknown.body.success).toBe(false);
  expect(unknown.body.message).toMatch(/Unknown page/);
});

test('unmatched API routes fall through to Express\'s 404 (not the JSON envelope)', async () => {
  const res = await request(app).get('/api/no-such-route');
  expect(res.status).toBe(404);
  expect(res.text).toContain('Cannot GET /api/no-such-route');
});
