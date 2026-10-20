// Place Routes — /api/places
// GET list & detail are public; POST/PUT/DELETE require admin JWT (SRS FR-15, NFR-6).
// POST /:id/image (replace/create) and DELETE /:id/image manage the server-side photo.

const express = require('express');
const placeController = require('../controllers/placeController');
const { requireAuth } = require('../middleware/auth');
const { validatePlace } = require('../middleware/validate');
const { uploader, quotaGate } = require('../middleware/upload');

const router = express.Router();

router.get('/', placeController.getAllPlaces);
router.get('/:id', placeController.getPlaceById);

router.post('/', requireAuth, validatePlace, placeController.createPlace);
router.put('/:id', requireAuth, validatePlace, placeController.updatePlace);
router.delete('/:id', requireAuth, placeController.deletePlace);

// Image management — multipart field name: "image"
router.post('/:id/image', requireAuth, quotaGate, uploader.single('image'), placeController.uploadImage);
router.delete('/:id/image', requireAuth, placeController.removeImage);

module.exports = router;
