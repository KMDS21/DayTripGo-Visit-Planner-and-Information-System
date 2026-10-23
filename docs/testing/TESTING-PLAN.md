# DayTripGO — Testing Plan (Master)

> **Scope**: five test layers, written and run **step by step** — each step green before the next begins, each step shipped as its own round (tests + this plan's status + a dedicated layer doc + one commit per the repo convention).
> **Branch**: `testing` · **Convention**: append-only integration log, one single commit per round (log entry + code), push on developer instruction.
> **Layer docs**: [`01-unit-testing.md`](01-unit-testing.md) · `02-integration-testing.md` · `03-api-testing.md` · `04-smoke-testing.md` · `05-load-testing.md`

## Status board

| Step | Layer | Suite | Gate | Status |
| ---- | ----- | ----- | ---- | ------ |
| 1 | Unit | 12 files / **116 tests** (backend 62 · frontend 54) | Green in <10 s, no network | ✅ **Done** — `npm run test:unit` both apps, ~9.5 s |
| 2 | Integration | 5 files / **21 tests** — real Supabase round-trips, `IT-<timestamp>` fixtures | Green **twice consecutively** | ✅ **Done** — `npm run test:integration`, ~29 s per run |
| 3 | API | 3 files / **16 tests** — supertest over the real `app.js`, auth matrix | Green, auth matrix proven | ✅ **Done** — `npm run test:api`, ~25 s per run |
| 4 | Smoke | Playwright: whole stack boots, 7 tests over 5 pages + login | One command = app green/red | ✅ **Done** — `npm run test:smoke`, 7/7, ~20 s |
| 5 | Load | autocannon, read-only endpoints, 4 phases | p99 < 500 ms, errors <1 % | ✅ **PASS** (round 2) — round 1 failed p99 502–1047 ms honestly (2 runs), caching fix cleared it to 10–135 ms — `05-load-testing.md` |

## Decisions (confirmed with developer)

| Decision | Choice | Why |
| -------- | ------ | --- |
| Steps 2–3 data layer | **Real Supabase + tagged fixtures + `afterAll` cleanup** | Tests the SQL/schema, not a fake; fixtures make it safe |
| Smoke verification | **Playwright headless Chromium** | Catches client-side render crashes and `console.error`s that fetch-only checks cannot |
| Load tool | **autocannon** | Single npm dev-dep, JSON reports, no extra runtime |
| Commit granularity | **5 rounds** — log entry + tests in one commit each | Matches the repo's one-commit-per-round convention |
| Backend runner | **Jest + supertest** | CommonJS-friendly, `jest.mock` works on the require cache |
| Frontend runner | **Vitest + @testing-library + jsdom** | Native Vite fit, shares the build toolchain |

## Tooling inventory

| Where | Packages | Installed |
| ----- | --------| --------- |
| `backend/` devDeps | `jest`, `supertest` | ✅ step 1 |
| `frontend/` devDeps | `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` | ✅ step 1 |
| repo (`tests/`) | `@playwright/test` | ✅ step 4 (root `package.json`, private) |
| repo (`tests/`) | `autocannon` | ✅ step 5 |
| one-time | `npx playwright install chromium` | ✅ step 4 |

**npm scripts**

```jsonc
// backend/package.json
"test":         "npm run test:unit",              // steps 2–3 extend this chain
"test:unit":    "jest tests/unit",
"test:integration": "jest tests/integration --runInBand",  // added in step 2
"test:api":     "jest tests/api --runInBand"       // added in step 3

// frontend/package.json
"test":         "npm run test:unit",
"test:unit":    "vitest run"

// repo root / documented npx commands
"test:smoke":   "playwright test tests/smoke",     // step 4
"test:load":    "node tests/load/load.js"          // step 5
```

## File layout (target)

```
backend/
  jest.config.js                 ✅ node env, tests/**\/*.test.js, 15s timeout
  tests/setup.js                 ✅ loads backend/.env first, then dummy fallbacks (step 2)
    unit/                        ✅ 6 suites (utils, middleware, mocked service)
    integration/                 ✅ 5 files (places, categories, content, messages, visit plans)
    api/                         ✅ 3 files (health+reads, auth matrix, write contracts)
frontend/
  vitest.config.js               ✅ jsdom + pool vmThreads (16.9s → 6.3s)
  tests/setup.js                 ✅ jest-dom matchers
    unit/                        ✅ 6 files (utils + errorMessage)
tests/
  smoke/                         ✅ playwright.config.js (2 webServers) + smoke.spec.js (7 tests)
  load/                          ✅ load.js (guardrailed runner) + reports/*.json (3 runs: 2 FAIL + 1 PASS after fix)
docs/testing/
  TESTING-PLAN.md                ✅ this file
  01-unit-testing.md             ✅
  02-integration-testing.md      ✅
  03-api-testing.md              ✅
  04-smoke-testing.md            ✅
  05-load-testing.md             ✅
```

## Step-by-step definitions

### Step 1 — Unit ✅
- **Backend** (`backend/tests/unit/`): `passwordUtils`, `tokenUtils`, `googleMaps` (mocked `fetch`, cache proof), `uploadConfig` (magic bytes, quota identity, self-cleaning removal test), `validate` middleware (400-vs-next contracts), `messageService` (model auto-mocked: trimming, defaults, 503 migration hint, 500/404 mapping).
- **Frontend** (`frontend/tests/unit/`): `formatHours` (noon/midnight table), `hoursRange` (form↔string round-trip), `googleMaps` embed ladder, `placeImage` (XML escaping), `featuredConfig` (parse↔serialize stability), `api.errorMessage` (NFR-9 ladder).
- **Infra traps solved**: `config/db.js` `process.exit(1)` defeated by `tests/setup.js` env guard; resolver's 4s abort timer flushed with fake timers (no worker-leak warning); jsdom-per-worker pooling for speed.
- **Gate**: ✅ 116 tests, ~9.5 s combined, build + lint green.

### Step 2 — Integration ✅
- `backend/tests/integration/`: place CRUD round-trip (create→read→update→list→publish-switch→delete→404), categories list, content upsert/read, message submit→list→mark-read→delete, visit-plan create→replace-items→sorted-read→clear (FR-10…FR-13) — all through services → models → **real Supabase**.
- Fixtures tagged `IT-<timestamp>`; `afterAll` + defensive tag-based deletes; `--runInBand`; Maps links carry inline coordinates so no test does a network hop.
- **Adaptations from the original sketch**: the content service only allows the four real page keys, so fixtures ride as IT-tagged *section keys* on `contact` instead of `page_key='test-*'`; `markRead` on an unknown id is asserted as the real **500** (`.single()` PGRST116), not the hoped-for 404.
- **Infra trap solved**: `tests/setup.js` now loads `backend/.env` **before** the dummy fallbacks — dotenv never overrides set variables, so the step-1 dummies would have shadowed the real credentials and pointed the suite at a fake URL.
- **Gate**: ✅ 21 tests, green twice consecutively (~29 s), units still 62/62, build + lint green. **Doc**: `02-integration-testing.md`.

### Step 3 — API ✅
- `backend/tests/api/` (supertest vs `app.js` — it exports the app without listening):
  - `GET /api/health` contract; public reads (200 + `{ success, count, data }` envelope) on places/categories/content; unmatched route → Express HTML 404 (no JSON catch-all exists)
  - **Auth matrix**: every credential failure is **401** (no header, bare `Bearer`, wrong scheme, garbage token, foreign-secret JWT) — **this codebase has no 403 path**; valid tokens proven both minted (`tokenUtils` + real `JWT_SECRET`) and issued (`POST /api/auth/login` against env-override-or-seeded creds)
  - Write contracts: `validatePlace`/`validatePlanItems` 400 envelopes, place create→update→publish-switch→delete over HTTP, `?scope=admin` JWT-gated, messages inbox flow, content PUT + public readback — writes IT-tagged, cleaned in `afterAll`
- **Gate**: ✅ 16 tests, green twice consecutively (~25 s), auth matrix proven, units 62/62, build + lint green. **Doc**: `03-api-testing.md`.

### Step 4 — Smoke ✅
- `tests/smoke/` at the repo root (new private `package.json` holds `@playwright/test` + `dotenv`); `playwright.config.js` boots **two webServers**: backend (`npm start`, :5000) and frontend (`vite build && vite preview`, :4173 — preview inherits `server.proxy`, so `/api` is same-origin; verified empirically before trusting it).
- 7 tests: health-through-proxy, home/explore/visit-plan/contact landmarks (h1s are admin-editable → *visible + non-empty* asserted, not frozen copy), `/admin` → login redirect, and a **real login → protected dashboard** flow. Every test fails on any `console.error`/`pageerror` (OSM tile hosts exempt).
- **Gate**: ✅ `npm run test:smoke` → 7/7 green twice (~17–26 s); a genuine strict-mode selector failure proved the gate bites. **Doc**: `04-smoke-testing.md`.

### Step 5 — Load ✅ (round 1 FAIL recorded honestly → caching fix → round 2 PASS)
- `tests/load/load.js` (autocannon): auto-spawns the backend, warms endpoints, runs 4 guardrailed phases (health@10 → places@10 → places@50 → content@50, 85 s total), writes `tests/load/reports/<timestamp>.json`, exits non-zero on threshold violation. **Guardrails enforced in code** (≤50 conns, ≤90 s, read-only URL allowlist).
- **Round 1 (2/2 identical FAIL verdicts)**: error rate **0 % everywhere** ✅; `/api/health` p99 **6 ms** ✅; DB-backed phases **p99 502–1047 ms vs the 500 ms gate** ❌ — a fixed ~320 ms hosted-Supabase round-trip floor with jitter on top. App layer proven not to be the bottleneck.
- **Round 2 (after the caching fix, deferred item 7)**: **PASS** — p99 10–135 ms everywhere, 0 % errors, DB-backed throughput up ~12× (156 → 1679 rps at 50 conns). **Doc**: `05-load-testing.md` (both rounds).

## Deferred — to build later (developer instruction, 2026-10-22; items 1–2 completed 2026-10-23)

| # | Item | Where / notes |
| - | ---- | ------------- |
| 1 | ~~**Step 5 — load suite**~~ | ✅ **Done (2026-10-23)** — `tests/load/load.js` + 2 reports; p99 gate missed, see `05-load-testing.md` |
| 2 | ~~**Backend `npm test` chain**~~ | ✅ **Done (2026-10-23)** — `"test"` now runs unit → integration → api (99 tests, exit 0) |
| 3 | ~~**`markRead` on unknown id → 500**~~ | ✅ **Done (2026-10-23)** — service maps PGRST116 → 404; covered by a real-DB integration test and mocked unit cases; `02-integration-testing.md` updated |
| 4 | **No 403 in the API** | `requireAuth` answers 401 for every credential failure (step 3); decide whether any route needs a genuine 403 |
| 5 | ~~**Unmatched `/api/*` routes → HTML 404**~~ | ✅ **Done (2026-10-23)** — `/api` JSON catch-all added in `app.js` (after all routes, before the error handler); API test asserts the envelope for GET and POST; `03-api-testing.md` updated |
| 6 | **Dead dependency** | `@fontsource-variable/playfair-display` installed but unimported since the DM Sans round |
| 7 | ~~**Cache the public reads** *(perf — the load-gate fix)*~~ | ✅ **Done (2026-10-23)** — `utils/ttlCache.js` + public-list cache in `placeService` (invalidated by every place write; admin scope always fresh) + per-page cache in `contentService` (invalidated by `updatePage`). Load gate cleared: p99 10–135 ms vs 500 ms, verdict PASS |
| 8 | **Region proximity** | Host the app near the Supabase region — now only matters for the cold path (first request after a write/TTL expiry) and uncached endpoints like `GET /api/places/:id` |
| 9 | ~~**p99 threshold recalibration**~~ | **Moot (2026-10-23)** — the gate passes with the original target intact; recalibration was deliberately not taken |

## Round mechanics (per step)

1. Write tests → run → **green** (plus `npm run build` + `npm run lint` still green).
2. Append entry to `docs/integration-log.md` — fresh timestamp, re-emit the `_(Entries below are appended as further steps complete.)_` marker, never edit existing entries.
3. **One single commit**: tests + config + scripts + layer doc + plan/status update + log entry, e.g. `test(integration): … (step 2 of 5)`.
4. Report results; **push only when the developer says push**.

## Risks & mitigations

| Risk | Mitigation |
| ---- | ---------- |
| `config/db.js` exits the process without env | `tests/setup.js` runs as Jest `setupFiles` — before any require (step 1 proven) |
| Supabase network flakiness → false reds | 15 s test timeout, `IT-*` fixtures so reruns stay safe, honest retries only on reads |
| Test writes polluting real data | Tagged fixtures + `afterAll` cleanup; load step is read-only by rule |
| Load test stressing hosted Supabase | Read-only endpoints, ≤50 connections, ≤90 s total |
| Playwright browser missing | Step 4 doc records `npx playwright install chromium`; smoke fails fast with a clear message |
| Admin credentials unavailable for auth tests | Fallback: mint a JWT directly with `JWT_SECRET` via `tokenUtils` |
| Open handles leaking past Jest runs | Fake timers for network-timeout paths (step 1 pattern) |

## Definition of done

- [x] Step 1 — unit suites green (116 tests) + `01-unit-testing.md`
- [x] Step 2 — integration green twice (21 tests) + `02-integration-testing.md`
- [x] Step 3 — API contracts green (16 tests) + `03-api-testing.md`
- [x] Step 4 — smoke green (7/7) + `04-smoke-testing.md`
- [x] Step 5 — load report under thresholds + `05-load-testing.md` — ✅ **met after the caching fix (round 2 PASS, p99 10–135 ms); round 1's honest FAIL kept as history**
- [x] One log entry + one subject-only commit per round on `testing` (local; push on instruction)
