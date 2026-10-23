// Business Photo Service — up to 10 photos per listing, owned by the person
// who created the listing (unlike place photos, which are admin-only).
// One row is the Explore card cover (is_primary, mirrored into
// businesses.image_url so every public card keeps working) and one row is the
// feature card cover (is_featured). Behaviour mirrors placePhotoService so the
// two galleries are interchangeable to reason about.

const fs = require('fs');
const path = require('path');
const businessModel = require('../models/businessModel');
const businessPhotoModel = require('../models/businessPhotoModel');
const uploadConfig = require('../utils/uploadConfig');

const MAX_PHOTOS_PER_BUSINESS = 10;
const ROLES = ['explore', 'featured', 'gallery'];

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isMissingPhotosTable(error) {
  const msg = String((error && error.message) || '');
  return /business_photos/i.test(msg) && /does not exist|schema cache/i.test(msg);
}

const MIGRATION_HINT =
  'Photo gallery is not available yet — run database/schema/010_business_photos.sql in the Supabase SQL editor.';

function safeUnlink(fullPath) {
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (err) {
    console.error('[BUSINESS PHOTO] Failed to remove file:', err.message);
  }
}


// Photo edits change the card image the public list serves from cache.
function invalidatePublicListCache() {
  try {
    require('./businessService').invalidatePublicListCache();
  } catch {
    // Not loaded yet — nothing is cached.
  }
}

// The listing must be THIS owner's (404, never 403 — codebase convention).
async function loadOwned(businessId, ownerId) {
  if (!ownerId) throw httpError(401, 'Owner authentication required.');
  const { data, error } = await businessModel.findByIdForOwner(businessId, ownerId);
  if (error) throw httpError(500, `Failed to load business: ${error.message}`);
  if (!data) throw httpError(404, 'Business not found.');
  return data;
}

// Public read is limited to approved listings.
async function loadPublic(businessId) {
  const { data, error } = await businessModel.findById(businessId);
  if (error) throw httpError(500, `Failed to load business: ${error.message}`);
  if (!data || !data.published) throw httpError(404, 'Business not found.');
  return data;
}

async function rawPhotos(businessId) {
  const { data, error } = await businessPhotoModel.findByBusiness(businessId);
  if (error) {
    if (isMissingPhotosTable(error)) return [];
    throw httpError(500, `Failed to load photos: ${error.message}`);
  }
  return data || [];
}

async function listPhotos(businessId, { ownerId = null } = {}) {
  if (ownerId) await loadOwned(businessId, ownerId);
  else await loadPublic(businessId);
  return rawPhotos(businessId);
}

