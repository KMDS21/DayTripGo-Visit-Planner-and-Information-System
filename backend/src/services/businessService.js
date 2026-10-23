// Business Service — business logic for owner listings: listing, filtering,
// ownership-scoped CRUD and the admin approval switch.

const businessModel = require('../models/businessModel');
const businessCategoryModel = require('../models/businessCategoryModel');
const businessOwnerModel = require('../models/businessOwnerModel');
const { createTtlCache } = require('../utils/ttlCache');

// Same rationale as placeService: the public list is a fixed ~320 ms hosted
// round-trip per request, so it is cached for 60 s and cleared on every write.
// Admin/owner views always read fresh.
const publicListCache = createTtlCache({ ttlMs: 60 * 1000 });

// Columns an owner may write. owner_id / published / business_id are server
// controlled — stripping them here means a crafted body cannot escalate.
const WRITABLE_FIELDS = [
  'name',
  'short_description',
  'description',
  'owner_name',
  'opening_hours',
  'phone',
  'email',
  'address',
  'website_url',
  'google_maps_url',
  'image_url',
];

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function prepareBusinessFields(fields) {
  const out = {};
  for (const key of WRITABLE_FIELDS) {
    if (fields[key] === undefined) continue;
    const value = fields[key];
    // Empty optional columns are stored as NULL, not ''.
    out[key] = typeof value === 'string' ? value.trim() || null : value;
  }
  return out;
}

function normaliseTags(tags) {
  return [...new Set((tags || []).map(Number).filter(Boolean))].sort((a, b) => a - b);
}

// Rows read with `select('*')` come back without a tags array; one extra
// query fills them all in rather than one query per listing.
async function attachTags(rows) {
  const list = rows || [];
  const missing = list.filter((r) => r.tags === undefined).map((r) => r.business_id);

  if (missing.length > 0) {
    const { data, error } = await businessModel.findTagsFor(missing);
    if (!error) {
      const byBusiness = new Map();
      for (const link of data || []) {
        const bucket = byBusiness.get(link.business_id) || [];
        bucket.push(link.category_id);
        byBusiness.set(link.business_id, bucket);
      }
      for (const row of list) {
        if (row.tags === undefined) row.tags = byBusiness.get(row.business_id) || [];
      }
    }
  }

  for (const row of list) if (row.tags === undefined) row.tags = [];
  list.forEach((row) => { row.tags = normaliseTags(row.tags); });
  return list;
}

// The home carousel shows a listing's feature card cover when the owner set
// one (business_photos.is_featured), falling back to the Explore card cover.
// One query for the whole page; a missing table (migration 010 not run yet)
// just leaves the rows to fall back to image_url.
async function attachFeaturedCovers(rows) {
  const list = rows || [];
  if (list.length === 0) return list;

  try {
    const photoModel = require('../models/businessPhotoModel');
    const { data, error } = await photoModel.findFeaturedFor(list.map((r) => r.business_id));
    if (error) {
      if (/business_photos/i.test(error.message || '')) {
        console.warn('[BUSINESS] Feature covers skipped:', error.message);
      } else {
        console.warn('[BUSINESS] Feature cover lookup failed:', error.message);
      }
      return list;
    }
    const byBusiness = new Map((data || []).map((row) => [row.business_id, row.photo_url]));
    for (const row of list) {
      const cover = byBusiness.get(row.business_id);
      if (cover) row.featured_image_url = cover;
    }
  } catch (err) {
    console.warn('[BUSINESS] Feature cover lookup failed:', err.message);
  }
  return list;
}

// Admin view: show who owns each listing without an N+1 lookup.
async function attachOwnerNames(rows) {
  const list = rows || [];
  if (list.length === 0) return list;
  const { data: owners, error } = await businessOwnerModel.findAllPublic();
  if (error || !owners) return list;
  const byId = new Map(owners.map((o) => [o.owner_id, o]));
  for (const row of list) {
    const owner = byId.get(row.owner_id);
    row.owner_name = owner ? owner.full_name : null;
    row.owner_email = owner ? owner.email : null;
  }
  return list;
}

function invalidatePublicListCache() {
  publicListCache.clear();
}

// Photo files outlive their row unless they are removed with it — the FK
// cascade only deletes the `business_photos` rows. URLs are collected before
// the delete and the stored files removed afterwards (the cover is usually
// one of the gallery rows, hence the Set).
async function collectPhotoUrls(businessId) {
  try {
    const photoService = require('./businessPhotoService');
    return await photoService.listStoredUrls(businessId);
  } catch (err) {
    console.error('[BUSINESS] Photo cleanup lookup failed:', err.message);
    return [];
  }
}

function removeListingFiles(imageUrl, photoUrls = []) {
  try {
    const uploadConfig = require('../utils/uploadConfig');
    for (const url of new Set([imageUrl, ...(photoUrls || [])].filter(Boolean))) {
      uploadConfig.removeStoredImage(url);
    }
  } catch (err) {
    console.error('[BUSINESS] Image cleanup failed:', err.message);
  }
}

// ── Reads ─────────────────────────────────────────────────────────────────
async function listBusinesses({ tagId, includeUnpublished = false, ownerId, withOwner = false } = {}) {
  if (ownerId) {
    const { data, error } = await businessModel.findByOwner(ownerId, { includeUnpublished: true });
    if (error) throw httpError(500, `Failed to load your businesses: ${error.message}`);
    return await attachFeaturedCovers(await attachTags(data));
  }

  const cacheable = !includeUnpublished;
  const cacheKey = `businesses:public:${tagId || 'all'}`;
  if (cacheable) {
    const hit = publicListCache.get(cacheKey);
    if (hit) return hit;
  }

  let result = tagId
    ? await businessModel.findByTag(tagId, { includeUnpublished })
    : await businessModel.findAll({ includeUnpublished });

  // A missing join or column (migration not run) falls back to the plain list
  // so the page still renders rather than erroring.
  if (result.error && tagId) {
    result = await businessModel.findAll({ includeUnpublished });
  }
  if (result.error) throw httpError(500, `Failed to load businesses: ${result.error.message}`);

  const rows = await attachFeaturedCovers(await attachTags(result.data || []));
  if (withOwner) await attachOwnerNames(rows);

  if (cacheable) publicListCache.set(cacheKey, rows);
  return rows;
}

