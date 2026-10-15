// Place Routes — /api/places
// GET list & detail are public; POST/PUT/DELETE require admin JWT (SRS FR-15, NFR-6).

const express = require('express');
const placeController = require('../controllers/placeController');
const { requireAuth } = require('../middleware/auth');
const { validatePlace } = require('../middleware/validate');

const router = express.Router();

router.get('/', placeController.getAllPlaces);
router.get('/:id', placeController.getPlaceById);
router.post('/', requireAuth, validatePlace, placeController.createPlace);
router.put('/:id', requireAuth, validatePlace, placeController.updatePlace);
router.delete('/:id', requireAuth, placeController.deletePlace);

module.exports = router;
