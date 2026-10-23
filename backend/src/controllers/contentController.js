// Content Controller — public read + admin write for per-page copy.

const contentService = require('../services/contentService');

async function getContent(req, res, next) {
  try {
    const sections = await contentService.getPage(req.params.page);
    res.json({ success: true, data: { page: req.params.page, sections } });
  } catch (err) {
    next(err);
  }
}

async function updateContent(req, res, next) {
  try {
    const sections = await contentService.updatePage(req.params.page, (req.body || {}).sections);
    res.json({ success: true, data: { page: req.params.page, sections } });
  } catch (err) {
    next(err);
  }
}

async function uploadCover(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }
    const publicUrl = `/uploads/places/${req.file.filename}`;
    res.json({ success: true, data: { url: publicUrl } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getContent, updateContent, uploadCover };
