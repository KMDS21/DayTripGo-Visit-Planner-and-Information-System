// Request Validation Middleware (SRS FR-19)

function validatePlace(req, res, next) {
  const { name, category_id, description, distance_km, latitude, longitude } = req.body || {};

  const missing = [];
  if (!name || String(name).trim() === '') missing.push('name');
  if (!category_id) missing.push('category_id');
  if (!description || String(description).trim() === '') missing.push('description');
  if (distance_km === undefined || distance_km === null || distance_km === '') missing.push('distance_km');
  if (latitude === undefined || latitude === null || latitude === '') missing.push('latitude');
  if (longitude === undefined || longitude === null || longitude === '') missing.push('longitude');

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing or empty required field(s): ${missing.join(', ')}.`,
    });
  }

  if (isNaN(Number(distance_km)) || Number(distance_km) < 0) {
    return res.status(400).json({ success: false, message: 'distance_km must be a non-negative number.' });
  }
  if (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90) {
    return res.status(400).json({ success: false, message: 'latitude must be between -90 and 90.' });
  }
  if (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) {
    return res.status(400).json({ success: false, message: 'longitude must be between -180 and 180.' });
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
