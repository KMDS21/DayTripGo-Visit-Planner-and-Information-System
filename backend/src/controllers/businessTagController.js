// Business Tag Controller — request/response handling for /api/business-tags.

const businessTagService = require('../services/businessCategoryService');

async function getAllTags(req, res, next) {
  try {
    const tags = await businessTagService.listTags();
    res.json({ success: true, count: tags.length, data: tags });
  } catch (err) {
    next(err);
  }
}

async function createTag(req, res, next) {
  try {
    const { category_name } = req.body || {};
    const tag = await businessTagService.createTag(category_name);
    res.status(201).json({ success: true, data: tag });
  } catch (err) {
    next(err);
  }
}

async function updateTag(req, res, next) {
  try {
    const { category_name } = req.body || {};
    const tag = await businessTagService.updateTag(req.params.id, category_name);
    res.json({ success: true, data: tag });
  } catch (err) {
    next(err);
  }
}

async function deleteTag(req, res, next) {
  try {
    const result = await businessTagService.deleteTag(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllTags, createTag, updateTag, deleteTag };
