// Stats Controller — GET /api/admin/stats (admin JWT required).

const statsService = require('../services/statsService');

async function getStats(req, res, next) {
  try {
    const stats = await statsService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
