// Content Routes — /api/content/:page
// GET is public (public pages need the copy); PUT requires the admin JWT.

const express = require('express');
const contentController = require('../controllers/contentController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:page', contentController.getContent);
router.put('/:page', requireAuth, contentController.updateContent);

module.exports = router;
