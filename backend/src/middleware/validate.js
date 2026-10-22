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

module.exports = { validatePlace, validatePlanItems };
