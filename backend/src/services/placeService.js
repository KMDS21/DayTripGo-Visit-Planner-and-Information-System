// Place Service — business logic for place listing, filtering and CRUD (SRS FR-1…FR-9, FR-16…FR-19).

const placeModel = require('../models/placeModel');
const { resolveCoordsFromGoogleMapsUrl } = require('../utils/googleMaps');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Migration 003 replaced the manual latitude/longitude columns with one
// optional Google Maps link. Coordinates are never written any more — strip
// caller-supplied values so CRUD can never fail on the dropped columns.
function preparePlaceFields(fields) {
  const out = { ...fields };
  delete out.latitude;
  delete out.longitude;
  if ('google_maps_url' in out) {
    out.google_maps_url = String(out.google_maps_url || '').trim() || null;
  }
  return out;
}

// Coordinates live only inside the Google Maps link now: derive them at READ
// time so the map embeds and the day-plan route map keep working. Short share
// links (maps.app.goo.gl) are followed server-side once, then cached.
async function withCoords(row) {
  if (!row) return row;
  const coords = row.google_maps_url ? await resolveCoordsFromGoogleMapsUrl(row.google_maps_url) : null;
  const latitude = coords ? coords.lat : row.latitude !== undefined ? Number(row.latitude) : null;
  const longitude = coords ? coords.lng : row.longitude !== undefined ? Number(row.longitude) : null;
  return {
    ...row,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

// Migration 003 adds the google_maps_url column. Until it is run, strip the
// field and retry so place CRUD keeps working without the link.
function isMissingMapsColumn(error) {
  const msg = String((error && error.message) || '');
  return /google_maps_url/i.test(msg) && /does not exist|schema cache/i.test(msg);
}

async function listPlaces(categoryId, options = {}) {
  const { data, error } = categoryId
    ? await placeModel.findByCategory(categoryId, options)
    : await placeModel.findAll(options);
  if (error) throw httpError(500, `Failed to load places: ${error.message}`);
  return await Promise.all((data || []).map(withCoords));
}

// Publish switch — publishes/unpublishes one place on the public site.
async function setPlacePublished(placeId, published) {
  const { data, error } = await placeModel.update(placeId, { published: Boolean(published) });
  if (error) {
    const msg = String(error.message || '');
    if (/published/i.test(msg) && /does not exist|schema cache/i.test(msg)) {
      throw httpError(
        503,
        'Publish switch is not available yet — run database/schema/005_place_published.sql in the Supabase SQL editor.'
      );
    }
    throw httpError(400, `Failed to update publish state: ${error.message}`);
  }
  if (!data) throw httpError(404, 'Place not found.');
  return await withCoords(data);
}

async function getPlace(placeId) {
  const { data, error } = await placeModel.findById(placeId);
  if (error) throw httpError(500, `Failed to load place: ${error.message}`);
  if (!data) throw httpError(404, 'Place not found.');
  return await withCoords(data);
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
  return await withCoords(data);
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
  if (data) return await withCoords(data);
  const merged = { ...existing, ...prepared };
  delete merged.latitude;
  delete merged.longitude;
  return await withCoords(merged);
}

async function deletePlace(placeId) {
  const place = await getPlace(placeId); // 404 if it does not exist

  // Collect every stored file for this place BEFORE the row disappears
  // (its place_photos rows go with it via the FK cascade).
  const stored = new Set();
  if (place.image_url) stored.add(place.image_url);
  try {
    const placePhotoModel = require('../models/placePhotoModel');
    const { data: photos } = await placePhotoModel.findByPlace(placeId);
    (photos || []).forEach((photo) => photo.photo_url && stored.add(photo.photo_url));
  } catch (err) {
    console.error('[PLACE] Photo listing failed during delete:', err.message);
  }

  const { error } = await placeModel.remove(placeId);
  if (error) throw httpError(400, `Failed to delete place: ${error.message}`);

  // Remove the stored server images so no orphan files are left behind.
  try {
    const uploadConfig = require('../utils/uploadConfig');
    stored.forEach((url) => uploadConfig.removeStoredImage(url));
  } catch (err) {
    console.error('[PLACE] Image cleanup failed:', err.message);
  }

  return { place_id: Number(placeId) };
}

module.exports = { listPlaces, getPlace, createPlace, updatePlace, deletePlace, setPlacePublished, withCoords };
