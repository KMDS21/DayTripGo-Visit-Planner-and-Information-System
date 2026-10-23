# 01 · Unit Testing — DayTripGO

> Step 1 of 5 in the test-suite rollout (plan: unit → integration → API → smoke → load).
> Unit tests are **hermetic**: no server, no Supabase, no network — pure logic with the data layer mocked.

## What this layer covers

### Backend (Jest) — `backend/tests/unit/`

| File | Target | What is asserted |
| ---- | ------ | ---------------- |
| `passwordUtils.test.js` | `utils/passwordUtils` | bcrypt hash ≠ plain, unique salt per hash, accept/reject on compare (SRS NFR-5) |
| `tokenUtils.test.js` | `utils/tokenUtils` | sign→verify round-trip, tampered/foreign-secret/expired tokens rejected, clear error when `JWT_SECRET` missing (FR-14, NFR-5) |
| `googleMaps.test.js` | `utils/googleMaps` | accepted/rejected link forms, all three coordinate patterns, range validation, short-link resolution with **mocked `fetch`** (direct hits, offline → null, cache-on-second-call) |
| `uploadConfig.test.js` | `utils/uploadConfig` | allowed mimes/extensions, UUID filenames, magic-byte sniffing (JPEG/PNG/WEBP/AVIF vs PDF), quota maths, `removeStoredImage` deletes only `/uploads/places/*` (self-cleaning temp file) |
| `validate.test.js` | `middleware/validate` | `validatePlace` / `validatePlanItems` 400-vs-`next()` contracts without a server: missing fields listed together, coordinate ranges, Maps-link validation, plan-item shape (FR-19) |
| `messageService.test.js` | `services/messageService` | model **mocked** (`jest.mock`): required-field and email 400s, field trimming/truncation, defaults (`General enquiry`, `status: new`), missing-table → 503 with migration hint, unexpected error → 500, 404 paths |

### Frontend (Vitest + jsdom) — `frontend/tests/unit/`

| File | Target | What is asserted |
| ---- | ------ | ---------------- |
| `formatHours.test.js` | `utils/formatHours` | `to12h` across midnight/noon boundaries, en-dash joining, dash unification + whitespace collapse (FR-5) |
| `hoursRange.test.js` | `utils/hoursRange` | stored string ↔ three form fields, dotted meridiems, noon/midnight, mid-text ranges kept whole, **compose→parse round-trip** |
| `googleMaps.test.js` | `utils/googleMaps` | the embed-src ladder: own coordinates → parsed from link → raw link as query → null; zoom param; non-finite fallback |
| `placeImage.test.js` | `utils/placeImage` | real URL wins, SVG placeholder otherwise, XML-escaping of names (`<T&F>` cannot break the SVG), per-category palettes (FR-1/FR-7) |
| `featuredConfig.test.js` | `utils/featuredConfig` | CSV/pair parsing, junk-id filtering, serialisation, **parse→serialize→parse stability** |
| `api.test.js` | `services/api.errorMessage` | server message → axios message → friendly default ladder (NFR-9) |

## How to run

```bash
# Backend (Jest)
cd backend
npm run test:unit          # = jest tests/unit

# Frontend (Vitest)
cd frontend
npm run test:unit          # = vitest run
```

`npm test` in each package now maps to `test:unit` for step 1; steps 2–3 will extend the backend `test` script to run integration and API suites too.

## Test-infra notes (why the config looks like this)

- **`backend/tests/setup.js`** (Jest `setupFiles`) injects dummy `SUPABASE_URL` / key / `JWT_SECRET` **before any test file loads a module** — `src/config/db.js` calls `process.exit(1)` when they are missing, which would kill the worker before mocks can apply.
- **`backend/jest.config.js`**: `testEnvironment: node`, `testMatch: tests/**/*.test.js`, `testTimeout: 15000` (generous already for the network suites added in steps 2–3).
- **Network-free by design**: `googleMaps` tests stub `global.fetch` (restored in `afterEach`), the failed-fetch case runs on fake timers so the resolver's 4s abort timer cannot leak past the run; `messageService` tests auto-mock the model module.
- **`frontend/vitest.config.js`**: `environment: jsdom` + `pool: 'vmThreads'` (one jsdom per worker — cut the run from 16.9s to 6.3s), setup file registers `@testing-library/jest-dom` matchers.

## Gate (step 1 acceptance)

- Backend: **6 suites / 62 tests green**, no open-handle warning, ~3.2 s
- Frontend: **6 files / 54 tests green**, ~6.3 s
- Combined **116 tests in under ~10 s** — fast enough to run before every commit
- `npm run build` and `npm run lint` remain green with the new config files in the tree

## Next step

→ **Step 2 — Integration testing** (`docs/testing/02-integration-testing.md`): real Supabase round-trips with `IT-<timestamp>` fixtures, cleaned up in `afterAll`.
