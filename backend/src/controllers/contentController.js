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

module.exports = { getContent, updateContent };
