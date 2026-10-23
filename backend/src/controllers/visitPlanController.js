// Visit Plan Controller — request/response handling for /api/visit-plans.

const visitPlanService = require('../services/visitPlanService');

async function createPlan(req, res, next) {
  try {
    const sessionId = req.body && req.body.session_id ? String(req.body.session_id) : null;
    const plan = await visitPlanService.createPlan(sessionId);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function getPlan(req, res, next) {
  try {
    const plan = await visitPlanService.getPlan(req.params.id);
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function updatePlan(req, res, next) {
  try {
    const plan = await visitPlanService.setPlanItems(req.params.id, req.body.items);
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPlan, getPlan, updatePlan };
