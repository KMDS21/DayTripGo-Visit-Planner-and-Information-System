// Business Routes — /api/businesses
// GET list/detail/photos are public (published only); ?scope=owner adds the
// signed-in owner's own listings (incl. pending), ?scope=admin adds every
// listing for moderation. All writes: owner JWT, scoped to their own rows;
// approval + admin delete stay behind the admin JWT.
// Photos: POST /:id/photos (multipart "photo" + optional "role") ·
// PUT /:id/photos/:photoId/role · DELETE /:id/photos/:photoId.

const express = require('express');
const businessController = require('../controllers/businessController');
const { requireAuth, requireOwner } = require('../middleware/auth');
const { validateBusiness } = require('../middleware/validate');
const { uploader, quotaGate } = require('../middleware/upload');

const router = express.Router();

// ?scope picks which token (if any) the request must carry.
function scopeGuard(req, res, next) {
  if (req.query.scope === 'admin') return requireAuth(req, res, next);
  if (req.query.scope === 'owner') return requireOwner(req, res, next);
  return next();
}

// Detail + gallery: public for approved listings, ?scope=owner for your own.
function detailGuard(req, res, next) {
  if (req.query.scope === 'owner') return requireOwner(req, res, next);
  return next();
}

router.get('/', scopeGuard, businessController.getAllBusinesses);
router.get('/:id', detailGuard, businessController.getBusinessById);

// Admin moderation — registered before the owner routes for clarity.
router.put('/:id/publish', requireAuth, businessController.setBusinessPublished);
router.delete('/admin/:id', requireAuth, businessController.adminDeleteBusiness);

// Owner CRUD.
router.post('/', requireOwner, validateBusiness, businessController.createBusiness);
router.put('/:id', requireOwner, validateBusiness, businessController.updateBusiness);
router.delete('/:id', requireOwner, businessController.deleteBusiness);

// Photo gallery — up to 10 photos per listing (mirrors /api/places/:id/photos,
// but scoped to the owner who created the listing).
router.get('/:id/photos', detailGuard, businessController.getPhotos);
router.post('/:id/photos', requireOwner, quotaGate, uploader.single('photo'), businessController.uploadPhoto);
router.put('/:id/photos/:photoId/role', requireOwner, businessController.setPhotoRole);
router.delete('/:id/photos/:photoId', requireOwner, businessController.removePhoto);

module.exports = router;
