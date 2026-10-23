// Content Service — per-page editable copy for Home / Explore / My Day Plan / Contact.
// Admins edit it (PUT), the public site reads it (GET) with client-side fallbacks.

const contentModel = require('../models/contentModel');
const { createTtlCache } = require('../utils/ttlCache');

const PAGES = ['home', 'explore', 'plan', 'contact'];
const KEY_PATTERN = /^[a-z0-9_]{1,60}$/;
const MAX_VALUE_LENGTH = 5000;

// Public page copy cache (load round: GET /api/content/:page costs a fixed
// ~320 ms hosted-Supabase round-trip per request). updatePage invalidates the
// affected page, so admin edits are visible immediately; the TTL is a safety
// net for edits made outside this process.
const pageCache = createTtlCache({ ttlMs: 60 * 1000 });

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Friendly error when migration 002 has not been applied yet.
function rethrow(error) {
  const msg = String(error.message || '');
  if (error.code === '42P01' || /does not exist|could not find the table/i.test(msg)) {
    throw httpError(
      503,
      'Content storage is not set up yet — run database/schema/002_contact_content.sql in the Supabase SQL editor.'
    );
  }
  throw httpError(500, `Content request failed: ${msg}`);
}

function assertPage(pageKey) {
  if (!PAGES.includes(pageKey)) {
    throw httpError(404, `Unknown page "${pageKey}". Allowed: ${PAGES.join(', ')}.`);
  }
}

function toMap(rows) {
  const sections = {};
  for (const row of rows || []) sections[row.section_key] = row.content;
  return sections;
}

async function getPage(pageKey) {
  assertPage(pageKey);
  const hit = pageCache.get(pageKey);
  if (hit) return hit;
  try {
    const { data, error } = await contentModel.findByPage(pageKey);
    if (error) return rethrow(error);
    const sections = toMap(data);
    pageCache.set(pageKey, sections);
    return sections;
  } catch (err) {
    if (err.status) throw err;
    return rethrow(err);
  }
}

async function updatePage(pageKey, sections) {
  assertPage(pageKey);
  if (!sections || typeof sections !== 'object' || Array.isArray(sections)) {
    throw httpError(400, 'Send { "sections": { "section_key": "value", ... } }.');
  }

  const rows = [];
  for (const [key, value] of Object.entries(sections)) {
    if (!KEY_PATTERN.test(key)) {
      throw httpError(400, `Invalid section key "${key}" (use lowercase letters, digits, underscores).`);
    }
    if (typeof value !== 'string' || value.length > MAX_VALUE_LENGTH) {
      throw httpError(400, `Section "${key}" must be text of at most ${MAX_VALUE_LENGTH} characters.`);
    }
    rows.push({
      page_key: pageKey,
      section_key: key,
      content: value,
      updated_at: new Date().toISOString(),
    });
  }
  if (rows.length === 0) throw httpError(400, 'No sections supplied.');

  try {
    const { error } = await contentModel.upsertRows(rows);
    if (error) return rethrow(error);
  } catch (err) {
    if (err.status) throw err;
    return rethrow(err);
  }

  // The written page must not be served from cache any more; getPage below
  // re-fetches (and re-warms) it with the fresh rows.
  pageCache.delete(pageKey);
  return getPage(pageKey);
}

module.exports = { PAGES, getPage, updatePage };
