// Owner Auth Controller — request/response handling for /api/owner/auth.

const ownerAuthService = require('../services/ownerAuthService');

async function register(req, res, next) {
  try {
    const result = await ownerAuthService.register(req.body || {});
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const result = await ownerAuthService.login(username, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const result = await ownerAuthService.logout();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// GET /me — profile of the signed-in owner.
async function me(req, res, next) {
  try {
    const owner = await ownerAuthService.getProfile(req.owner.owner_id);
    res.json({ success: true, data: owner });
  } catch (err) {
    next(err);
  }
}

// PUT /me — edit account details.
async function updateMe(req, res, next) {
  try {
    const owner = await ownerAuthService.updateProfile(req.owner.owner_id, req.body || {});
    res.json({ success: true, data: owner });
  } catch (err) {
    next(err);
  }
}

// PUT /password — change password.
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body || {};
    const result = await ownerAuthService.changePassword(
      req.owner.owner_id,
      current_password,
      new_password
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, updateMe, changePassword };
