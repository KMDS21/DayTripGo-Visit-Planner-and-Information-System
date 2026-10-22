// Content Routes — /api/content/:page
// GET is public (public pages need the copy); PUT requires the admin JWT.

const express = require('express');
const contentController = require('../controllers/contentController');
const { requireAuth } = require('../middleware/auth');
const { uploader, quotaGate } = require('../middleware/upload');

const router = express.Router();

router.get('/:page', contentController.getContent);
router.put('/:page', requireAuth, contentController.updateContent);
router.post('/:page/cover', requireAuth, quotaGate, uploader.single('cover'), contentController.uploadCover);

module.exports = router;
