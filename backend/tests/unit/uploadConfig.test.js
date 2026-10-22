// Unit — upload rules: allowed types, magic-byte sniffing, quota maths and
// stored-image removal (SRS photo upload + NFR storage limit).

const fs = require('fs');
const path = require('path');
const {
  UPLOAD_DIR,
  PUBLIC_PREFIX,
  MAX_FILE_BYTES,
  MAX_STORAGE_BYTES,
  ALLOWED_LABEL,
  ensureUploadDir,
  isAllowedType,
  extForMime,
  randomFilename,
  usedBytes,
  freeBytes,
  matchesMagicBytes,
  removeStoredImage,
} = require('../../src/utils/uploadConfig');

describe('uploadConfig — type rules', () => {
  test('accepts the five supported image mimes', () => {
    expect(isAllowedType('image/jpeg')).toBe(true);
    expect(isAllowedType('image/png')).toBe(true);
    expect(isAllowedType('image/webp')).toBe(true);
    expect(isAllowedType('image/avif')).toBe(true);
    expect(isAllowedType('image/gif')).toBe(false);
    expect(isAllowedType('application/pdf')).toBe(false);
    expect(isAllowedType(undefined)).toBe(false);
  });

  test('extForMime maps a mime to its first extension', () => {
    expect(extForMime('image/jpeg')).toBe('.jpg');
    expect(extForMime('image/png')).toBe('.png');
    expect(extForMime('image/gif')).toBe('');
  });

  test('randomFilename is a uuid plus the mime extension', () => {
    const name = randomFilename('image/webp');
    expect(name).toMatch(/^[0-9a-f-]{36}\.webp$/i);
    expect(randomFilename('image/png')).toMatch(/\.png$/);
  });

  test('the human label lists every accepted format', () => {
    expect(ALLOWED_LABEL).toBe('JPG, JPEG, PNG, WEBP or AVIF');
  });
});

describe('uploadConfig — magic-byte sniffing', () => {
  test('detects JPEG, PNG, WEBP and AVIF headers', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
    const avif = Buffer.concat([
      Buffer.alloc(4),
      Buffer.from('ftyp'),
      Buffer.from('avif'),
      Buffer.alloc(4),
    ]);
    expect(matchesMagicBytes(jpeg)).toBe(true);
    expect(matchesMagicBytes(png)).toBe(true);
    expect(matchesMagicBytes(webp)).toBe(true);
    expect(matchesMagicBytes(avif)).toBe(true);
  });

  test('rejects short buffers and non-image content', () => {
    expect(matchesMagicBytes(Buffer.alloc(4))).toBe(false);
    expect(matchesMagicBytes(null)).toBe(false);
    expect(matchesMagicBytes(Buffer.from('%PDF-1.4 something'))).toBe(false);
  });
});

describe('uploadConfig — storage accounting', () => {
  test('ensureUploadDir creates the folder without throwing when present', () => {
    expect(() => ensureUploadDir()).not.toThrow();
    expect(fs.existsSync(UPLOAD_DIR)).toBe(true);
  });

  test('usedBytes and freeBytes add up to the 500 MB quota', () => {
    const used = usedBytes();
    const free = freeBytes();
    expect(used).toBeGreaterThanOrEqual(0);
    expect(free).toBe(Math.max(0, MAX_STORAGE_BYTES - used));
    expect(used + free).toBeLessThanOrEqual(MAX_STORAGE_BYTES);
  });
});

describe('uploadConfig — removeStoredImage', () => {
  const TEMP = 'unit-test-delete-me.jpg';

  afterEach(() => {
    const full = path.join(UPLOAD_DIR, TEMP);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  });

  test('deletes a file that lives under the public uploads prefix', () => {
    ensureUploadDir();
    const full = path.join(UPLOAD_DIR, TEMP);
    fs.writeFileSync(full, Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
    expect(removeStoredImage(`${PUBLIC_PREFIX}/${TEMP}`)).toBe(true);
    expect(fs.existsSync(full)).toBe(false);
  });

  test('ignores external URLs and non-existent files', () => {
    expect(removeStoredImage('https://example.com/photo.jpg')).toBe(false);
    expect(removeStoredImage(`${PUBLIC_PREFIX}/does-not-exist.jpg`)).toBe(false);
    expect(removeStoredImage('')).toBe(false);
    expect(removeStoredImage(null)).toBe(false);
  });
});
