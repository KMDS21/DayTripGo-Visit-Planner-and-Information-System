// Place Model — Supabase queries on the `places` table (Data Tier).

const supabase = require('../config/db');
const TABLE = 'places';

// Public lists only show published places; admin views pass
// { includeUnpublished: true } (guarded by the JWT in the route). If the
// published column does not exist yet (migration 005 not run), the filter is
// skipped so the site keeps working — every request retries the filter, so it
// starts applying as soon as the migration is applied. `build` is a factory:
// supabase builders mutate, so each attempt needs a fresh one.
async function applyPublishedFilter(build, { includeUnpublished = false } = {}) {
  if (includeUnpublished) return build();
  const filtered = await build().eq('published', true);
  if (filtered.error) {
    console.warn(`[places] published filter skipped: ${filtered.error.message}`);
    return build();
  }
  return filtered;
}

// Places used to be sorted by distance from Wadduwa; that column is gone
// (migration 006), so listings now come back in creation order — oldest
// first, which is stable across reloads and filters.
async function findAll(options = {}) {
  return applyPublishedFilter(
    () => supabase.from(TABLE).select('*').order('place_id', { ascending: true }),
    options
  );
}

async function findByCategory(categoryId, options = {}) {
  return applyPublishedFilter(
    () =>
      supabase
        .from(TABLE)
        .select('*')
        .eq('category_id', categoryId)
        .order('place_id', { ascending: true }),
    options
  );
}

async function findById(placeId) {
  return supabase.from(TABLE).select('*').eq('place_id', placeId).maybeSingle();
}

async function create(fields) {
  return supabase.from(TABLE).insert(fields).select().single();
}

async function update(placeId, fields) {
  return supabase.from(TABLE).update(fields).eq('place_id', placeId).select().single();
}

async function remove(placeId) {
  return supabase.from(TABLE).delete().eq('place_id', placeId);
}

module.exports = { findAll, findByCategory, findById, create, update, remove };
