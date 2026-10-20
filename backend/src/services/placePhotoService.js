// Place Photo Service — multiple photos per place (max 10) with one primary
// "card photo". The primary photo's path stays in sync with places.image_url,
// so every public page (cards, carousel, detail, covers) keeps working
// unchanged while the gallery owns the file lifecycle (SRS FR-7).

const fs = require('fs');
const path = require('path');
const placeModel = require('../models/placeModel');
const placePhotoModel = require('../models/placePhotoModel');
const uploadConfig = require('../utils/uploadConfig');

const MAX_PHOTOS_PER_PLACE = 10;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isMissingPhotosTable(error) {
  const msg = String((error && error.message) || '');
  return /place_photos/i.test(msg) && /does not exist|schema cache/i.test(msg);
}

const MIGRATION_HINT =
  'Photo gallery is not available yet — run database/schema/004_place_photos.sql in the Supabase SQL editor.';

function safeUnlink(fullPath) {
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (err) {
    console.error('[PHOTO] Failed to remove file:', err.message);
  }
}

async function loadPlace(placeId) {
  const { data, error } = await placeModel.findById(placeId);
  if (error) throw httpError(500, `Failed to load place: ${error.message}`);
  if (!data) throw httpError(404, 'Place not found.');
  return data;
}

async function listPhotos(placeId) {
  await loadPlace(placeId);
  const { data, error } = await placePhotoModel.findByPlace(placeId);
  if (error) {
    if (isMissingPhotosTable(error)) return []; // migration 004 not run yet
    throw httpError(500, `Failed to load photos: ${error.message}`);
  }
  return data || [];
}

