// Playwright config — DayTripGO smoke suite (step 4 of 5).
//
// One command turns the whole deployed-shape stack green/red:
//     npm run test:smoke          (from the repo root)
//
// It boots two webServers:
//   backend  → http://localhost:5000  (Express + real Supabase)
//   frontend → http://localhost:4173  (`vite build && vite preview` of the
//              production bundle; vite preview inherits server.proxy, so /api
//              and /uploads forward to the backend — one origin, like a real
//              deployment behind a reverse proxy)

const path = require('path');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  timeout: 60_000,
  fullyParallel: false, // one shared backend; sequential keeps logs readable
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm start',
      cwd: path.join(__dirname, '..', '..', 'backend'),
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      cwd: path.join(__dirname, '..', '..', 'frontend'),
      url: 'http://localhost:4173/',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
