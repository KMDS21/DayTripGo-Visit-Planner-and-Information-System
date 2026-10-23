// Business Model — Supabase queries on `businesses` + `business_tags`.
// Ownership is part of the WHERE clause on every owner write, so one owner
// can never read or edit another owner's listing even if a route forgets.

const supabase = require('../config/db');
const TABLE = 'businesses';

// Same graceful-degradation pattern as placeModel: if migration 009 has not
// been run yet the published filter is skipped and retried on the next call.
async function applyPublishedFilter(build, { includeUnpublished = false } = {}) {
  if (includeUnpublished) return build();
  const filtered = await build().eq('published', true);
  if (filtered.error) {
    console.warn(`[businesses] published filter skipped: ${filtered.error.message}`);
    return build();
  }
  return filtered;
}

// PostgREST returns the join as `business_tags`; the API speaks `tags`.
// Only rows fetched WITH the join carry that key — plain select('*') rows must
// leave `tags` undefined so attachTags() knows it still has to look them up
// (setting [] here would make every listing look tag-less).
function normalise(row) {
  if (!row) return row;
  const { business_tags, ...rest } = row;
  if (business_tags === undefined) return rest;
  return { ...rest, tags: business_tags.map((t) => t.category_id) };
}

async function findAll(options = {}) {
  const res = await applyPublishedFilter(
    () => supabase.from(TABLE).select('*').order('business_id', { ascending: true }),
    options
  );
  return { ...res, data: (res.data || []).map(normalise) };
}

// ?tag=<id> — inner join so only businesses carrying that tag come back.
async function findByTag(tagId, options = {}) {
  const res = await applyPublishedFilter(
    () =>
      supabase
        .from(TABLE)
        .select('*, business_tags!inner(category_id)')
        .eq('business_tags.category_id', tagId)
        .order('business_id', { ascending: true }),
    options
  );
  if (res.error) return res; // join unavailable → caller falls back to findAll
  return { ...res, data: (res.data || []).map(normalise) };
}

async function findByOwner(ownerId, options = {}) {
  const res = await applyPublishedFilter(
    () =>
      supabase
        .from(TABLE)
        .select('*')
        .eq('owner_id', ownerId)
        .order('business_id', { ascending: true }),
    options
  );
  return { ...res, data: (res.data || []).map(normalise) };
}

async function findById(businessId) {
  const res = await supabase.from(TABLE).select('*').eq('business_id', businessId).maybeSingle();
  return { ...res, data: normalise(res.data) };
}

// Owner-scoped read: 404 rather than 403 so owners cannot probe for ids.
async function findByIdForOwner(businessId, ownerId) {
  const res = await supabase
    .from(TABLE)
    .select('*')
    .eq('business_id', businessId)
    .eq('owner_id', ownerId)
    .maybeSingle();
  return { ...res, data: normalise(res.data) };
}

async function create(fields) {
  const res = await supabase.from(TABLE).insert(fields).select().single();
  return { ...res, data: normalise(res.data) };
}

async function update(businessId, fields) {
  const res = await supabase
    .from(TABLE)
    .update(fields)
    .eq('business_id', businessId)
    .select()
    .maybeSingle();
  return { ...res, data: normalise(res.data) };
}

async function updateForOwner(businessId, ownerId, fields) {
  const res = await supabase
    .from(TABLE)
    .update(fields)
    .eq('business_id', businessId)
    .eq('owner_id', ownerId)
    .select()
    .maybeSingle();
  return { ...res, data: normalise(res.data) };
}

async function removeForOwner(businessId, ownerId) {
  return supabase
    .from(TABLE)
    .delete()
    .eq('business_id', businessId)
    .eq('owner_id', ownerId)
    .select('business_id, image_url')
    .maybeSingle();
}

async function remove(businessId) {
  return supabase
    .from(TABLE)
    .delete()
    .eq('business_id', businessId)
    .select('business_id, image_url')
    .maybeSingle();
}

// ── Tag links ─────────────────────────────────────────────────────────────

// One query for the whole page instead of one per listing.
async function findTagsFor(businessIds) {
  if (!businessIds || businessIds.length === 0) return { data: [], error: null };
  return supabase
    .from('business_tags')
    .select('business_id, category_id')
    .in('business_id', businessIds);
}

// Full replace keeps the write idempotent (delete-then-insert, same shape
// Postgres would give us from an upsert of a set).
async function replaceTags(businessId, categoryIds) {
  const del = await supabase.from('business_tags').delete().eq('business_id', businessId);
  if (del.error) return del;

  const ids = [...new Set((categoryIds || []).map(Number).filter(Boolean))];
  if (ids.length === 0) return { data: [], error: null };

  const rows = ids.map((category_id) => ({ business_id: Number(businessId), category_id }));
  return supabase.from('business_tags').insert(rows);
}

module.exports = {
  findAll,
  findByTag,
  findByOwner,
  findById,
  findByIdForOwner,
  create,
  update,
  updateForOwner,
  remove,
  removeForOwner,
  findTagsFor,
  replaceTags,
  normalise,
};