// Refresh the card photo (places.image_url) so it always points at the
// current primary row — or null when the gallery is empty.
async function syncCardPhoto(placeId, photos) {
  const next = (photos || []).find((photo) => photo.is_primary) || photos[0] || null;
  if (next && !next.is_primary) {
    const { error: flagErr } = await placePhotoModel.update(next.photo_id, {
      is_primary: true,
      updated_at: new Date().toISOString(),
    });
    if (flagErr) throw httpError(500, `Failed to set card photo: ${flagErr.message}`);
  }
  const { error } = await placeModel.update(placeId, {
    image_url: next ? next.photo_url : null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw httpError(500, `Failed to sync card photo: ${error.message}`);
}

// POST /api/places/:id/photos — multer has already written the file (field "photo").
async function addPhoto(placeId, file) {
  await loadPlace(placeId); // 404 if the place does not exist
  if (!file) {
    throw httpError(400, 'No image file received. Send the file as form field "photo".');
  }

  const savedPath = path.join(uploadConfig.UPLOAD_DIR, path.basename(file.filename));
  const savedUrl = `${uploadConfig.PUBLIC_PREFIX}/${path.basename(file.filename)}`;

  // 0. Per-place limit — 10 photos max (reject before any checks, free the file).
  const { count, error: countErr } = await placePhotoModel.countByPlace(placeId);
  if (countErr) {
    safeUnlink(savedPath);
    if (isMissingPhotosTable(countErr)) throw httpError(503, MIGRATION_HINT);
    throw httpError(500, `Failed to count photos: ${countErr.message}`);
  }
  if (Number(count || 0) >= MAX_PHOTOS_PER_PLACE) {
    safeUnlink(savedPath);
    throw httpError(400, `A place can have at most ${MAX_PHOTOS_PER_PLACE} photos. Remove one first.`);
  }

  // 1. Magic-byte check — declared type must match actual content.
  let head;
  try {
    head = fs.readFileSync(savedPath).subarray(0, 16);
  } catch (err) {
    throw httpError(500, `Could not read uploaded file: ${err.message}`);
  }
  if (!uploadConfig.matchesMagicBytes(head)) {
    safeUnlink(savedPath);
    throw httpError(415, 'The uploaded file is not a real image. Allowed formats: ' + uploadConfig.ALLOWED_LABEL + '.');
  }

  // 2. Quota check after write — remove the file and refuse if it pushed us over 500 MB.
  if (uploadConfig.usedBytes() > uploadConfig.MAX_STORAGE_BYTES) {
    safeUnlink(savedPath);
    throw httpError(507, 'Server storage is full (500 MB limit). Remove an image before uploading.');
  }

  // 3. Persist the row; the FIRST photo of a place becomes the card photo.
  const isFirst = Number(count || 0) === 0;
  const { data: row, error } = await placePhotoModel.create({
    place_id: Number(placeId),
    photo_url: savedUrl,
    is_primary: isFirst,
  });
  if (error) {
    safeUnlink(savedPath);
    if (isMissingPhotosTable(error)) throw httpError(503, MIGRATION_HINT);
    throw httpError(500, `Failed to save photo: ${error.message}`);
  }

  if (isFirst) {
    const { error: syncErr } = await placeModel.update(placeId, {
      image_url: savedUrl,
      updated_at: new Date().toISOString(),
    });
    if (syncErr) {
      // Roll the row and file back so nothing is left half-saved.
      await placePhotoModel.remove(row.photo_id);
      safeUnlink(savedPath);
      throw httpError(500, `Failed to set card photo: ${syncErr.message}`);
    }
  }

  return { place: await loadPlace(placeId), photos: await listPhotos(placeId) };
}

// DELETE /api/places/:id/photos/:photoId — delete the server file + row and
// promote another photo when the removed one was the card photo.
async function removePhoto(placeId, photoId) {
  const place = await loadPlace(placeId);
  const { data: photo, error } = await placePhotoModel.findById(photoId);
  if (error) throw httpError(500, `Failed to load photo: ${error.message}`);
  if (!photo || Number(photo.place_id) !== Number(placeId)) throw httpError(404, 'Photo not found.');

  const { error: delErr } = await placePhotoModel.remove(photoId);
  if (delErr) throw httpError(500, `Failed to remove photo: ${delErr.message}`);
  uploadConfig.removeStoredImage(photo.photo_url); // external URLs are ignored

  // The card photo may have just been deleted — promote the next one.
  if (photo.is_primary || place.image_url === photo.photo_url) {
    const { data: remaining, error: restErr } = await placePhotoModel.findByPlace(placeId);
    if (restErr) throw httpError(500, `Failed to refresh photos: ${restErr.message}`);
    await syncCardPhoto(placeId, remaining || []);
  }

  return { place: await loadPlace(placeId), photos: await listPhotos(placeId) };
}

// POST /api/places/:id/photos/:photoId/primary — choose the card photo.
async function setPrimaryPhoto(placeId, photoId) {
  const place = await loadPlace(placeId);
  const { data: photo, error } = await placePhotoModel.findById(photoId);
  if (error) throw httpError(500, `Failed to load photo: ${error.message}`);
  if (!photo || Number(photo.place_id) !== Number(placeId)) throw httpError(404, 'Photo not found.');
  if (photo.is_primary && place.image_url === photo.photo_url) {
    return { place, photos: await listPhotos(placeId) }; // already the card photo
  }

  const { data: all, error: allErr } = await placePhotoModel.findByPlace(placeId);
  if (allErr) throw httpError(500, `Failed to load photos: ${allErr.message}`);
  for (const row of all || []) {
    if (row.is_primary && row.photo_id !== photo.photo_id) {
      const { error: clearErr } = await placePhotoModel.update(row.photo_id, {
        is_primary: false,
        updated_at: new Date().toISOString(),
      });
      if (clearErr) throw httpError(500, `Failed to update photos: ${clearErr.message}`);
    }
  }

  const { error: updErr } = await placePhotoModel.update(photoId, {
    is_primary: true,
    updated_at: new Date().toISOString(),
  });
  if (updErr) throw httpError(500, `Failed to set card photo: ${updErr.message}`);

  const { error: syncErr } = await placeModel.update(placeId, {
    image_url: photo.photo_url,
    updated_at: new Date().toISOString(),
  });
  if (syncErr) throw httpError(500, `Failed to sync card photo: ${syncErr.message}`);

  return { place: await loadPlace(placeId), photos: await listPhotos(placeId) };
}

module.exports = { MAX_PHOTOS_PER_PLACE, listPhotos, addPhoto, removePhoto, setPrimaryPhoto };