// Keep businesses.image_url pointing at the flagged Explore cover (or null
// when the gallery is empty) so cards, previews and admin rows stay in sync.
async function syncCardPhoto(businessId, photos) {
  const next = (photos || []).find((photo) => photo.is_primary) || null;
  const { error } = await businessModel.update(businessId, {
    image_url: next ? next.photo_url : null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw httpError(500, `Failed to sync the card cover: ${error.message}`);
}

// Clear a flag on every other row of the same listing (best-effort).
async function clearFlag(photos, photoId, field) {
  for (const row of photos || []) {
    if (row.photo_id === photoId || !row[field]) continue;
    const { error } = await businessPhotoModel.update(row.photo_id, {
      [field]: false,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn(`[BUSINESS PHOTO] Could not clear ${field}:`, error.message);
  }
}

function normaliseRole(role) {
  const value = String(role || '').toLowerCase();
  return ROLES.includes(value) ? value : 'gallery';
}

// POST /api/businesses/:id/photos — multipart field "photo" (owner JWT).
// `role` decides what the new file is for: "explore" makes it the card cover,
// "feature" the feature cover, anything else a gallery photo.
async function addPhoto(businessId, ownerId, file, role) {
  await loadOwned(businessId, ownerId); // ownership before the file is adopted
  if (!file) {
    throw httpError(400, 'No image file received. Send the file as form field "photo".');
  }
  const wantedRole = normaliseRole(role);

  const savedPath = path.join(uploadConfig.UPLOAD_DIR, path.basename(file.filename));
  const savedUrl = `${uploadConfig.PUBLIC_PREFIX}/${path.basename(file.filename)}`;
  const dropFile = () => safeUnlink(savedPath);

  // 1. Per-listing limit — reject before doing any real work, free the file.
  const { count, error: countErr } = await businessPhotoModel.countByBusiness(businessId);
  if (countErr) {
    dropFile();
    if (isMissingPhotosTable(countErr)) throw httpError(503, MIGRATION_HINT);
    throw httpError(500, `Failed to count photos: ${countErr.message}`);
  }
  if (Number(count || 0) >= MAX_PHOTOS_PER_BUSINESS) {
    dropFile();
    throw httpError(400, `A listing can have at most ${MAX_PHOTOS_PER_BUSINESS} photos. Remove one first.`);
  }

  // 2. Magic-byte check — the declared type must match the actual content.
  let head;
  try {
    head = fs.readFileSync(savedPath).subarray(0, 16);
  } catch (err) {
    dropFile();
    throw httpError(500, `Could not read uploaded file: ${err.message}`);
  }
  if (!uploadConfig.matchesMagicBytes(head)) {
    dropFile();
    throw httpError(415, `The uploaded file is not a real image. Allowed formats: ${uploadConfig.ALLOWED_LABEL}.`);
  }

  // 3. Quota check after write — free the file if it pushed us over 500 MB.
  if (uploadConfig.usedBytes() > uploadConfig.MAX_STORAGE_BYTES) {
    dropFile();
    throw httpError(507, 'Server storage is full (500 MB limit). Remove an image before uploading.');
  }

  const existing = await rawPhotos(businessId);
  // The first photo of a listing always becomes the Explore card cover.
  const makePrimary = wantedRole === 'explore' || !existing.some((photo) => photo.is_primary);

  const { data: row, error } = await businessPhotoModel.create({
    business_id: Number(businessId),
    photo_url: savedUrl,
    is_primary: makePrimary,
    is_featured: wantedRole === 'featured',
  });
  if (error) {
    dropFile();
    if (isMissingPhotosTable(error)) throw httpError(503, MIGRATION_HINT);
    throw httpError(500, `Failed to save photo: ${error.message}`);
  }

  if (makePrimary) {
    const { error: syncErr } = await businessModel.update(businessId, {
      image_url: savedUrl,
      updated_at: new Date().toISOString(),
    });
    if (syncErr) {
      // Roll the row and file back so nothing is left half-saved.
      await businessPhotoModel.remove(row.photo_id);
      dropFile();
      throw httpError(500, `Failed to set the Explore cover: ${syncErr.message}`);
    }
    await clearFlag(existing, row.photo_id, 'is_primary');
  }
  if (wantedRole === 'featured') await clearFlag(existing, row.photo_id, 'is_featured');

  invalidatePublicListCache();
  return { business: await loadOwned(businessId, ownerId), photos: await rawPhotos(businessId) };
}

// PUT /api/businesses/:id/photos/:photoId/role — reassign a saved photo.
async function setPhotoRole(businessId, photoId, ownerId, role) {
  await loadOwned(businessId, ownerId);
  const wantedRole = normaliseRole(role);

  const { data: photo, error } = await businessPhotoModel.findById(photoId);
  if (error) throw httpError(500, `Failed to load photo: ${error.message}`);
  if (!photo || Number(photo.business_id) !== Number(businessId)) throw httpError(404, 'Photo not found.');

  const all = await rawPhotos(businessId);

  if (wantedRole === 'explore') {
    if (!photo.is_primary) {
      const { error: updErr } = await businessPhotoModel.update(photoId, {
        is_primary: true,
        updated_at: new Date().toISOString(),
      });
      if (updErr) throw httpError(500, `Failed to set the Explore cover: ${updErr.message}`);
      await clearFlag(all, photoId, 'is_primary');
      const { error: syncErr } = await businessModel.update(businessId, {
        image_url: photo.photo_url,
        updated_at: new Date().toISOString(),
      });
      if (syncErr) throw httpError(500, `Failed to sync the card cover: ${syncErr.message}`);
      invalidatePublicListCache();
    }
  } else if (wantedRole === 'featured') {
    if (!photo.is_featured) {
      const { error: updErr } = await businessPhotoModel.update(photoId, {
        is_featured: true,
        updated_at: new Date().toISOString(),
      });
      if (updErr) throw httpError(500, `Failed to set the feature cover: ${updErr.message}`);
      await clearFlag(all, photoId, 'is_featured');
      invalidatePublicListCache();
    }
  } else {
    // Gallery photo: hand the Explore cover to another photo if this one holds
    // it (a listing with photos always shows one of them on the card).
    const others = all.filter((row) => Number(row.photo_id) !== Number(photoId));
    const patch = {};
    if (photo.is_featured) patch.is_featured = false;
    if (photo.is_primary) {
      const nextPrimary = others[0];
      if (nextPrimary) {
        patch.is_primary = false;
        const { error: promoteErr } = await businessPhotoModel.update(nextPrimary.photo_id, {
          is_primary: true,
          updated_at: new Date().toISOString(),
        });
        if (promoteErr) throw httpError(500, `Failed to set the Explore cover: ${promoteErr.message}`);
        const { error: syncErr } = await businessModel.update(businessId, {
          image_url: nextPrimary.photo_url,
          updated_at: new Date().toISOString(),
        });
        if (syncErr) throw httpError(500, `Failed to sync the card cover: ${syncErr.message}`);
      } else {
        delete patch.is_primary; // only photo — it stays the cover
      }
    }
    if (Object.keys(patch).length > 0) {
      const { error: updErr } = await businessPhotoModel.update(photoId, {
        ...patch,
        updated_at: new Date().toISOString(),
      });
      if (updErr) throw httpError(500, `Failed to update photo: ${updErr.message}`);
      if ('is_primary' in patch) invalidatePublicListCache();
    }
  }

  return { business: await loadOwned(businessId, ownerId), photos: await rawPhotos(businessId) };
}

// DELETE /api/businesses/:id/photos/:photoId — file + row (owner JWT).
async function removePhoto(businessId, photoId, ownerId) {
  await loadOwned(businessId, ownerId);

  const { data: photo, error } = await businessPhotoModel.findById(photoId);
  if (error) throw httpError(500, `Failed to load photo: ${error.message}`);
  if (!photo || Number(photo.business_id) !== Number(businessId)) throw httpError(404, 'Photo not found.');

  const { error: delErr } = await businessPhotoModel.remove(photoId);
  if (delErr) throw httpError(500, `Failed to remove photo: ${delErr.message}`);
  uploadConfig.removeStoredImage(photo.photo_url); // external URLs are ignored

  // The Explore cover may have just been deleted — promote the next one.
  if (photo.is_primary) {
    const remaining = await rawPhotos(businessId);
    await syncCardPhoto(businessId, remaining);
    invalidatePublicListCache();
  }

  return { business: await loadOwned(businessId, ownerId), photos: await rawPhotos(businessId) };
}

async function listStoredUrls(businessId) {
  try {
    const { data, error } = await businessPhotoModel.findByBusiness(businessId);
    if (error || !data) return [];
    return data.map((row) => row.photo_url);
  } catch {
    return [];
  }
}

module.exports = {
  MAX_PHOTOS_PER_BUSINESS,
  ROLES,
  listPhotos,
  addPhoto,
  setPhotoRole,
  removePhoto,
  listStoredUrls,
};
