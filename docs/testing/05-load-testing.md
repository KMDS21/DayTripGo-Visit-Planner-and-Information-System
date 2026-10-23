# 05 · Load Testing — DayTripGO

> Step 5 of 5 in the test-suite rollout (plan: unit → integration → API → smoke → load).
> Load tests hammer the **read-only public endpoints** with autocannon under the agreed guardrails: **≤50 connections, ≤90 s total, no writes** — the database is hosted Supabase.

## Result at a glance — ⚠️ verdict: FAIL (reproducible, 2/2 runs)

| Gate | Result |
| ---- | ------ |
| Error rate < 1 % | ✅ **0.000 % in every phase of both runs** |
| p99 latency < 500 ms | ❌ **missed on DB-backed phases** (502–1047 ms); the no-DB phase passed at 6 ms |

The suite itself works exactly as designed — it ran twice, produced two JSON reports, and correctly exited non-zero. The failing gate is a **real performance finding**, documented below, not a test defect.

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

## Ways to get p99 under 500 ms (for a later round)

1. **Cache the public reads** — `/api/places` and `/api/content/home` are public and rarely change; an in-process (or edge) cache with a short TTL removes the ~320 ms DB hop from all but the first request, which would put p99 near the health-endpoint numbers.
2. **Region proximity** — hosting the app near the Supabase region cuts the round-trip floor directly.
3. **Threshold recalibration** — if p99 < 500 ms must hold *with* a cold DB hop per request, the target realistically needs to reflect the ~320 ms floor (e.g. p99 < 700 ms), agreed with the developer rather than quietly moved.

## How to run

```bash
npm run test:load       # from the repo root (backend auto-spawned if not running)
```

Root devDeps for this round: `autocannon ^8`.

## Gate (step 5 acceptance)

- Suite runs to completion twice with **identical verdicts** — reports persisted, exit code honours the thresholds ✅
- **p99 gate missed** on DB-backed phases (documented above); error gate passed with 0 % in all 8 phase-runs
- Backend `npm test` now chains **all three backend suites**: unit 62 → integration 21 → API 16 = **99 tests, exit 0** (~66 s)

## Rollout complete

All five layers exist and run: **unit 116 (both apps) · integration 21 · API 16 · smoke 7 · load 4 phases** — remaining backlog (perf follow-ups above, `markRead` 500, 403 decision, JSON 404 catch-all, dead dep) is tracked in [`TESTING-PLAN.md`](TESTING-PLAN.md) → *Deferred — to build later*.
