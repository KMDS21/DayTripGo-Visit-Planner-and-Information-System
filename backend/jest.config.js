// Jest configuration — DayTripGO backend test suites.
// Tests live in tests/{unit,integration,api}; step 1 only runs tests/unit.

module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  // Integration/API suites talk to real Supabase over the network.
  testTimeout: 15000,
};
