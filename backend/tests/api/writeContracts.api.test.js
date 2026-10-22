// API — write contracts through the real HTTP layer (supertest vs `app.js`):
// admin place CRUD, the publish switch, the public message form, content PUT
// and the visit-plan endpoints. Writes use IT-tagged fixtures; afterAll
// deletes leftovers directly through the Supabase client.

const request = require('supertest');
const app = require('../../src/app');
const { signToken } = require('../../src/utils/tokenUtils');
const { supabase, makeTag, expectOk } = require('../integration/helpers');

jest.setTimeout(30000);

const TAG = makeTag();
const PREFIX = `it_${Date.now()}`.toLowerCase(); // content section keys ^[a-z0-9_]{1,60}$
const TOKEN = signToken({ admin_id: 1, username: 'admin' });
const auth = (req) => req.set('Authorization', `Bearer ${TOKEN}`);

let categoryId;
let placeId;
let messageId;
let planId;

beforeAll(async () => {
  const categories = await request(app).get('/api/categories');
  categoryId = categories.body.data[0].category_id;
});

afterAll(async () => {
  await supabase.from('places').delete().like('name', `${TAG}%`);
  await supabase.from('categories').delete().like('category_name', `${TAG}%`);
  await supabase.from('contact_messages').delete().like('email', `${TAG.toLowerCase()}%@example.com`);
  await supabase.from('page_content').delete().eq('page_key', 'contact').like('section_key', `${PREFIX}_%`);
  await supabase.from('visit_plans').delete().like('session_id', `${TAG.toLowerCase()}%`);
});

// ── Places ────────────────────────────────────────────────────────────────

test('POST /api/places: 401 without JWT, 400 on missing fields, 201 with a valid body', async () => {
  const anonymous = await request(app)
    .post('/api/places')
    .send({ name: 'x', category_id: categoryId, description: 'y' });
  expect(anonymous.status).toBe(401);

  const invalid = await auth(request(app).post('/api/places')).send({ name: `${TAG} No category` });
  expect(invalid.status).toBe(400);
  expect(invalid.body).toMatchObject({ success: false });
  expect(invalid.body.message).toContain('Missing or empty required field(s)');
  expect(invalid.body.message).toContain('category_id');
  expect(invalid.body.message).toContain('description');

  const badLink = await auth(request(app).post('/api/places')).send({
    name: `${TAG} Bad link`,
    category_id: categoryId,
    description: 'x',
    google_maps_url: 'https://example.com/not-maps',
  });
  expect(badLink.status).toBe(400);
  expect(badLink.body.message).toMatch(/Google Maps link/);

  const created = await auth(request(app).post('/api/places')).send({
    name: `${TAG} Api Place`,
    category_id: categoryId,
    description: 'Created through the HTTP layer.',
    google_maps_url: 'https://www.google.com/maps/@6.0234,80.0560,15z',
  });
  expect(created.status).toBe(201);
  expect(created.body.success).toBe(true);
  placeId = created.body.data.place_id;
  expect(created.body.data.name).toBe(`${TAG} Api Place`);
  expect(created.body.data.latitude).toBeCloseTo(6.0234, 4);
});

test('PUT /api/places/:id updates; PUT :id/publish toggles visibility across the lists', async () => {
  const updated = await auth(request(app).put(`/api/places/${placeId}`)).send({
    name: `${TAG} Api Place Renamed`,
    category_id: categoryId,
    description: 'Renamed through the HTTP layer.',
  });
  expect(updated.status).toBe(200);
  expect(updated.body.data.name).toBe(`${TAG} Api Place Renamed`);

  // Non-boolean switch is rejected before touching the service.
  const badSwitch = await auth(request(app).put(`/api/places/${placeId}/publish`)).send({ published: 'yes' });
  expect(badSwitch.status).toBe(400);
  expect(badSwitch.body.message).toBe('published must be true or false.');

  const hide = await auth(request(app).put(`/api/places/${placeId}/publish`)).send({ published: false });
  expect(hide.status).toBe(200);
  expect(hide.body.data.published).toBe(false);

  const publicList = await request(app).get('/api/places');
  expect(publicList.body.data.some((p) => p.place_id === placeId)).toBe(false);

  // Admin scope needs its own JWT and shows the draft again.
  const scopeNoToken = await request(app).get('/api/places?scope=admin');
  expect(scopeNoToken.status).toBe(401);
  const adminList = await auth(request(app).get('/api/places?scope=admin'));
  expect(adminList.status).toBe(200);
  expect(adminList.body.data.some((p) => p.place_id === placeId)).toBe(true);

  const show = await auth(request(app).put(`/api/places/${placeId}/publish`)).send({ published: true });
  expect(show.status).toBe(200);
  const publicAgain = await request(app).get('/api/places');
  expect(publicAgain.body.data.some((p) => p.place_id === placeId)).toBe(true);

  const deleted = await auth(request(app).delete(`/api/places/${placeId}`));
  expect(deleted.status).toBe(200);
  expect(deleted.body).toMatchObject({ success: true, data: { place_id: placeId } });

  const gone = await request(app).get(`/api/places/${placeId}`);
  expect(gone.status).toBe(404);
});

