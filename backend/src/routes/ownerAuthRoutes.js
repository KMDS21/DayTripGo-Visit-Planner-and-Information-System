// Owner Auth Routes — /api/owner/auth
// register + login are public; logout / me / password need an owner JWT.

const express = require('express');
const ownerAuthController = require('../controllers/ownerAuthController');
const { requireOwner } = require('../middleware/auth');
const { validateOwnerRegister } = require('../middleware/validate');

const router = express.Router();

router.post('/register', validateOwnerRegister, ownerAuthController.register);
router.post('/login', ownerAuthController.login);

router.post('/logout', requireOwner, ownerAuthController.logout);
router.get('/me', requireOwner, ownerAuthController.me);
router.put('/me', requireOwner, ownerAuthController.updateMe);
router.put('/password', requireOwner, ownerAuthController.changePassword);

module.exports = router;
