// Business Controller — request/response handling for /api/businesses.

const businessService = require('../services/businessService');
const businessPhotoService = require('../services/businessPhotoService');

// scope=owner → the signed-in owner's own listings (incl. unpublished)
// scope=admin → every listing, for moderation (admin JWT checked in the route)
// default     → public list: published only.
async function getAllBusinesses(req, res, next) {
  try {
    const scope = req.query.scope;
    const rows = await businessService.listBusinesses({
      tagId: req.query.tag ? Number(req.query.tag) : null,
      includeUnpublished: scope === 'admin' || scope === 'owner',
      ownerId: scope === 'owner' ? req.owner.owner_id : null,
      withOwner: scope === 'admin',
    });
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getBusinessById(req, res, next) {
  try {
    // ?scope=owner lets an owner preview their own pending listing.
    const ownerId = req.query.scope === 'owner' ? req.owner.owner_id : null;
    const business = await businessService.getBusiness(req.params.id, { ownerId });
    res.json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
}

async function createBusiness(req, res, next) {
  try {
    const { tags, ...fields } = req.body || {};
    const business = await businessService.createBusiness(
      fields,
      req.owner.owner_id,
      tags
    );
    res.status(201).json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
}

async function updateBusiness(req, res, next) {
  try {
    const { tags, ...fields } = req.body || {};
    const business = await businessService.updateBusiness(
      req.params.id,
      fields,
      req.owner.owner_id,
      tags
    );
    res.json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
}

async function deleteBusiness(req, res, next) {
  try {
    const result = await businessService.deleteBusiness(req.params.id, req.owner.owner_id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function adminDeleteBusiness(req, res, next) {
  try {
    const result = await businessService.adminDeleteBusiness(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ── Photo gallery (owner JWT) ─────────────────────────────────────────────
// GET ?scope=owner lets an owner load their own pending listing's photos.
async function getPhotos(req, res, next) {
  try {
    const ownerId = req.query.scope === 'owner' && req.owner ? req.owner.owner_id : null;
    const photos = await businessPhotoService.listPhotos(req.params.id, { ownerId });
    res.json({ success: true, count: photos.length, data: photos });
  } catch (err) {
    next(err);
  }
}

// POST /:id/photos — multipart field "photo" + optional text field "role"
// ("explore" | "featured" | "gallery").
async function uploadPhoto(req, res, next) {
  try {
    const result = await businessPhotoService.addPhoto(
      req.params.id,
      req.owner.owner_id,
      req.file,
      (req.body && req.body.role) || 'gallery'
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// PUT /:id/photos/:photoId/role — { role: 'explore' | 'featured' | 'gallery' }.
async function setPhotoRole(req, res, next) {
  try {
    const result = await businessPhotoService.setPhotoRole(
      req.params.id,
      req.params.photoId,
      req.owner.owner_id,
      (req.body && req.body.role) || 'gallery'
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// DELETE /:id/photos/:photoId — removes the file and the row.
async function removePhoto(req, res, next) {
  try {
    const result = await businessPhotoService.removePhoto(
      req.params.id,
      req.params.photoId,
      req.owner.owner_id
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// PUT /:id/publish — { published: true | false } (admin approval).
async function setBusinessPublished(req, res, next) {
  try {
    const { published } = req.body || {};
    if (typeof published !== 'boolean') {
      return res.status(400).json({ success: false, message: 'published must be true or false.' });
    }
    const business = await businessService.setBusinessPublished(req.params.id, published);
    res.json({ success: true, data: business });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  adminDeleteBusiness,
  getPhotos,
  uploadPhoto,
  setPhotoRole,
  removePhoto,
  setBusinessPublished,
};
