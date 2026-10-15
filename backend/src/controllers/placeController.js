// Place Controller — request/response handling for /api/places.

const placeService = require('../services/placeService');

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

module.exports = { getAllPlaces, getPlaceById, createPlace, updatePlace, deletePlace };
