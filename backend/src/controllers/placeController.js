// Place Controller — request/response handling for /api/places.

const placeService = require('../services/placeService');
const imageService = require('../services/imageService');

async function getAllPlaces(req, res, next) {
  try {
    const places = await placeService.listPlaces(req.query.category);
    res.json({ success: true, count: places.length, data: places });
  } catch (err) {
    next(err);
  }
}

async function getPlaceById(req, res, next) {
  try {
    const place = await placeService.getPlace(req.params.id);
    res.json({ success: true, data: place });
  } catch (err) {
    next(err);
  }
}

async function createPlace(req, res, next) {
  try {
    const place = await placeService.createPlace(req.body, req.admin && req.admin.admin_id);
    res.status(201).json({ success: true, data: place });
  } catch (err) {
    next(err);
  }
}

async function updatePlace(req, res, next) {
  try {
    const place = await placeService.updatePlace(req.params.id, req.body);
    res.json({ success: true, data: place });
  } catch (err) {
    next(err);
  }
}

async function deletePlace(req, res, next) {
  try {
    const result = await placeService.deletePlace(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/places/:id/image — save to server folder, delete old file, update DB path.
async function uploadImage(req, res, next) {
  try {
    const place = await imageService.setPlaceImage(req.params.id, req.file);
    res.json({ success: true, data: place });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/places/:id/image — delete the server file and clear the DB path.
async function removeImage(req, res, next) {
  try {
    const place = await imageService.clearPlaceImage(req.params.id);
    res.json({ success: true, data: place });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  uploadImage,
  removeImage,
};
