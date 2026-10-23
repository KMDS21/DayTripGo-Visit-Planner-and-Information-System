# 04 · Smoke Testing — DayTripGO

> Step 4 of 5 in the test-suite rollout (plan: unit → integration → API → smoke → load).
> Smoke tests boot the **whole deployed-shape stack** — Express API + the *production* frontend bundle — and prove the key pages render in a real browser with a clean console. One command turns the entire app green/red.

## What this layer covers

`tests/smoke/smoke.spec.js` (Playwright, headless Chromium, sequential):

| Test | What is proven |
| ---- | -------------- |
| API health through the frontend origin | `vite preview`'s proxy is live — `/api/health` answers on the same origin the page uses |
| Home `/` | `DayTripGO` title, visible non-empty hero `h1`, public footer shell |
| Explore `/explore` | the page waits for a **200 from `/api/places`** and shows its heading — grid data actually arrives |
| Visit plan `/visit-plan` | planner shell renders (map components included) |
| Contact `/contact` | heading + the name/email enquiry inputs render |
| `/admin` | redirects to `/admin/login`, username/password fields present |
| Admin login → dashboard | real login through the proxy, `ProtectedRoute` admits, `Dashboard` heading + sidebar link render |

**Every test also fails on any `console.error` or uncaught page error.** The only exemption is OpenStreetMap tile hosts (`tile.openstreetmap.*`) — an OSM rate-limit is not an application failure.

## Assertions are landmarks, not frozen copy

All page headings are **admin-editable** (`page_content`), so the specs assert a *visible, non-empty* `h1` rather than hard-coded text an editor could legitimately change. Fixed strings are used only where they are truly fixed (the login button label, the `Dashboard` heading, the document title).

## Stack under test (how one command boots everything)

`playwright.config.js` runs **two webServers**:

```bash
backend  → npm start                                   # Express on :5000, real Supabase
frontend → npm run build && npm run preview -- --port 4173 --strictPort
```

- `vite preview` serves the **production bundle** (not the dev server) and **inherits `server.proxy`**, so `/api` and `/uploads` forward to the backend — one origin, exactly like a reverse-proxy deployment. (Verified empirically with a probe request before trusting it.)
- `reuseExistingServer: true` reuses already-running servers for fast local iteration.
- Admin credentials come from `backend/.env` (`ADMIN_USERNAME`/`ADMIN_PASSWORD`) with the same precedence as `authService`, falling back to the seeded `admin` account.

## How to run

```bash
npm run test:smoke       # from the repo root
```

One-time browser setup on a new machine: `npx playwright install chromium` (~300 MB of downloads: Chromium + headless shell + ffmpeg).

Repo-root tooling: `package.json` (new, private) holds `@playwright/test` and `dotenv`; `test-results/` is git-ignored.

## Gate (step 4 acceptance)

- **One command = app green/red**: `npm run test:smoke` → **7/7 green**, ~17–26 s, run twice consecutively
- A genuine failure mid-rollout proved the gate bites: the first run went red on a strict-mode selector clash (dashboard quick-card vs sidebar link) and printed a failure screenshot — fixed by scoping the locator to `#admin-sidebar`
- Earlier steps unaffected: unit 62 · integration 21 · API 16 all still green; `npm run build` / `npm run lint` green

## Next step

→ **Step 5 — Load testing** (`docs/testing/05-load-testing.md`): autocannon against the read-only endpoints (`/api/health`, `/api/places`, `/api/content/home`) with p99/latency and error-rate thresholds.
