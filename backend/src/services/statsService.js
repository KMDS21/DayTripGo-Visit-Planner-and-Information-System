// Stats Service — dashboard counters + server storage status bar (500 MB quota).

const statsModel = require('../models/statsModel');
const uploadConfig = require('../utils/uploadConfig');

async function getStats() {
  const [places, categories, plans, planItems, messages] = await Promise.all([
    statsModel.countRows('places'),
    statsModel.countRows('categories'),
    statsModel.countRows('visit_plans'), // traffic: how many plans visitors created
    statsModel.countRows('visit_plan_items'),
    statsModel.countRows('contact_messages', { column: 'status', value: 'new' }),
  ]);

  const usedBytes = uploadConfig.usedBytes();
  const limitBytes = uploadConfig.MAX_STORAGE_BYTES;
  const warnings = [];
  if (messages.error) {
    warnings.push('contact_messages table is missing — run database/schema/002_contact_content.sql.');
  }
  return {
    places: places.count ?? 0,
    categories: categories.count ?? 0,
    plans: plans.count ?? 0,
    plan_items: planItems.count ?? 0,
    messages_unread: messages.count ?? 0,
    storage: {
      used_bytes: usedBytes,
      limit_bytes: limitBytes,
      free_bytes: Math.max(0, limitBytes - usedBytes),
      percent: Math.round((usedBytes / limitBytes) * 1000) / 10, // 1 decimal
      full: usedBytes >= limitBytes,
    },
    warnings,
  };
}

module.exports = { getStats };
