// Business Tag Routes — /api/business-tags
// GET is public (Explore filter + owner form); writes are admin-only.

const express = require('express');
const businessTagController = require('../controllers/businessTagController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', businessTagController.getAllTags);
router.post('/', requireAuth, businessTagController.createTag);
router.put('/:id', requireAuth, businessTagController.updateTag);
router.delete('/:id', requireAuth, businessTagController.deleteTag);

module.exports = router;
