// Place Service — business logic for place listing, filtering and CRUD (SRS FR-1…FR-9, FR-16…FR-19).

const placeModel = require('../models/placeModel');
const { parseCoordsFromGoogleMapsUrl } = require('../utils/googleMaps');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Normalises the optional Google Maps link and derives latitude/longitude
// from it when the caller did not supply coordinates (the admin pastes a
// link instead of typing numbers).
function preparePlaceFields(fields) {
  const out = { ...fields };
  if ('google_maps_url' in out) {
    out.google_maps_url = String(out.google_maps_url || '').trim() || null;
  }
  const hasLat = out.latitude !== undefined && out.latitude !== null && out.latitude !== '';
  const hasLng = out.longitude !== undefined && out.longitude !== null && out.longitude !== '';
  if (out.google_maps_url && (!hasLat || !hasLng)) {
    const coords = parseCoordsFromGoogleMapsUrl(out.google_maps_url);
    if (coords) {
      out.latitude = coords.lat;
      out.longitude = coords.lng;
    }
  }
  for (const key of ['latitude', 'longitude']) {
    if (key in out && (out[key] === '' || out[key] === null)) out[key] = null;
    else if (key in out) out[key] = Number(out[key]);
    if (key in out && Number.isNaN(out[key])) delete out[key];
  }
  return out;
}

// Migration 003 adds the google_maps_url column. Until it is run, strip the
// field and retry so place CRUD keeps working without the link.
function isMissingMapsColumn(error) {
  const msg = String((error && error.message) || '');
  return /google_maps_url/i.test(msg) && /does not exist|schema cache/i.test(msg);
}

async function listPlaces(categoryId) {
  const { data, error } = categoryId
    ? await placeModel.findByCategory(categoryId)
    : await placeModel.findAll();
  if (error) throw httpError(500, `Failed to load places: ${error.message}`);
  return data;
}

async function getPlace(placeId) {
  const { data, error } = await placeModel.findById(placeId);
  if (error) throw httpError(500, `Failed to load place: ${error.message}`);
  if (!data) throw httpError(404, 'Place not found.');
  return data;
}

async function createPlace(fields, adminId) {
  const prepared = preparePlaceFields(fields);
  let result = await placeModel.create({ ...prepared, created_by: adminId || null });
  if (result.error && isMissingMapsColumn(result.error)) {
    const { google_maps_url, ...rest } = prepared; // eslint-disable-line no-unused-vars
    result = await placeModel.create({ ...rest, created_by: adminId || null });
  }
  const { data, error } = result;
  if (error) throw httpError(400, `Failed to create place: ${error.message}`);
  return data;
}

async function updatePlace(placeId, fields) {
  const existing = await getPlace(placeId);
  const prepared = preparePlaceFields(fields);
  let result = await placeModel.update(placeId, { ...prepared, updated_at: new Date().toISOString() });
  if (result.error && isMissingMapsColumn(result.error)) {
    const { google_maps_url, ...rest } = prepared; // eslint-disable-line no-unused-vars
    result = await placeModel.update(placeId, { ...rest, updated_at: new Date().toISOString() });
  }
  const { data, error } = result;
  if (error) throw httpError(400, `Failed to update place: ${error.message}`);
  return data || { ...existing, ...prepared };
}

async function deletePlace(placeId) {
  const place = await getPlace(placeId); // 404 if it does not exist
  const { error } = await placeModel.remove(placeId);
  if (error) throw httpError(400, `Failed to delete place: ${error.message}`);

  // Remove the stored server image so no orphan files are left behind.
  if (place.image_url) {
    try {
      const uploadConfig = require('../utils/uploadConfig');
      uploadConfig.removeStoredImage(place.image_url);
    } catch (err) {
      console.error('[PLACE] Image cleanup failed:', err.message);
    }
  }

  return { place_id: Number(placeId) };
}

module.exports = { listPlaces, getPlace, createPlace, updatePlace, deletePlace };
