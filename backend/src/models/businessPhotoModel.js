// Business Photo Model — Supabase queries on `business_photos`.
// One row per uploaded image: is_primary is the Explore card cover (kept in
// sync with businesses.image_url) and is_featured is the feature card cover.

const supabase = require('../config/db');
const TABLE = 'business_photos';

async function findByBusiness(businessId) {
  return supabase
    .from(TABLE)
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });
}

async function findById(photoId) {
  return supabase.from(TABLE).select('*').eq('photo_id', photoId).maybeSingle();
}

// The feature card cover for a batch of listings — one query fills the whole
// page (the home carousel shows it instead of the Explore card cover).
async function findFeaturedFor(businessIds) {
  if (!businessIds || businessIds.length === 0) return { data: [], error: null };
  return supabase
    .from(TABLE)
    .select('business_id, photo_url')
    .in('business_id', businessIds)
    .eq('is_featured', true);
}

async function countByBusiness(businessId) {
  return supabase.from(TABLE).select('*', { count: 'exact', head: true }).eq('business_id', businessId);
}

async function create(fields) {
  return supabase.from(TABLE).insert(fields).select().single();
}

async function update(photoId, fields) {
  return supabase.from(TABLE).update(fields).eq('photo_id', photoId).select().single();
}

async function remove(photoId) {
  return supabase.from(TABLE).delete().eq('photo_id', photoId);
}

module.exports = { findByBusiness, findById, findFeaturedFor, countByBusiness, create, update, remove };
