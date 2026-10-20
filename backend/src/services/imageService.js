// Image Service — place photo storage: save to server folder, replace (delete old),
// remove (delete file + clear path), keep places.image_url in sync with the DB (SRS FR-7).

const fs = require('fs');
const path = require('path');
const placeModel = require('../models/placeModel');
const uploadConfig = require('../utils/uploadConfig');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function loadPlace(placeId) {
  const { data, error } = await placeModel.findById(placeId);
  if (error) throw httpError(500, `Failed to load place: ${error.message}`);
  if (!data) throw httpError(404, 'Place not found.');
  return data;
}

// POST /api/places/:id/image — file is already on disk (multer).
async function setPlaceImage(placeId, file) {
  const place = await loadPlace(placeId);
  if (!file) {
    throw httpError(400, 'No image file received. Send the file as form field "image".');
  }

  const savedPath = path.join(uploadConfig.UPLOAD_DIR, path.basename(file.filename));

  // 1. Magic-byte check — declared type must match actual content.
  let head;
  try {
    head = fs.readFileSync(savedPath).subarray(0, 16);
  } catch (err) {
    throw httpError(500, `Could not read uploaded file: ${err.message}`);
  }
  if (!uploadConfig.matchesMagicBytes(head)) {
    fs.unlinkSync(savedPath);
    throw httpError(415, 'The uploaded file is not a real image. Allowed formats: ' + uploadConfig.ALLOWED_LABEL + '.');
  }

  // 2. Quota check after write — remove the file and refuse if it pushed us over 500 MB.
  if (uploadConfig.usedBytes() > uploadConfig.MAX_STORAGE_BYTES) {
    fs.unlinkSync(savedPath);
    throw httpError(507, 'Server storage is full (500 MB limit). Remove an image before uploading.');
  }

  // 3. Replace: delete the previous server-side image (external URLs are left alone).
  uploadConfig.removeStoredImage(place.image_url);

  // 4. Persist the new path in the DB; roll the file back if the update fails.
  const imageUrl = `${uploadConfig.PUBLIC_PREFIX}/${path.basename(savedPath)}`;
  const { data, error } = await placeModel.update(placeId, {
    image_url: imageUrl,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    fs.unlinkSync(savedPath);
    throw httpError(500, `Failed to save image path: ${error.message}`);
  }

  return data || { ...place, image_url: imageUrl };
}

// DELETE /api/places/:id/image — delete the server file and clear the DB path.
async function clearPlaceImage(placeId) {
  const place = await loadPlace(placeId);
  if (!place.image_url) {
    throw httpError(404, 'This place has no image to remove.');
  }

  uploadConfig.removeStoredImage(place.image_url);

  const { data, error } = await placeModel.update(placeId, {
    image_url: null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw httpError(500, `Failed to clear image path: ${error.message}`);

  return data || { ...place, image_url: null };
}

// Place deleted → remove its server image too (no orphan files).
function removeImageForPlace(place) {
  if (place && place.image_url) uploadConfig.removeStoredImage(place.image_url);
}

module.exports = { setPlaceImage, clearPlaceImage, removeImageForPlace };
