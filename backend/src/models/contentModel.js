// Content Model — Supabase queries on `page_content` (page_key + section_key -> content).

const supabase = require('../config/db');
const TABLE = 'page_content';

async function findByPage(pageKey) {
  return supabase
    .from(TABLE)
    .select('section_key, content, updated_at')
    .eq('page_key', pageKey)
    .order('section_key', { ascending: true });
}

async function upsertRows(rows) {
  if (rows.length === 0) return { data: [], error: null };
  return supabase.from(TABLE).upsert(rows, { onConflict: 'page_key,section_key' }).select();
}

module.exports = { findByPage, upsertRows };
