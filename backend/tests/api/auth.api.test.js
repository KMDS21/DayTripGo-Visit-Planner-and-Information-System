// API — the authentication matrix over the real app (FR-14, FR-15, NFR-5/6).
//
// Observed behaviour (see 03-api-testing.md): `requireAuth` answers **401** for
// every credential failure — missing header, wrong scheme, garbage token,
// foreign-secret token — and there is no 403 anywhere in this codebase. The
// matrix below therefore proves 401 / 401 / 200.

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { signToken } = require('../../src/utils/tokenUtils');

jest.setTimeout(30000);

// Mirror authService's own precedence: env override wins when both are set,
// otherwise the seeded admin from database/seeds/002.
const USERNAME = process.env.ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'DayTripGO@2026';

let loginToken;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: USERNAME, password: PASSWORD });
  expect(res.status).toBe(200);
  loginToken = res.body.data.token;
});

test('login contract: 400 without credentials, 401 with wrong ones, 200 with the right ones', async () => {
  const missing = await request(app).post('/api/auth/login').send({});
  expect(missing.status).toBe(400);
  expect(missing.body).toMatchObject({ success: false, message: 'Username and password are required.' });

  const wrong = await request(app)
    .post('/api/auth/login')
    .send({ username: USERNAME, password: 'definitely-wrong' });
  expect(wrong.status).toBe(401);
  expect(wrong.body).toMatchObject({ success: false, message: 'Invalid username or password.' });

  const ok = await request(app)
    .post('/api/auth/login')
    .send({ username: USERNAME, password: PASSWORD });
  expect(ok.status).toBe(200);
  expect(ok.body.success).toBe(true);
  expect(typeof ok.body.data.token).toBe('string');
  expect(ok.body.data.admin.username).toBe(USERNAME);
  // The issued token is a verifiable JWT for this API.
  const payload = jwt.verify(ok.body.data.token, process.env.JWT_SECRET);
  expect(payload.username).toBe(USERNAME);
});

test('matrix on a protected route (GET /api/messages): 401 without credentials, 200 with a valid JWT', async () => {
  // 401 — no Authorization header at all.
  const noHeader = await request(app).get('/api/messages');
  expect(noHeader.status).toBe(401);
  expect(noHeader.body).toMatchObject({ success: false, message: 'Authentication required.' });

  // 401 — Bearer with no token / wrong scheme.
  const bareBearer = await request(app).get('/api/messages').set('Authorization', 'Bearer');
  expect(bareBearer.status).toBe(401);
  const wrongScheme = await request(app).get('/api/messages').set('Authorization', 'Token abc');
  expect(wrongScheme.status).toBe(401);

  // 401 — garbage token and a well-formed token signed with a foreign secret.
  const garbage = await request(app).get('/api/messages').set('Authorization', 'Bearer not-a-jwt');
  expect(garbage.status).toBe(401);
  expect(garbage.body).toMatchObject({ success: false, message: 'Invalid or expired token.' });

  const foreign = await request(app)
    .get('/api/messages')
    .set('Authorization', `Bearer ${jwt.sign({ admin_id: 1 }, 'someone-elses-secret')}`);
  expect(foreign.status).toBe(401);

  // 200 — a token minted with the real JWT_SECRET (and, separately, the one
  // the login endpoint issued in beforeAll).
  const minted = await request(app)
    .get('/api/messages')
    .set('Authorization', `Bearer ${signToken({ admin_id: 1, username: 'admin' })}`);
  expect(minted.status).toBe(200);
  expect(minted.body.success).toBe(true);

  const viaLogin = await request(app)
    .get('/api/messages')
    .set('Authorization', `Bearer ${loginToken}`);
  expect(viaLogin.status).toBe(200);
});

test('GET /api/admin/stats is JWT-guarded and returns a stats object', async () => {
  const anonymous = await request(app).get('/api/admin/stats');
  expect(anonymous.status).toBe(401);

  const authed = await request(app)
    .get('/api/admin/stats')
    .set('Authorization', `Bearer ${loginToken}`);
  expect(authed.status).toBe(200);
  expect(authed.body.success).toBe(true);
  expect(typeof authed.body.data).toBe('object');
  expect(authed.body.data).not.toBeNull();
});

test('logout requires a token and then succeeds', async () => {
  const anonymous = await request(app).post('/api/auth/logout');
  expect(anonymous.status).toBe(401);

  const authed = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${loginToken}`);
  expect(authed.status).toBe(200);
  expect(authed.body).toMatchObject({
    success: true,
    data: { message: 'Logged out successfully.' },
  });
});

// ── Role isolation: one secret, two disjoint claim sets ───────────────────
// requireAuth demands admin_id, requireOwner demands owner_id — so neither
// role's JWT can ever unlock the other's routes.

test('a business owner token is refused by every admin guard', async () => {
  const ownerToken = signToken({ owner_id: 999999, username: 'ghost-owner' });

  const messages = await request(app)
    .get('/api/messages')
    .set('Authorization', `Bearer ${ownerToken}`);
  expect(messages.status).toBe(401);
  expect(messages.body).toMatchObject({
    success: false,
    message: 'Administrator authentication required.',
  });

  const stats = await request(app)
    .get('/api/admin/stats')
    .set('Authorization', `Bearer ${ownerToken}`);
  expect(stats.status).toBe(401);

  const publish = await request(app)
    .put('/api/businesses/1/publish')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ published: true });
  expect(publish.status).toBe(401);
});

test('an admin token is refused by every business owner guard', async () => {
  const me = await request(app)
    .get('/api/owner/auth/me')
    .set('Authorization', `Bearer ${loginToken}`);
  expect(me.status).toBe(401);
  expect(me.body).toMatchObject({
    success: false,
    message: 'Business owner authentication required.',
  });

  const create = await request(app)
    .post('/api/businesses')
    .set('Authorization', `Bearer ${loginToken}`)
    .send({ name: 'Should not be created', description: 'Admin token, not an owner token.' });
  expect(create.status).toBe(401);

  const scoped = await request(app)
    .get('/api/businesses?scope=owner')
    .set('Authorization', `Bearer ${loginToken}`);
  expect(scoped.status).toBe(401);
});

test('owner auth routes answer the same 401 matrix without a token', async () => {
  for (const [method, path] of [
    ['get', '/api/owner/auth/me'],
    ['put', '/api/owner/auth/me'],
    ['put', '/api/owner/auth/password'],
    ['post', '/api/owner/auth/logout'],
  ]) {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, message: 'Authentication required.' });
  }
});

test('public business endpoints stay readable without any token', async () => {
  const list = await request(app).get('/api/businesses');
  expect(list.status).toBe(200);
  expect(list.body.success).toBe(true);
  expect(Array.isArray(list.body.data)).toBe(true);

  const tags = await request(app).get('/api/business-tags');
  expect(tags.status).toBe(200);
  expect(Array.isArray(tags.body.data)).toBe(true);

  // …but writing without a token is still refused.
  const write = await request(app)
    .post('/api/businesses')
    .send({ name: 'Nope', description: 'No token supplied.' });
  expect(write.status).toBe(401);

  const tagWrite = await request(app)
    .post('/api/business-tags')
    .send({ category_name: 'Nope' });
  expect(tagWrite.status).toBe(401);
});
