// Place Routes — /api/places
// GET list, detail & photos are public; POST/PUT/DELETE, the publish switch
// and photo management require admin JWT (SRS FR-15, NFR-6).
// GET ?scope=admin returns unpublished places too and is JWT-guarded.
// Photos: POST /:id/photos (multipart "photo") · POST /:id/photos/:photoId/primary
// (choose the card photo) · DELETE /:id/photos/:photoId.

const express = require('express');
const placeController = require('../controllers/placeController');
const placePhotoController = require('../controllers/placePhotoController');
const { requireAuth } = require('../middleware/auth');
const { validatePlace } = require('../middleware/validate');
const { uploader, quotaGate } = require('../middleware/upload');

const router = express.Router();

// The admin list (scope=admin) shows unpublished places — only with a JWT.
const adminScope = (req, res, next) => (req.query.scope === 'admin' ? requireAuth(req, res, next) : next());

router.get('/', adminScope, placeController.getAllPlaces);
router.get('/:id', placeController.getPlaceById);

router.post('/', requireAuth, validatePlace, placeController.createPlace);
router.put('/:id', requireAuth, validatePlace, placeController.updatePlace);
router.put('/:id/publish', requireAuth, placeController.setPlacePublished);
router.delete('/:id', requireAuth, placeController.deletePlace);

// Photo gallery — up to 10 photos per place, one flagged as the card photo.
router.get('/:id/photos', placePhotoController.getPhotos);
router.post('/:id/photos', requireAuth, quotaGate, uploader.single('photo'), placePhotoController.uploadPhoto);
router.post('/:id/photos/:photoId/primary', requireAuth, placePhotoController.setPrimaryPhoto);
router.delete('/:id/photos/:photoId', requireAuth, placePhotoController.removePhoto);

module.exports = router;
