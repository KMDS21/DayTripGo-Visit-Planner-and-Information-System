// Visit Plan Model — Supabase queries on `visit_plans` + `visit_plan_items` (Data Tier).

const supabase = require('../config/db');
const PLANS = 'visit_plans';
const ITEMS = 'visit_plan_items';

async function createPlan({ sessionId = null, title = 'My One-Day Plan' } = {}) {
  return supabase
    .from(PLANS)
    .insert({ session_id: sessionId, plan_title: title })
    .select()
    .single();
}

async function findById(planId) {
  return supabase.from(PLANS).select('*').eq('plan_id', planId).maybeSingle();
}

// Plan with its items and the full place record of each item.
async function findWithItems(planId) {
  return supabase
    .from(PLANS)
    .select('*, visit_plan_items (*, places (*))')
    .eq('plan_id', planId)
    .maybeSingle();
}

// Replace-all model: clear existing items, insert the new ordered set (FR-10/11/13).
async function replaceItems(planId, items) {
  const del = await supabase.from(ITEMS).delete().eq('plan_id', planId);
  if (del.error) return del;
  if (items.length === 0) return { data: [], error: null };

  const rows = items.map((item) => ({
    plan_id: planId,
    place_id: Number(item.place_id),
    visit_order: Number(item.visit_order),
  }));
  return supabase.from(ITEMS).insert(rows).select();
}

module.exports = { createPlan, findById, findWithItems, replaceItems };
