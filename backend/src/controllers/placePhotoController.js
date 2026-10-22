// Place Photo Controller — request/response handling for /api/places/:id/photos.

const placePhotoService = require('../services/placePhotoService');

async function getPhotos(req, res, next) {
  try {
    const photos = await placePhotoService.listPhotos(req.params.id);
    res.json({ success: true, count: photos.length, data: photos });
  } catch (err) {
    next(err);
  }
}

// POST /api/places/:id/photos — multipart field name: "photo" (admin JWT).
async function uploadPhoto(req, res, next) {
  try {
    const result = await placePhotoService.addPhoto(req.params.id, req.file);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/places/:id/photos/:photoId/primary — pick the card photo.
async function setPrimaryPhoto(req, res, next) {
  try {
    const result = await placePhotoService.setPrimaryPhoto(req.params.id, req.params.photoId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/places/:id/photos/:photoId — delete file + row (admin JWT).
async function removePhoto(req, res, next) {
  try {
    const result = await placePhotoService.removePhoto(req.params.id, req.params.photoId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPhotos, uploadPhoto, setPrimaryPhoto, removePhoto };
