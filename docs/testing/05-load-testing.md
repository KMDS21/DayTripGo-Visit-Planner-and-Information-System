# 05 · Load Testing — DayTripGO

> Step 5 of 5 in the test-suite rollout (plan: unit → integration → API → smoke → load).
> Load tests hammer the **read-only public endpoints** with autocannon under the agreed guardrails: **≤50 connections, ≤90 s total, no writes** — the database is hosted Supabase.

## Result at a glance — ✅ verdict: PASS (round 2, after the caching fix)

| Gate | Round 1 — before fix | Round 2 — after fix |
| ---- | -------------------- | ------------------- |
| Error rate < 1 % | ✅ 0.000 % (all phases, 2 runs) | ✅ 0.000 % (all phases) |
| p99 latency < 500 ms | ❌ **502–1047 ms** on DB-backed phases | ✅ **10–135 ms everywhere** |

Round 1 (kept below as history) **failed the p99 gate reproducibly (2/2 runs)** and diagnosed the cause precisely: every DB-backed request paid a fixed ~320 ms hosted-Supabase round-trip. The agreed fix (deferred item 7 — *cache the public reads*) landed the same day; round 2 clears the gate with margin. **All three JSON reports are committed as evidence.**

### Round 2 — after the caching fix (2026-10-23): PASS

What changed in the backend:

- `utils/ttlCache.js` — tiny in-process TTL cache (60 s safety net, bounded size).
- `placeService.listPlaces` — caches the **public** list only (`?scope=admin` always reads fresh); **every place write (create/update/delete/publish) invalidates it**, so admin edits are visible immediately.
- `contentService.getPage` — caches per page; `updatePage` invalidates that page before its re-read.
- Side effect worth knowing: cached JSON is served without re-deriving coordinates per row, which also removes the per-request `withCoords` work on the hot path.

Measurements (one run, same phases/guardrails, verdict **PASS**, exit 0):

| Phase | req/s | avg | p90 | **p99** | errors |
| ----- | ----- | --- | --- | ------- | ------ |
| health baseline (10 conns) | 2124 | 4.2 ms | 6 ms | **10 ms** ✅ | 0 % |
| places steady (10 conns) | 1897 | 4.8 ms | 7 ms | **10 ms** ✅ | 0 % |
| places peak (50 conns) | 1679 | 29.3 ms | 33 ms | **135 ms** ✅ | 0 % |
| content peak (50 conns) | 2012 | 24.4 ms | 25 ms | **114 ms** ✅ | 0 % |

Report: `tests/load/reports/2026-10-23T04-40-52-155Z.json`. Throughput on the DB-backed endpoints jumped ~12× (156 → 1679 rps at 50 conns) because the cache turns the ~320 ms DB hop into an in-memory read; the residual p99 at 50 conns is Express/JSON work under concurrency, nowhere near the gate. The runner reused the already-running backend — confirmed to be serving the fixed code (unmatched `/api` route answers the JSON 404 envelope, `Content-Type: application/json`). The ~320 ms cost still exists on the **cold path** (first request after a write/TTL expiry) and on `GET /api/places/:id`, which was intentionally left uncached this round.

## Measurements — round 1 (before the fix): FAIL, reproducible 2/2 runs

## What runs

`tests/load/load.js` — one command, `npm run test:load` from the repo root:

1. Reuses a running backend on `:5000`, otherwise spawns `node src/server.js` (and kills it afterwards)
2. Warms each endpoint (5 requests) so Supabase cold caches don't pollute the first phase
3. Runs the phases below (ramp 10 → 50 connections, 85 s total — **the guardrails are enforced in code**: the script refuses to start if durations exceed 90 s, connections exceed 50, or a URL is not one of the read-only endpoints)
4. Writes `tests/load/reports/<timestamp>.json` and exits **0 only if every phase meets both thresholds**

| Phase | Endpoint | Connections | Duration |
| ----- | -------- | ----------- | -------- |
| health baseline | `GET /api/health` | 10 | 15 s |
| places steady | `GET /api/places` | 10 | 20 s |
| places peak | `GET /api/places` | 50 | 30 s |
| content peak | `GET /api/content/home` | 50 | 20 s |

## Measurements (both runs)

| Phase | Run 1 (p99 / rps / err) | Run 2 (p99 / rps / err) | Gate |
| ----- | ----------------------- | ----------------------- | ---- |
| health baseline | **6 ms** / 7699 rps / 0 % | **6 ms** / 7239 rps / 0 % | ✅ |
| places steady (10) | 1047 ms / 30 rps / 0 % | 406 ms / 32 rps / 0 % | ❌ / ✅ |
| places peak (50) | 525 ms / 156 rps / 0 % | 594 ms / 156 rps / 0 % | ❌ |
| content peak (50) | 530 ms / 156 rps / 0 % | 502 ms / 160 rps / 0 % | ❌ |

Reports: `tests/load/reports/2026-10-23T04-00-28-633Z.json` and `…04-02-54-017Z.json`.

## Analysis — where the time actually goes

- **The application layer is not the bottleneck**: `/api/health` (no database) does **7200–7700 req/s at 0.8 ms average, p99 6 ms**. Express, Node and the machine all have enormous headroom.
- **Every DB-backed request costs a fixed ~310–340 ms** — visible as the identical average across 10 and 50 connections. That is the **hosted-Supabase round-trip floor** (this machine → Supabase region RTT + PostgREST), not code: the same value appears regardless of concurrency, and throughput simply saturates at `connections ÷ 0.32 s` (10 → ~30 rps, 50 → ~156 rps, exactly as observed).
- **p99 sits just above the 500 ms gate** (502–594 ms at peak) because jitter stacks on top of that ~320 ms floor. Run 1's 1047 ms steady-phase p99 came from a handful of slow outliers on a small sample (cold pool / Supabase hiccup).
- **Zero errors everywhere**: no timeouts, no 5xx, no connection failures — the stack is stable under sustained load, only tail latency misses target.

## Ways to get p99 under 500 ms (the round-1 fix list)

1. ✅ **Cache the public reads** — **done the same day (2026-10-23)**; see *Round 2* above. This is what moved the verdict from FAIL to PASS.
2. **Region proximity** — still open, and now only matters for the cold path (first request after a write/TTL expiry) and for uncached endpoints like `GET /api/places/:id`.
3. ~~**Threshold recalibration**~~ — no longer needed: the gate passes with the real target intact (p99 10–135 ms vs 500 ms). It stays documented here as the option that was deliberately **not** taken.

## How to run

```bash
npm run test:load       # from the repo root (backend auto-spawned if not running)
```

Root devDeps for this round: `autocannon ^8`.

## Gate (step 5 acceptance) — ✅ met (round 2)

- Round 1 ran twice with **identical FAIL verdicts** — reports persisted, exit code honoured the thresholds, gate never relaxed ✅
- Round 2 (after the caching fix): **PASS** — p99 10–135 ms against the 500 ms gate, 0 % errors in every phase ✅
- Backend `npm test` chains **all three backend suites**: unit 71 → integration 21 → API 16 = **108 tests, exit 0** (the unit count grew with the ttlCache suite and the PGRST116 mapping cases)

## Rollout complete

All five layers exist and run: **unit 125 (backend 71 + frontend 54) · integration 21 · API 16 · smoke 7 · load 4 phases (PASS)** — remaining backlog (`403` decision, region proximity for the cold path, dead playfair dep) is tracked in [`TESTING-PLAN.md`](TESTING-PLAN.md) → *Deferred — to build later*.
