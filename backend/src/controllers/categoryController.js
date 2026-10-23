// Category Controller — request/response handling for /api/categories.

const categoryModel = require('../models/categoryModel');

async function getAllCategories(req, res, next) {
  try {
    const { data, error } = await categoryModel.findAll();
    if (error) {
      const err = new Error(`Failed to load categories: ${error.message}`);
      err.status = 500;
      throw err;
    }
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllCategories };
