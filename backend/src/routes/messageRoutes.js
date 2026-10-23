// Message Routes — /api/messages
// POST is public (Contact us form); GET/PATCH/DELETE need the admin JWT.

const express = require('express');
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', messageController.submit);
router.get('/', requireAuth, messageController.list);
router.patch('/:id/read', requireAuth, messageController.read);
router.delete('/:id', requireAuth, messageController.remove);

module.exports = router;
