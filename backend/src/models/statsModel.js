// Stats Model — exact row counts for the admin dashboard (Data Tier).

const supabase = require('../config/db');

// Returns { count, error } — count is null when the table is missing
// (e.g. migration 002 not run yet) so callers can degrade gracefully.
async function countRows(table, { column, value } = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (column) query = query.eq(column, value);

  const { count, error } = await query;
  if (error) return { count: null, error: error.message };
  return { count, error: null };
}

module.exports = { countRows };
