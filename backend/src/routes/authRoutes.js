// Auth Routes — /api/auth
// POST /login is public; POST /logout requires a valid token (plan §14.3 Step 7).

const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
