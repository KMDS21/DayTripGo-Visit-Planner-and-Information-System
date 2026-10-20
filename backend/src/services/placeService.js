// Place Service — business logic for place listing, filtering and CRUD (SRS FR-1…FR-9, FR-16…FR-19).

const placeModel = require('../models/placeModel');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
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
  const { data, error } = await placeModel.create({ ...fields, created_by: adminId || null });
  if (error) throw httpError(400, `Failed to create place: ${error.message}`);
  return data;
}

async function updatePlace(placeId, fields) {
  const existing = await getPlace(placeId);
  const { data, error } = await placeModel.update(placeId, { ...fields, updated_at: new Date().toISOString() });
  if (error) throw httpError(400, `Failed to update place: ${error.message}`);
  return data || { ...existing, ...fields };
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