// ── Messages (public form, admin inbox) ───────────────────────────────────

test('POST /api/messages: 400 on invalid, 201 on valid; inbox flow is JWT-guarded', async () => {
  const invalid = await request(app).post('/api/messages').send({ name: 'x', email: 'nope', message: 'y' });
  expect(invalid.status).toBe(400);
  expect(invalid.body).toMatchObject({ success: false });

  const created = await request(app).post('/api/messages').send({
    name: `${TAG} Visitor`,
    email: `${TAG.toLowerCase()}@example.com`,
    message: 'Sent through the HTTP layer.',
  });
  expect(created.status).toBe(201);
  messageId = created.body.data.message_id;
  expect(created.body.data.status).toBe('new');

  const inboxNoToken = await request(app).get('/api/messages');
  expect(inboxNoToken.status).toBe(401);
  const inbox = await auth(request(app).get('/api/messages'));
  expect(inbox.status).toBe(200);
  expect(inbox.body.data.some((m) => m.message_id === messageId)).toBe(true);

  const read = await auth(request(app).patch(`/api/messages/${messageId}/read`));
  expect(read.status).toBe(200);
  expect(read.body.data.status).toBe('read');

  const removed = await auth(request(app).delete(`/api/messages/${messageId}`));
  expect(removed.status).toBe(200);
  const again = await auth(request(app).delete(`/api/messages/${messageId}`));
  expect(again.status).toBe(404);
});

// ── Content ───────────────────────────────────────────────────────────────

test('PUT /api/content/:page: 401 without JWT, 200 with tagged sections, publicly readable', async () => {
  const anonymous = await request(app)
    .put('/api/content/contact')
    .send({ sections: { [`${PREFIX}_api`]: 'no auth' } });
  expect(anonymous.status).toBe(401);

  const updated = await auth(request(app).put('/api/content/contact')).send({
    sections: { [`${PREFIX}_api`]: 'IT content through HTTP' },
  });
  expect(updated.status).toBe(200);
  expect(updated.body.data.sections[`${PREFIX}_api`]).toBe('IT content through HTTP');

  const publicRead = await request(app).get('/api/content/contact');
  expect(publicRead.status).toBe(200);
  expect(publicRead.body.data.sections[`${PREFIX}_api`]).toBe('IT content through HTTP');
});

// ── Visit plans (public, session-based) ───────────────────────────────────

test('visit-plan endpoints: 201 create, 400 on malformed items, ordered round-trip', async () => {
  const created = await request(app)
    .post('/api/visit-plans')
    .send({ session_id: `${TAG.toLowerCase()}-http` });
  expect(created.status).toBe(201);
  planId = created.body.data.plan_id;
  expect(created.body.data.session_id).toBe(`${TAG.toLowerCase()}-http`);

  const malformed = await request(app).put(`/api/visit-plans/${planId}`).send({ items: 'nope' });
  expect(malformed.status).toBe(400);
  expect(malformed.body.message).toMatch(/items must be an array/);

  const badItem = await request(app).put(`/api/visit-plans/${planId}`).send({ items: [{ visit_order: 'x' }] });
  expect(badItem.status).toBe(400);
  expect(badItem.body.message).toMatch(/place_id and a numeric visit_order/);

  // Real places from the public list as items.
  const places = await request(app).get('/api/places');
  const [firstPlace, secondPlace] = places.body.data;
  const replaced = await request(app)
    .put(`/api/visit-plans/${planId}`)
    .send({
      items: [
        { place_id: secondPlace.place_id, visit_order: 2 },
        { place_id: firstPlace.place_id, visit_order: 1 },
      ],
    });
  expect(replaced.status).toBe(200);
  expect(replaced.body.data.visit_plan_items).toHaveLength(2);
  expect(replaced.body.data.visit_plan_items[0].visit_order).toBe(1);

  const fetched = await request(app).get(`/api/visit-plans/${planId}`);
  expect(fetched.status).toBe(200);
  expect(fetched.body.data.visit_plan_items.map((i) => i.visit_order)).toEqual([1, 2]);

  const unknown = await request(app).get('/api/visit-plans/999999999');
  expect(unknown.status).toBe(404);
  expect(unknown.body).toMatchObject({ success: false, message: 'Visit plan not found.' });
});
