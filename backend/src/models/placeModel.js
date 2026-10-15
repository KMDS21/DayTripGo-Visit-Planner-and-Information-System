// Place Model — Supabase queries on the `places` table (Data Tier).

const supabase = require('../config/db');
const TABLE = 'places';

async function findAll() {
  return supabase.from(TABLE).select('*').order('distance_km', { ascending: true });
}

async function findByCategory(categoryId) {
  return supabase
    .from(TABLE)
    .select('*')
    .eq('category_id', categoryId)
    .order('distance_km', { ascending: true });
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
