// Upload Config — server-side image storage rules for place photos.
// Formats: jpg / jpeg / png / webp / avif · 5 MB per file · 500 MB total quota.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'places');
// Parent folder mounted at /uploads so /uploads/places/<file> resolves correctly.
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const PUBLIC_PREFIX = '/uploads/places'; // stored in places.image_url
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per file
const MAX_STORAGE_BYTES = 500 * 1024 * 1024; // 500 MB server quota (NFR storage limit)

// mime type -> allowed extensions
const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
};

const ALLOWED_LABEL = 'JPG, JPEG, PNG, WEBP or AVIF';

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function extForMime(mime) {
  return (ALLOWED_TYPES[mime] || [])[0] || '';
}

function isAllowedType(mime) {
  return Boolean(ALLOWED_TYPES[mime]);
}

function randomFilename(mime) {
  return `${crypto.randomUUID()}${extForMime(mime)}`;
}

// Total bytes stored under the uploads folder (recursive).
function usedBytes() {
  ensureUploadDir();
  let total = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else total += fs.statSync(full).size;
    }
  };
  walk(UPLOAD_DIR);
  return total;
}

function freeBytes() {
  return Math.max(0, MAX_STORAGE_BYTES - usedBytes());
}

// Magic-byte sniffing — the declared mime must match the actual file content.
function matchesMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return true;
  }
  // WEBP: "RIFF" .... "WEBP"
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true;
  // AVIF/HEIC-family: .... "ftyp" brand starts with avif/avis
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    return brand === 'avif' || brand === 'avis';
  }
  return false;
}

// Delete a stored upload by its public path — ignores external URLs.
function removeStoredImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  if (!imageUrl.startsWith(`${PUBLIC_PREFIX}/`)) return false;
  const name = path.basename(imageUrl);
  const full = path.join(UPLOAD_DIR, name);
  try {
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
      return true;
    }
  } catch (err) {
    console.error('[UPLOAD] Failed to remove file:', err.message);
  }
  return false;
}

module.exports = {
  UPLOAD_DIR,
  UPLOADS_ROOT,
  PUBLIC_PREFIX,
  MAX_FILE_BYTES,
  MAX_STORAGE_BYTES,
  ALLOWED_TYPES,
  ALLOWED_LABEL,
  ensureUploadDir,
  isAllowedType,
  extForMime,
  randomFilename,
  usedBytes,
  freeBytes,
  matchesMagicBytes,
  removeStoredImage,
};
