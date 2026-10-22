# DayTripGO — Testing Plan (Master)

> **Scope**: five test layers, written and run **step by step** — each step green before the next begins, each step shipped as its own round (tests + this plan's status + a dedicated layer doc + one commit per the repo convention).
> **Branch**: `testing` · **Convention**: append-only integration log, one single commit per round (log entry + code), push on developer instruction.
> **Layer docs**: [`01-unit-testing.md`](01-unit-testing.md) · `02-integration-testing.md` · `03-api-testing.md` · `04-smoke-testing.md` · `05-load-testing.md`

## Status board

| Step | Layer | Suite | Gate | Status |
| ---- | ----- | ----- | ---- | ------ |
| 1 | Unit | 12 files / **116 tests** (backend 62 · frontend 54) | Green in <10 s, no network | ✅ **Done** — `npm run test:unit` both apps, ~9.5 s |
| 2 | Integration | Real Supabase round-trips, `IT-<timestamp>` fixtures | Green **twice consecutively** | ⬜ Not started |
| 3 | API | supertest contracts over all 8 route groups | Green, auth matrix proven | ⬜ Not started |
| 4 | Smoke | Playwright: whole stack boots, 5 pages render | One command = app green/red | ⬜ Not started |
| 5 | Load | autocannon, read-only endpoints | p99 < 500 ms, errors <1 % | ⬜ Not started |

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
| repo (`tests/`) | `@playwright/test`, `autocannon` | ⬜ step 4/5 |
| one-time | `npx playwright install chromium` | ⬜ step 4 |

**npm scripts**

```jsonc
// backend/package.json
"test":         "npm run test:unit",              // steps 2–3 extend this chain
"test:unit":    "jest tests/unit",
"test:integration": "jest tests/integration",      // added in step 2
"test:api":     "jest tests/api"                  // added in step 3

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
  tests/setup.js                 ✅ dummy SUPABASE_URL/keys/JWT_SECRET before any require
    unit/                        ✅ 6 suites (utils, middleware, mocked service)
    integration/                 ⬜ step 2
    api/                         ⬜ step 3
frontend/
  vitest.config.js               ✅ jsdom + pool vmThreads (16.9s → 6.3s)
  tests/setup.js                 ✅ jest-dom matchers
    unit/                        ✅ 6 files (utils + errorMessage)
tests/
  smoke/                         ⬜ step 4 — Playwright specs + config
  load/                          ⬜ step 5 — autocannon script, thresholds, reports/
docs/testing/
  TESTING-PLAN.md                ✅ this file
  01-unit-testing.md             ✅
  02-integration-testing.md      ⬜
  03-api-testing.md              ⬜
  04-smoke-testing.md            ⬜
  05-load-testing.md             ⬜
```

## Step-by-step definitions

### Step 1 — Unit ✅
- **Backend** (`backend/tests/unit/`): `passwordUtils`, `tokenUtils`, `googleMaps` (mocked `fetch`, cache proof), `uploadConfig` (magic bytes, quota identity, self-cleaning removal test), `validate` middleware (400-vs-next contracts), `messageService` (model auto-mocked: trimming, defaults, 503 migration hint, 500/404 mapping).
- **Frontend** (`frontend/tests/unit/`): `formatHours` (noon/midnight table), `hoursRange` (form↔string round-trip), `googleMaps` embed ladder, `placeImage` (XML escaping), `featuredConfig` (parse↔serialize stability), `api.errorMessage` (NFR-9 ladder).
- **Infra traps solved**: `config/db.js` `process.exit(1)` defeated by `tests/setup.js` env guard; resolver's 4s abort timer flushed with fake timers (no worker-leak warning); jsdom-per-worker pooling for speed.
- **Gate**: ✅ 116 tests, ~9.5 s combined, build + lint green.

### Step 2 — Integration (next)
- `backend/tests/integration/`: place create→read→update→delete→verify-gone, categories list, content upsert on `page_key='test-*'`, message submit→list→mark-read→delete, visit-plan service CRUD (FR-10…FR-13) — all through services → models → **real Supabase**.
- Every fixture tagged `IT-<timestamp>`; `afterAll` deletes them; `testTimeout 15000` already set.
- **Gate**: green twice consecutively (proves cleanup idempotence). **Doc**: `02-integration-testing.md`.

### Step 3 — API
- `backend/tests/api/` (supertest vs `app.js` — it exports the app without listening):
  - `GET /api/health` contract; public reads (200 + shape) on places/categories/content
  - **Auth matrix**: 401 no token / 403 garbage token / 200 valid JWT (login with seeded admin, or mint via `tokenUtils` + `JWT_SECRET`)
  - Validation 400s through `validatePlace`/`validatePlanItems`; unknown route → 404 via central `errorHandler` shape
- **Gate**: green; writes only to `IT-*` fixtures. **Doc**: `03-api-testing.md`.

### Step 4 — Smoke
- Install `@playwright/test` + Chromium; boot backend (:5000) + `vite build && vite preview` as Playwright `webServer`s.
- Visit `/`, `/explore`, `/visit-plan`, `/contact`, `/admin` — assert landmarks, **fail on any `console.error`/`pageerror`**, plus `GET /api/health`.
- **Gate**: one command turns the whole app green/red. **Doc**: `04-smoke-testing.md`.

### Step 5 — Load
- `tests/load/load.js` with autocannon — **read-only only**: `/api/health`, `/api/places`, `/api/content/home`; ramp 10→50 connections, ~30 s each; report JSON → `tests/load/reports/<timestamp>.json`.
- Guardrails: bounded total runtime (≤60–90 s), no writes — the DB is hosted Supabase.
- **Gate**: p99 < 500 ms, error rate <1 %. **Doc**: `05-load-testing.md`.

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
- [ ] Step 2 — integration green twice + `02-integration-testing.md`
- [ ] Step 3 — API contracts green + `03-api-testing.md`
- [ ] Step 4 — smoke green + `04-smoke-testing.md`
- [ ] Step 5 — load report under thresholds + `05-load-testing.md`
- [ ] 5 integration-log entries, 5 commits on `testing`, pushed on instruction
