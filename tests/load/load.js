// Load — step 5 of the five-layer rollout (autocannon).
//
// READ-ONLY endpoints only, ≤50 connections, ≤90 s total — the database is
// hosted Supabase (guardrails agreed with the developer before this round).
// The limits below are enforced by the script itself, so a future edit
// cannot quietly start hammering the production data layer.
//
// One command from the repo root:     npm run test:load
// - reuses an already-running backend, otherwise spawns `node src/server.js`
// - warms each endpoint (Supabase cold caches must not pollute the first phase)
// - writes tests/load/reports/<timestamp>.json
// - exits 0 only if every phase meets BOTH thresholds:
//       p99 latency < 500 ms      and      error rate < 1 %

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const autocannon = require('autocannon');

const BASE = process.env.LOAD_BASE_URL || 'http://localhost:5000';
const BACKEND_DIR = path.join(__dirname, '..', '..', 'backend');
const REPORTS_DIR = path.join(__dirname, 'reports');

const THRESHOLDS = { p99Ms: 500, errorRatePct: 1 };
const GUARDRAILS = { maxConnections: 50, maxTotalSeconds: 90 };

// Connections ramp 10 → 50 across the phases; durations total 85 s.
const PHASES = [
  { name: 'health baseline', url: '/api/health', connections: 10, duration: 15 },
  { name: 'places steady', url: '/api/places', connections: 10, duration: 20 },
  { name: 'places peak', url: '/api/places', connections: 50, duration: 30 },
  { name: 'content peak', url: '/api/content/home', connections: 50, duration: 20 },
];

// ── Guardrails: fail loudly before touching the network ────────────────────
const totalSeconds = PHASES.reduce((sum, p) => sum + p.duration, 0);
const maxConns = Math.max(...PHASES.map((p) => p.connections));
if (totalSeconds > GUARDRAILS.maxTotalSeconds) {
  throw new Error(`Guardrail: phases total ${totalSeconds}s > ${GUARDRAILS.maxTotalSeconds}s cap`);
}
if (maxConns > GUARDRAILS.maxConnections) {
  throw new Error(`Guardrail: ${maxConns} connections > ${GUARDRAILS.maxConnections} cap`);
}
if (PHASES.some((p) => !/^\/api\/(health|places|content)/.test(p.url))) {
  throw new Error('Guardrail: only the read-only endpoints /api/health, /api/places, /api/content/* are allowed');
}

async function probeOk(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureBackend() {
  if (await probeOk(`${BASE}/api/health`)) {
    console.log(`[load] reusing the backend already running on ${BASE}`);
    return null;
  }
  console.log('[load] starting backend (node src/server.js)…');
  const child = spawn('node', ['src/server.js'], { cwd: BACKEND_DIR, stdio: 'ignore' });
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    if (await probeOk(`${BASE}/api/health`)) {
      console.log('[load] backend is up');
      return child;
    }
    if (child.exitCode !== null) break;
  }
  child.kill();
  throw new Error('Backend did not become healthy in 20s — is backend/.env complete?');
}

async function warm(urls) {
  for (const url of urls) {
    for (let i = 0; i < 5; i += 1) {
      await fetch(`${BASE}${url}`, { signal: AbortSignal.timeout(10000) }).catch(() => {});
    }
  }
  console.log('[load] warm-up done (5 requests per endpoint)');
}

function runPhase({ name, url, connections, duration }) {
  return new Promise((resolve, reject) => {
    autocannon(
      { url: `${BASE}${url}`, connections, duration, pipelining: 1 },
      (err, result) => (err ? reject(err) : resolve(result))
    );
  });
}

function summarise(phase, r) {
  const total = r.requests.total || 0;
  const bad = (r.errors || 0) + (r.non2xx || 0);
  const errorRatePct = total ? (bad / total) * 100 : 0;
  const p99 = r.latency.p99;
  const violations = [];
  if (p99 >= THRESHOLDS.p99Ms) violations.push(`p99 ${p99}ms >= ${THRESHOLDS.p99Ms}ms`);
  if (errorRatePct >= THRESHOLDS.errorRatePct) {
    violations.push(`errors ${errorRatePct.toFixed(2)}% >= ${THRESHOLDS.errorRatePct}%`);
  }
  return {
    phase: phase.name,
    url: phase.url,
    connections: phase.connections,
    durationSeconds: phase.duration,
    requestsTotal: total,
    rpsAverage: Math.round(r.requests.average),
    latencyAvgMs: r.latency.average,
    latencyP90Ms: r.latency.p90,
    latencyP99Ms: p99,
    errors: r.errors || 0,
    non2xx: r.non2xx || 0,
    errorRatePct: Number(errorRatePct.toFixed(3)),
    violations,
  };
}

(async () => {
  const started = Date.now();
  let backend = null;
  try {
    backend = await ensureBackend();
    await warm([...new Set(PHASES.map((p) => p.url))]);

    const results = [];
    for (const phase of PHASES) {
      console.log(`[load] ▶ ${phase.name} — GET ${phase.url} · ${phase.connections} conns · ${phase.duration}s`);
      const raw = await runPhase(phase);
      const summary = summarise(phase, raw);
      results.push(summary);
      const mark = summary.violations.length ? '✗' : '✓';
      console.log(
        `[load] ${mark} ${phase.name}: ${summary.rpsAverage} req/s · avg ${summary.latencyAvgMs}ms · ` +
          `p90 ${summary.latencyP90Ms}ms · p99 ${summary.latencyP99Ms}ms · errors ${summary.errorRatePct}%`
      );
    }

    const violations = results.flatMap((r) => r.violations.map((v) => `${r.phase}: ${v}`));
    const verdict = violations.length ? 'FAIL' : 'PASS';
    const report = {
      tool: 'autocannon',
      base: BASE,
      startedAt: new Date(started).toISOString(),
      wallClockSeconds: Math.round((Date.now() - started) / 1000),
      thresholds: THRESHOLDS,
      guardrails: { ...GUARDRAILS, readOnly: true },
      phases: results,
      verdict,
      violations,
    };
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const stamp = new Date(started).toISOString().replace(/[:.]/g, '-');
    const file = path.join(REPORTS_DIR, `${stamp}.json`);
    fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`[load] report → ${path.relative(process.cwd(), file)}`);
    console.log(`[load] verdict: ${verdict}`);
    if (violations.length) {
      violations.forEach((v) => console.log(`[load]   ✗ ${v}`));
    }
    process.exitCode = violations.length ? 1 : 0;
  } catch (err) {
    console.error(`[load] failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (backend) backend.kill();
  }
})();
