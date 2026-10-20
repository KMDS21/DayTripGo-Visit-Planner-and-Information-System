// Message Service — Contact us form handling (public submit, admin inbox).

const messageModel = require('../models/messageModel');

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MAX_MESSAGE = 5000;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function rethrow(error) {
  const msg = String(error.message || '');
  if (error.code === '42P01' || /does not exist|could not find the table/i.test(msg)) {
    throw httpError(
      503,
      'Contact storage is not set up yet — run database/schema/002_contact_content.sql in the Supabase SQL editor.'
    );
  }
  throw httpError(500, `Contact request failed: ${msg}`);
}

function clean(value, max = 255) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function submitMessage(body) {
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const message = clean(body.message, MAX_MESSAGE);

  if (!name || !email || !message) {
    throw httpError(400, 'Name, email and message are required.');
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw httpError(400, 'Please enter a valid email address.');
  }

  const fields = {
    name,
    email,
    message,
    phone: clean(body.phone, 40) || null,
    country: clean(body.country, 80) || null,
    city: clean(body.city, 80) || null,
    subject: clean(body.subject, 150) || 'General enquiry',
    status: 'new',
  };

  try {
    const { data, error } = await messageModel.create(fields);
    if (error) return rethrow(error);
    return data;
  } catch (err) {
    if (err.status) throw err;
    return rethrow(err);
  }
}

async function listMessages() {
  try {
    const { data, error } = await messageModel.findAll();
    if (error) return rethrow(error);
    return data;
  } catch (err) {
    if (err.status) throw err;
    return rethrow(err);
  }
}

async function markRead(messageId) {
  try {
    const { data, error } = await messageModel.markRead(messageId);
    if (error) return rethrow(error);
    if (!data) throw httpError(404, 'Message not found.');
    return data;
  } catch (err) {
    if (err.status) throw err;
    return rethrow(err);
  }
}

async function deleteMessage(messageId) {
  const { data: existing, error: findError } = await messageModel.findById(messageId);
  if (findError) return rethrow(findError);
  if (!existing) throw httpError(404, 'Message not found.');

  const { error } = await messageModel.remove(messageId);
  if (error) return rethrow(error);
  return { message_id: Number(messageId) };
}

module.exports = { submitMessage, listMessages, markRead, deleteMessage };
