// Auth Controller — request/response handling for /api/auth.

const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const result = await authService.login(username, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout };
