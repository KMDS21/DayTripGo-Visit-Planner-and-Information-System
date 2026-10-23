// Business Owner Model — Supabase queries on the `business_owners` table.

const supabase = require('../config/db');
const TABLE = 'business_owners';

// Columns exposed to callers. password_hash never leaves this module.
const PUBLIC_COLUMNS =
  'owner_id, full_name, email, phone, username, bio, created_at, updated_at';

async function findByUsername(username) {
  return supabase.from(TABLE).select('*').eq('username', username).maybeSingle();
}

async function findByEmail(email) {
  return supabase.from(TABLE).select('*').eq('email', email).maybeSingle();
}

async function findById(ownerId) {
  return supabase.from(TABLE).select(PUBLIC_COLUMNS).eq('owner_id', ownerId).maybeSingle();
}

// Owner directory for the admin moderation view (name + email only).
async function findAllPublic() {
  return supabase.from(TABLE).select('owner_id, full_name, email').order('owner_id', {
    ascending: true,
  });
}

async function create(fields) {
  return supabase.from(TABLE).insert(fields).select(PUBLIC_COLUMNS).single();
}

// Profile edit — never writes password_hash (that has its own path).
async function update(ownerId, fields) {
  const safe = { ...fields };
  delete safe.password_hash;
  delete safe.owner_id;
  delete safe.created_at;
  return supabase
    .from(TABLE)
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();
}

async function updatePassword(ownerId, passwordHash) {
  return supabase
    .from(TABLE)
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .select('owner_id')
    .maybeSingle();
}

module.exports = {
  findByUsername,
  findByEmail,
  findById,
  findAllPublic,
  create,
  update,
  updatePassword,
};
