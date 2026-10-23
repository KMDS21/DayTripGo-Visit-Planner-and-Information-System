# 03 · API Testing — DayTripGO

> Step 3 of 5 in the test-suite rollout (plan: unit → integration → API → smoke → load).
> API tests drive the **real Express app over HTTP** with supertest — routes → controllers → services → Supabase — asserting status codes, response envelopes and the auth matrix. No server process is started: `app.js` exports the app without listening.

## What this layer covers

| File | Scope | What is asserted |
| ---- | ----- | ---------------- |
| `healthAndReads.api.test.js` | Public GET surface | `/api/health` contract (service name, parseable timestamp); the `{ success, count, data }` envelope on places/categories; `count === data.length`; public list never leaks unpublished places; category filter + unknown category → empty list, not an error; place detail + 404 envelope; content sections map + unknown-page 404; unmatched routes → the JSON 404 envelope (GET and POST) |
| `auth.api.test.js` | FR-14/FR-15, NFR-5/6 | Login contract: 400 (no credentials) / 401 (wrong) / 200 (right, token is a verifiable JWT); the **auth matrix** on `GET /api/messages`: 401 no header, 401 bare `Bearer`, 401 wrong scheme, 401 garbage token, 401 foreign-secret JWT, **200** minted-with-real-secret and login-issued tokens; `/api/admin/stats` JWT-guarded; logout 401→200 |
| `writeContracts.api.test.js` | Admin write surface + public form | Places: 401 without JWT → 400 `validatePlace` envelopes (missing fields listed, non-Maps link) → 201 create with derived coordinates → 200 update → publish switch non-boolean 400, hide/re-show across public vs `?scope=admin` (itself 401 without JWT) → 200 delete → 404 after; messages: 400 invalid / 201 valid, inbox 401→200, mark-read 200, delete 200 then 404; content PUT 401→200→public readback; visit plans: 201 create, 400 on non-array and malformed items, ordered round-trip, unknown plan 404 |

## Auth under test

- Tokens are minted two ways, both proven: **`tokenUtils.signToken` with the real `JWT_SECRET`** (no admin seeding needed) and the **`POST /api/auth/login`** flow.
- Login credentials mirror `authService`'s own precedence: `ADMIN_USERNAME`/`ADMIN_PASSWORD` from `backend/.env` when both are set, otherwise the seeded `admin` account from `database/seeds/002`.
- All write fixtures are IT-tagged and removed in `afterAll` (step-2 policy), so the suite never touches real content.

## Observed behaviour worth knowing (differences from the plan sketch)

- **There is no 403 in this API.** The plan sketched "401 / 403 / 200", but `requireAuth` answers **401 for every credential failure** — missing header, wrong scheme, malformed token, token signed with the wrong secret. The matrix asserts the real 401/401/200 behaviour.
- ~~**Unmatched routes are not the JSON envelope**~~ — **fixed 2026-10-23** (caching round): `app.js` gained a `/api` catch-all after all routes (incl. `/api/health`), so unmatched API paths now answer `{ success: false, message: "Cannot <METHOD> <url>" }` with `Content-Type: application/json`. The test asserts the envelope for both GET and POST misses.
- `morgan('dev')` logs every test request to the console (and `combined` to `backend/logs/backend.log`) — expected noise, not failures.

## How to run

```bash
cd backend
npm run test:api          # = jest tests/api --runInBand
```

Needs the real credentials in `backend/.env` (JWT secret, Supabase, optional admin override) — the suite talks to the **live Supabase project** through the real routes.

## Gate (step 3 acceptance)

- **Green twice consecutively**: 3 suites / **16 tests**, ~25 s per run
- Backend units still **62/62**; step-2 integration suite unaffected
- `npm run build` and `npm run lint` remain green

## Next step

→ **Step 4 — Smoke testing** (`docs/testing/04-smoke-testing.md`): Playwright boots the whole stack (API + built frontend) and proves the five key pages render without console errors.
