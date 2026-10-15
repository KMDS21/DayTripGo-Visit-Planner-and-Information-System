// Auth Service — admin login (bcrypt compare + JWT) (SRS FR-14, NFR-5).

const crypto = require('crypto');
const adminModel = require('../models/adminModel');
const { comparePassword } = require('../utils/passwordUtils');
const { signToken } = require('../utils/tokenUtils');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

async function login(username, password) {
  if (!username || !password) throw httpError(400, 'Username and password are required.');

  // Optional env override (demo convenience): when ADMIN_USERNAME and
  // ADMIN_PASSWORD are both set, they win over the admins table.
  const envUser = process.env.ADMIN_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD;
  if (envUser && envPass) {
    if (safeEqual(username, envUser) && safeEqual(password, envPass)) {
      const token = signToken({ admin_id: 1, username: envUser });
      return { token, admin: { admin_id: 1, username: envUser } };
    }
    throw httpError(401, 'Invalid username or password.');
  }

  // Default path: admins table lookup + bcrypt compare (SRS NFR-5).
  const { data: admin, error } = await adminModel.findByUsername(username);
  if (error) throw httpError(500, `Login lookup failed: ${error.message}`);
  if (!admin) throw httpError(401, 'Invalid username or password.');

  const ok = await comparePassword(password, admin.password_hash);
  if (!ok) throw httpError(401, 'Invalid username or password.');

  const token = signToken({ admin_id: admin.admin_id, username: admin.username });
  return { token, admin: { admin_id: admin.admin_id, username: admin.username } };
}

// Stateless JWT: the client discards the token on logout.
async function logout() {
  return { message: 'Logged out successfully.' };
}

module.exports = { login, logout };
