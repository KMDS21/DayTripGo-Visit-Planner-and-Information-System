// Business Category Model — Supabase queries on `business_categories`.
// The admin-managed tag list owners pick from (Restaurant, Hotel, Vehicle Rental…).

const supabase = require('../config/db');
const TABLE = 'business_categories';

async function findAll() {
  return supabase.from(TABLE).select('*').order('category_id', { ascending: true });
}

async function findById(categoryId) {
  return supabase.from(TABLE).select('*').eq('category_id', categoryId).maybeSingle();
}

async function create(fields) {
  return supabase.from(TABLE).insert(fields).select().single();
}

async function update(categoryId, fields) {
  return supabase
    .from(TABLE)
    .update(fields)
    .eq('category_id', categoryId)
    .select()
    .maybeSingle();
}

async function remove(categoryId) {
  return supabase.from(TABLE).delete().eq('category_id', categoryId);
}

module.exports = { findAll, findById, create, update, remove };
