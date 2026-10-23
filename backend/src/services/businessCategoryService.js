// Business Category Service — CRUD for the admin-managed tag list
// (Restaurant, Hotel, Vehicle Rental, …).

const businessCategoryModel = require('../models/businessCategoryModel');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const clean = (value) => String(value === null || value === undefined ? '' : value).trim();

async function listTags() {
  const { data, error } = await businessCategoryModel.findAll();
  if (error) throw httpError(500, `Failed to load tags: ${error.message}`);
  return data || [];
}

async function createTag(name) {
  const value = clean(name);
  if (!value) throw httpError(400, 'category_name is required.');
  if (value.length > 50) throw httpError(400, 'category_name must be 50 characters or fewer.');

  const { data: clash } = await businessCategoryModel.findAll();
  if ((clash || []).some((c) => c.category_name.toLowerCase() === value.toLowerCase())) {
    throw httpError(409, 'That tag already exists.');
  }

  const { data, error } = await businessCategoryModel.create({ category_name: value });
  if (error) {
    if (/duplicate|unique/i.test(String(error.message))) throw httpError(409, 'That tag already exists.');
    throw httpError(400, `Failed to create tag: ${error.message}`);
  }
  return data;
}

async function updateTag(categoryId, name) {
  const value = clean(name);
  if (!value) throw httpError(400, 'category_name is required.');
  if (value.length > 50) throw httpError(400, 'category_name must be 50 characters or fewer.');

  const { data, error } = await businessCategoryModel.update(Number(categoryId), {
    category_name: value,
  });
  if (error) {
    if (/duplicate|unique/i.test(String(error.message))) throw httpError(409, 'That tag already exists.');
    throw httpError(400, `Failed to update tag: ${error.message}`);
  }
  if (!data) throw httpError(404, 'Tag not found.');
  return data;
}

// Deleting a tag cascades: it is removed from every listing that carries it.
async function deleteTag(categoryId) {
  const { data, error } = await businessCategoryModel.findById(Number(categoryId));
  if (error) throw httpError(500, `Failed to load tag: ${error.message}`);
  if (!data) throw httpError(404, 'Tag not found.');

  const { error: delErr } = await businessCategoryModel.remove(Number(categoryId));
  if (delErr) throw httpError(400, `Failed to delete tag: ${delErr.message}`);
  return { category_id: Number(categoryId) };
}

module.exports = { listTags, createTag, updateTag, deleteTag };
