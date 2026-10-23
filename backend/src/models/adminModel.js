// Admin Model — Supabase queries on the `admins` table (login lookup only, SRS §6.4).

const supabase = require('../config/db');
const TABLE = 'admins';

async function findByUsername(username) {
  return supabase.from(TABLE).select('*').eq('username', username).maybeSingle();
}

module.exports = { findByUsername };
