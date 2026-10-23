// Integration helpers — fixture tagging and Supabase result handling.
//
// Every row the integration suite creates is tagged IT-<timestamp> and
// removed in afterAll, so the tests can run against the real Supabase
// project without leaving data behind — even when a test fails half-way
// (each file also does defensive tag-based deletes for exactly that case).

const supabase = require('../../src/config/db');

// Unique per test file (call once at module scope).
function makeTag() {
  return `IT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Supabase returns { data, error } — surface the server message instead of
// letting an undefined `data` fail later with something cryptic.
function expectOk({ data, error }) {
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
}

// Full Google Maps URLs with coordinates in them parse locally — no network
// hop, no flaky redirect following during tests.
function mapsUrlWithCoords(lat, lng) {
  return `https://www.google.com/maps/@${lat},${lng},15z`;
}

module.exports = { supabase, makeTag, expectOk, mapsUrlWithCoords };
