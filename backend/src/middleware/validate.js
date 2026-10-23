// Request Validation Middleware (SRS FR-19)

const { isGoogleMapsUrl } = require('../utils/googleMaps');

function validatePlace(req, res, next) {
  const { name, category_id, description, latitude, longitude, google_maps_url } = req.body || {};

  const missing = [];
  if (!name || String(name).trim() === '') missing.push('name');
  if (!category_id) missing.push('category_id');
  if (!description || String(description).trim() === '') missing.push('description');

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing or empty required field(s): ${missing.join(', ')}.`,
    });
  }

  // Coordinates are optional now (derived from google_maps_url when possible),
  // but anything supplied must still be in range.
  if (latitude !== undefined && latitude !== null && latitude !== '' &&
      (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)) {
    return res.status(400).json({ success: false, message: 'latitude must be between -90 and 90.' });
  }
  if (longitude !== undefined && longitude !== null && longitude !== '' &&
      (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
    return res.status(400).json({ success: false, message: 'longitude must be between -180 and 180.' });
  }

  // Optional Google Maps link — must look like a real Google Maps URL.
  if (google_maps_url !== undefined && google_maps_url !== null && String(google_maps_url).trim() !== '' &&
      !isGoogleMapsUrl(google_maps_url)) {
    return res.status(400).json({
      success: false,
      message: 'google_maps_url must be a Google Maps link (https://www.google.com/maps/… or https://maps.app.goo.gl/…).',
    });
  }

  next();
}

function validatePlanItems(req, res, next) {
  const { items } = req.body || {};

  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'items must be an array of { place_id, visit_order }.' });
  }
  for (const item of items) {
    if (!item || !item.place_id || isNaN(Number(item.visit_order))) {
      return res.status(400).json({ success: false, message: 'Each item needs a place_id and a numeric visit_order.' });
    }
  }

  next();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/owner/auth/register — owner details + account details.
function validateOwnerRegister(req, res, next) {
  const { full_name, email, username, password } = req.body || {};

  const missing = [];
  if (!full_name || String(full_name).trim() === '') missing.push('full_name');
  if (!email || String(email).trim() === '') missing.push('email');
  if (!username || String(username).trim() === '') missing.push('username');
  if (!password || String(password) === '') missing.push('password');

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing or empty required field(s): ${missing.join(', ')}.`,
    });
  }

  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ success: false, message: 'email must be a valid email address.' });
  }
  if (String(username).trim().length < 3) {
    return res.status(400).json({ success: false, message: 'username must be at least 3 characters.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'password must be at least 6 characters.' });
  }

  next();
}

// POST/PUT /api/businesses — business listing fields.
function validateBusiness(req, res, next) {
  const { name, short_description, description, owner_name, email, website_url, google_maps_url, tags } = req.body || {};

  const missing = [];
  if (!name || String(name).trim() === '') missing.push('name');
  if (!description || String(description).trim() === '') missing.push('description');

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing or empty required field(s): ${missing.join(', ')}.`,
    });
  }

  // Card copy has to fit the Explore card — the same idea as places, where
  // the card only ever shows the first couple of lines.
  if (short_description !== undefined && short_description !== null &&
      String(short_description).trim().length > 160) {
    return res.status(400).json({
      success: false,
      message: 'short_description must be 160 characters or fewer.',
    });
  }
  if (owner_name !== undefined && owner_name !== null &&
      String(owner_name).trim().length > 150) {
    return res.status(400).json({
      success: false,
      message: 'owner_name must be 150 characters or fewer.',
    });
  }

  if (email !== undefined && email !== null && String(email).trim() !== '' &&
      !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ success: false, message: 'email must be a valid email address.' });
  }

  if (google_maps_url !== undefined && google_maps_url !== null && String(google_maps_url).trim() !== '' &&
      !isGoogleMapsUrl(google_maps_url)) {
    return res.status(400).json({
      success: false,
      message: 'google_maps_url must be a Google Maps link (https://www.google.com/maps/… or https://maps.app.goo.gl/…).',
    });
  }

  if (website_url !== undefined && website_url !== null && String(website_url).trim() !== '') {
    const url = String(website_url).trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      return res.status(400).json({ success: false, message: 'website_url must start with http:// or https://.' });
    }
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.some((t) => isNaN(Number(t)))) {
      return res.status(400).json({ success: false, message: 'tags must be an array of category ids.' });
    }
  }

  next();
}

module.exports = { validatePlace, validatePlanItems, validateOwnerRegister, validateBusiness };
