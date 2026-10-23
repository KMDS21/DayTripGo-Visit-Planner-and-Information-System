// Message Controller — /api/messages handlers.

const messageService = require('../services/messageService');

async function submit(req, res, next) {
  try {
    const message = await messageService.submitMessage(req.body || {});
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const messages = await messageService.listMessages();
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    next(err);
  }
}

async function read(req, res, next) {
  try {
    const message = await messageService.markRead(req.params.id);
    res.json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await messageService.deleteMessage(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, list, read, remove };
