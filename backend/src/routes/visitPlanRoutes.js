// Visit Plan Routes — /api/visit-plans
// Public and session-based: tourists never authenticate (SRS NFR-7).
// POST create · GET /:id view · PUT /:id add/remove/reorder (FR-10…FR-13)

const express = require('express');
const visitPlanController = require('../controllers/visitPlanController');
const { validatePlanItems } = require('../middleware/validate');

const router = express.Router();

router.post('/', visitPlanController.createPlan);
router.get('/:id', visitPlanController.getPlan);
router.put('/:id', validatePlanItems, visitPlanController.updatePlan);

module.exports = router;
