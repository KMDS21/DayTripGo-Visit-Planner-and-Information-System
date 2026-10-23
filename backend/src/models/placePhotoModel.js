// Place Photo Model — Supabase queries on the `place_photos` table (Data Tier).
// One row per uploaded image; the row flagged is_primary is the card photo
// shown on the public cards (kept in sync with places.image_url by the service).

const supabase = require('../config/db');
const TABLE = 'place_photos';

async function findByPlace(placeId) {
  return supabase.from(TABLE).select('*').eq('place_id', placeId).order('created_at', { ascending: true });
}

async function findById(photoId) {
  return supabase.from(TABLE).select('*').eq('photo_id', photoId).maybeSingle();
}

async function countByPlace(placeId) {
  return supabase.from(TABLE).select('*', { count: 'exact', head: true }).eq('place_id', placeId);
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

module.exports = { findByPlace, findById, countByPlace, create, update, remove };
