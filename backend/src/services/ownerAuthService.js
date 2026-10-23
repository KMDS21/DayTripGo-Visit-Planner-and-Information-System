// Owner Auth Service — business owner registration, login and profile (bcrypt + JWT).

const businessOwnerModel = require('../models/businessOwnerModel');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { signToken } = require('../utils/tokenUtils');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;
const MIN_USERNAME = 3;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const clean = (value) => String(value === null || value === undefined ? '' : value).trim();

// The owner object handed to clients — never carries password_hash.
function toOwner(row) {
  if (!row) return null;
  const { password_hash, ...owner } = row; // eslint-disable-line no-unused-vars
  return owner;
}

function issueToken(owner) {
  return signToken({ owner_id: owner.owner_id, username: owner.username });
}

// ── Registration ──────────────────────────────────────────────────────────
async function register(input = {}) {
  const full_name = clean(input.full_name);
  const email = clean(input.email).toLowerCase();
  const phone = clean(input.phone);
  const username = clean(input.username).toLowerCase();
  const password = String(input.password || '');

  const missing = [];
  if (!full_name) missing.push('full_name');
  if (!email) missing.push('email');
  if (!username) missing.push('username');
  if (!password) missing.push('password');
  if (missing.length > 0) throw httpError(400, `Missing or empty required field(s): ${missing.join(', ')}.`);

  if (!EMAIL_RE.test(email)) throw httpError(400, 'email must be a valid email address.');
  if (username.length < MIN_USERNAME) {
    throw httpError(400, `username must be at least ${MIN_USERNAME} characters.`);
  }
  if (password.length < MIN_PASSWORD) {
    throw httpError(400, `password must be at least ${MIN_PASSWORD} characters.`);
  }

  const { data: clashUser, error: userErr } = await businessOwnerModel.findByUsername(username);
  if (userErr) throw httpError(500, `Registration lookup failed: ${userErr.message}`);
  if (clashUser) throw httpError(409, 'That username is already taken.');

  const { data: clashEmail, error: emailErr } = await businessOwnerModel.findByEmail(email);
  if (emailErr) throw httpError(500, `Registration lookup failed: ${emailErr.message}`);
  if (clashEmail) throw httpError(409, 'That email is already registered.');

  const password_hash = await hashPassword(password);
  const { data, error } = await businessOwnerModel.create({
    full_name,
    email,
    phone: phone || null,
    username,
    password_hash,
  });

  if (error) {
    // Race between the checks above and the insert — the unique index wins.
    if (/duplicate|unique/i.test(String(error.message))) {
      throw httpError(409, 'That username or email is already registered.');
    }
    throw httpError(400, `Failed to create account: ${error.message}`);
  }

  return { token: issueToken(data), owner: toOwner(data) };
}

// ── Login ─────────────────────────────────────────────────────────────────
async function login(username, password) {
  const uname = clean(username).toLowerCase();
  if (!uname || !password) throw httpError(400, 'Username and password are required.');

  const { data: owner, error } = await businessOwnerModel.findByUsername(uname);
  if (error) throw httpError(500, `Login lookup failed: ${error.message}`);
  if (!owner) throw httpError(401, 'Invalid username or password.');

  const ok = await comparePassword(password, owner.password_hash);
  if (!ok) throw httpError(401, 'Invalid username or password.');

  return { token: issueToken(owner), owner: toOwner(owner) };
}

// Stateless JWT: the client discards the token on logout.
async function logout() {
  return { message: 'Logged out successfully.' };
}

// ── Profile ───────────────────────────────────────────────────────────────
async function getProfile(ownerId) {
  const { data, error } = await businessOwnerModel.findById(ownerId);
  if (error) throw httpError(500, `Failed to load profile: ${error.message}`);
  if (!data) throw httpError(404, 'Account not found.');
  return data;
}

async function updateProfile(ownerId, input = {}) {
  const patch = {};

  if (input.full_name !== undefined) {
    const v = clean(input.full_name);
    if (!v) throw httpError(400, 'full_name cannot be empty.');
    patch.full_name = v;
  }
  if (input.bio !== undefined) patch.bio = String(input.bio || '').trim() || null;
  if (input.phone !== undefined) patch.phone = clean(input.phone) || null;

  if (input.email !== undefined) {
    const email = clean(input.email).toLowerCase();
    if (!EMAIL_RE.test(email)) throw httpError(400, 'email must be a valid email address.');
    const { data: clash, error } = await businessOwnerModel.findByEmail(email);
    if (error) throw httpError(500, `Profile lookup failed: ${error.message}`);
    if (clash && Number(clash.owner_id) !== Number(ownerId)) {
      throw httpError(409, 'That email is already registered.');
    }
    patch.email = email;
  }

  if (Object.keys(patch).length === 0) throw httpError(400, 'No editable field was supplied.');

  const { data, error } = await businessOwnerModel.update(ownerId, patch);
  if (error) throw httpError(400, `Failed to update profile: ${error.message}`);
  if (!data) throw httpError(404, 'Account not found.');
  return data;
}

async function changePassword(ownerId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw httpError(400, 'current_password and new_password are required.');
  }
  if (String(newPassword).length < MIN_PASSWORD) {
    throw httpError(400, `new_password must be at least ${MIN_PASSWORD} characters.`);
  }

  // findByUsername is the one lookup that returns password_hash.
  const profile = await getProfile(ownerId);
  const { data: row, error } = await businessOwnerModel.findByUsername(profile.username);
  if (error) throw httpError(500, `Password change failed: ${error.message}`);
  if (!row) throw httpError(404, 'Account not found.');

  const ok = await comparePassword(String(currentPassword), row.password_hash);
  if (!ok) throw httpError(401, 'Current password is incorrect.');

  const password_hash = await hashPassword(String(newPassword));
  const { error: updErr } = await businessOwnerModel.updatePassword(ownerId, password_hash);
  if (updErr) throw httpError(400, `Failed to change password: ${updErr.message}`);

  return { message: 'Password changed successfully.' };
}

module.exports = { register, login, logout, getProfile, updateProfile, changePassword };
