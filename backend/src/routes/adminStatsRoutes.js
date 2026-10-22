// Admin Stats Routes — /api/admin/stats (dashboard counters + storage bar).

const express = require('express');
const statsController = require('../controllers/statsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, statsController.getStats);

module.exports = router;
