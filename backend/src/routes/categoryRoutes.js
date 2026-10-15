// Category Routes — /api/categories (public, GET only)

const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

router.get('/', categoryController.getAllCategories);

module.exports = router;