async function getBusiness(businessId, { ownerId, includeUnpublished = false } = {}) {
  const { data, error } = ownerId
    ? await businessModel.findByIdForOwner(businessId, ownerId)
    : await businessModel.findById(businessId);

  if (error) throw httpError(500, `Failed to load business: ${error.message}`);
  if (!data) throw httpError(404, 'Business not found.');
  // Public detail must never leak a listing awaiting approval.
  if (!ownerId && !includeUnpublished && !data.published) throw httpError(404, 'Business not found.');

  const [row] = await attachFeaturedCovers(await attachTags([data]));
  return row;
}

// ── Writes (owner) ────────────────────────────────────────────────────────
async function assertTagsExist(tagIds) {
  const ids = normaliseTags(tagIds);
  if (ids.length === 0) return ids;

  const { data, error } = await businessCategoryModel.findAll();
  // Table unreadable → let the FK constraint be the safety net.
  if (error || !data || data.length === 0) return ids;

  const known = new Set(data.map((c) => c.category_id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw httpError(400, `Unknown tag id(s): ${unknown.join(', ')}. Choose tags from the tag list.`);
  }
  return ids;
}

async function createBusiness(fields, ownerId, tagIds) {
  if (!ownerId) throw httpError(401, 'Owner authentication required.');

  const prepared = prepareBusinessFields(fields);
  if (!prepared.name) throw httpError(400, 'Missing or empty required field(s): name.');
  if (!prepared.description) throw httpError(400, 'Missing or empty required field(s): description.');

  const tags = await assertTagsExist(tagIds);

  // New listings always start pending — an admin approves them (published=false).
  const { data, error } = await businessModel.create({
    ...prepared,
    owner_id: Number(ownerId),
    published: false,
  });
  if (error) throw httpError(400, `Failed to create business: ${error.message}`);

  if (tags.length > 0) {
    const tagResult = await businessModel.replaceTags(data.business_id, tags);
    if (tagResult.error) {
      console.warn('[businesses] Tag attach failed:', tagResult.error.message);
    }
  }

  invalidatePublicListCache();
  return await getBusiness(data.business_id, { ownerId });
}

async function updateBusiness(businessId, fields, ownerId, tagIds) {
  if (!ownerId) throw httpError(401, 'Owner authentication required.');

  const prepared = prepareBusinessFields(fields);
  if ('name' in prepared && !prepared.name) throw httpError(400, 'name cannot be empty.');
  if ('description' in prepared && !prepared.description) {
    throw httpError(400, 'description cannot be empty.');
  }

  // Confirm the listing belongs to this owner BEFORE writing anything.
  const existing = await getBusiness(businessId, { ownerId });

  const tags = tagIds === undefined ? null : await assertTagsExist(tagIds);

  if (Object.keys(prepared).length > 0) {
    const { data, error } = await businessModel.updateForOwner(businessId, ownerId, {
      ...prepared,
      updated_at: new Date().toISOString(),
    });
    if (error) throw httpError(400, `Failed to update business: ${error.message}`);
    if (!data) throw httpError(404, 'Business not found.');
  }

  if (tags) {
    const tagResult = await businessModel.replaceTags(businessId, tags);
    if (tagResult.error) {
      throw httpError(400, `Failed to update tags: ${tagResult.error.message}`);
    }
  }

  invalidatePublicListCache();
  return await getBusiness(businessId, { ownerId });
}

async function deleteBusiness(businessId, ownerId) {
  if (!ownerId) throw httpError(401, 'Owner authentication required.');

  // Scoped delete — returns nothing when the row is not this owner's.
  const photoUrls = await collectPhotoUrls(businessId);
  const { data, error } = await businessModel.removeForOwner(businessId, ownerId);
  if (error) throw httpError(400, `Failed to delete business: ${error.message}`);
  if (!data) throw httpError(404, 'Business not found.');

  invalidatePublicListCache();
  removeListingFiles(data.image_url, photoUrls);

  return { business_id: Number(businessId) };
}

async function adminDeleteBusiness(businessId) {
  const photoUrls = await collectPhotoUrls(businessId);
  const { data, error } = await businessModel.remove(businessId);
  if (error) throw httpError(400, `Failed to delete business: ${error.message}`);
  if (!data) throw httpError(404, 'Business not found.');

  invalidatePublicListCache();
  removeListingFiles(data.image_url, photoUrls);

  return { business_id: Number(businessId) };
}

// ── Approval switch (admin) ───────────────────────────────────────────────
async function setBusinessPublished(businessId, published) {
  const { data, error } = await businessModel.update(businessId, {
    published: Boolean(published),
    updated_at: new Date().toISOString(),
  });
  if (error) throw httpError(400, `Failed to update approval state: ${error.message}`);
  if (!data) throw httpError(404, 'Business not found.');

  invalidatePublicListCache();
  const [row] = await attachTags([data]);
  return row;
}

// The photo gallery itself lives in businessPhotoService — it owns the files,
// the Explore card cover mirror and the 10-photo limit.
module.exports = {
  listBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  adminDeleteBusiness,
  setBusinessPublished,
  invalidatePublicListCache,
};
