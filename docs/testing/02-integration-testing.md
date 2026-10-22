# 02 · Integration Testing — DayTripGO

> Step 2 of 5 in the test-suite rollout (plan: unit → integration → API → smoke → load).
> Integration tests exercise **service → model → real Supabase** round-trips — the actual SQL/schema, not a mock. Every row they create is tagged and deleted again.

## What this layer covers

| File | Flow under test | What is asserted |
| ---- | --------------- | ---------------- |
| `places.integration.test.js` | `placeService` CRUD | create → read → update → list → publish-switch → delete: stored values round-trip, coordinates derived from the Maps link (no lat/lng columns since migration 003), public list hides unpublished rows while the admin view keeps them, category filter returns exactly the fixture, delete → 404 on read (FR-1…FR-9, FR-16…FR-19) |
| `categories.integration.test.js` | `categoryModel.findAll` | rows shaped like category records, the four seeded categories present, tagged fixture visible in the list |
| `content.integration.test.js` | `contentService` upsert/get | sections upsert on `(page_key, section_key)` and read back as a map, re-upsert overwrites only its own key, unknown page → 404, malformed payloads → 400 **and write nothing** |
| `messages.integration.test.js` | `messageService` lifecycle | validation 400s never insert, submit → admin list → mark-read → delete round-trips through the DB, delete/mark-read on unknown ids fail loudly (FR-8 contact form) |
| `visitPlans.integration.test.js` | `visitPlanService` | create plan → replace ordered items (deliberately out of order in, sorted out) → place details + derived coordinates per item → second replace swaps the whole set → empty list clears and leaves **no orphan join rows** (cascade), unknown plan → 404 (FR-10…FR-13, NFR-7) |

## Fixture & cleanup policy

- Every fixture carries a per-file tag: **`IT-<timestamp>-<random>`** — place/category names, the plan `session_id`, the message email (`it-…@example.com`), and the content section keys (`it_<ts>_intro`).
- Each file deletes its own rows in `afterAll` **plus defensive tag-based deletes**, so a test that fails half-way still leaves the database clean.
- Content rides on the real `contact` page under IT-tagged section keys: the service only allows the four genuine page keys, and the site ignores sections it doesn't know. Cleanup deletes exactly those rows.
- Maps links in fixtures are **full URLs with coordinates** (`…/maps/@6.0234,80.0560,15z`) — parsed locally, no network hop, no flaky redirect following.
- `--runInBand` keeps the five suites sequential — gentler on the hosted Supabase project and deterministic to reason about.

## How to run

```bash
cd backend
npm run test:integration   # = jest tests/integration --runInBand
```

Requires the real credentials in `backend/.env` (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`) — the suite talks to the **live Supabase project**.

## Test-infra notes (why the config looks like this)

- **`backend/tests/setup.js` now loads `backend/.env` first** (`dotenv.config({ path: … })`): dotenv never overrides variables that are already set, so the step-1 dummy values would otherwise *shadow* the real credentials and point this suite at a fake `localhost:54321`. Unit tests keep working because they mock the data layer (and read `JWT_SECRET` dynamically where they need it).
- `testTimeout: 15000` from step 1 already covers the network suites; the heaviest files add `jest.setTimeout(30000)` for their multi-step flows.

## Observed behaviour worth knowing

- **`markRead` on an unknown id surfaces a 500, not a 404**: `messageModel.markRead` uses `.single()`, which errors with `PGRST116` when no row matches, so the service's `if (!data) → 404` branch never fires on the real DB. The test asserts the real behaviour (500) rather than the hoped-for one.
- The publish-switch, cascade-delete and coordinate-derivation paths are only provable against the real schema — mocks in step 1 can't see migrations 003/005 at all.

## Gate (step 2 acceptance)

- **Green twice consecutively** (proves cleanup is idempotent, not just lucky): 5 suites / **21 tests**, ~29 s per run
- Backend units unaffected by the setup.js change: **62/62 green**
- `npm run build` and `npm run lint` remain green

## Next step

→ **Step 3 — API testing** (`docs/testing/03-api-testing.md`): supertest contracts over `app.js` — response shapes, the 401/403/200 auth matrix, validation 400s and the central error-handler envelope.
