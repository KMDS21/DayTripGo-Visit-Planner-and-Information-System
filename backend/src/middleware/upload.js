// Upload Middleware — multer instance + storage quota gate for place images.

const multer = require('multer');
const uploadConfig = require('../utils/uploadConfig');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    uploadConfig.ensureUploadDir();
    cb(null, uploadConfig.UPLOAD_DIR);
  },
  filename(req, file, cb) {
    cb(null, uploadConfig.randomFilename(file.mimetype));
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: uploadConfig.MAX_FILE_BYTES, files: 1 },
  fileFilter(req, file, cb) {
    if (!uploadConfig.isAllowedType(file.mimetype)) {
      const err = new Error(
        `Unsupported image format. Allowed formats: ${uploadConfig.ALLOWED_LABEL}.`
      );
      err.status = 415;
      return cb(err);
    }
    cb(null, true);
  },
});

// Reject before writing when the 500 MB server quota is already used up.
function quotaGate(req, res, next) {
  if (uploadConfig.freeBytes() <= 0) {
    return res.status(507).json({
      success: false,
      message: 'Server storage is full (500 MB limit). Remove an image before uploading.',
    });
  }
  next();
}

module.exports = { uploader, quotaGate };
