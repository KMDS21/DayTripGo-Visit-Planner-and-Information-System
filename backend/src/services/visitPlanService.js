// Visit Plan Service — session-based one-day plan management (SRS FR-10…FR-13, NFR-7).

const visitPlanModel = require('../models/visitPlanModel');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function createPlan(sessionId) {
  const { data, error } = await visitPlanModel.createPlan({ sessionId });
  if (error) throw httpError(400, `Failed to create visit plan: ${error.message}`);
  return data;
}

async function getPlan(planId) {
  const { data, error } = await visitPlanModel.findWithItems(planId);
  if (error) throw httpError(500, `Failed to load visit plan: ${error.message}`);
  if (!data) throw httpError(404, 'Visit plan not found.');
  // Flatten nested rows: keep the ordered items with their place details.
  const items = (data.visit_plan_items || [])
    .slice()
    .sort((a, b) => a.visit_order - b.visit_order)
    .map(({ visit_plan_items, places, ...item }) => ({ ...item, place: places }));
  return { ...data, visit_plan_items: items };
}

async function setPlanItems(planId, items) {
  const { error } = await visitPlanModel.findById(planId);
  if (error) throw httpError(500, `Failed to load visit plan: ${error.message}`);
  const { error: itemError } = await visitPlanModel.replaceItems(planId, items);
  if (itemError) throw httpError(400, `Failed to update visit plan items: ${itemError.message}`);
  return getPlan(planId);
}

module.exports = { createPlan, getPlan, setPlanItems };
