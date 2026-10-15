// Category Model — Supabase queries on the `categories` table (Data Tier).

const supabase = require('../config/db');
const TABLE = 'categories';

async function findAll() {
  return supabase.from(TABLE).select('*').order('category_id', { ascending: true });
}

module.exports = { findAll };
