// Vitest configuration — DayTripGO frontend unit tests (step 1).
// No react plugin needed: esbuild handles .jsx on its own, and the step-1
// suites are pure JS utilities.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // One jsdom per worker instead of one per file — 6 unit files were paying
    // ~4s each for environment creation.
    pool: 'vmThreads',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
  },
});
