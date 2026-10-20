// Message Model — Supabase queries on `contact_messages` (Contact us responses).

const supabase = require('../config/db');
const TABLE = 'contact_messages';

async function create(fields) {
  return supabase.from(TABLE).insert(fields).select().single();
}

async function findAll() {
  return supabase.from(TABLE).select('*').order('created_at', { ascending: false });
}

async function findById(messageId) {
  return supabase.from(TABLE).select('*').eq('message_id', messageId).maybeSingle();
}

async function markRead(messageId) {
  return supabase
    .from(TABLE)
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('message_id', messageId)
    .select()
    .single();
}

async function remove(messageId) {
  return supabase.from(TABLE).delete().eq('message_id', messageId);
}

module.exports = { create, findAll, findById, markRead, remove };
