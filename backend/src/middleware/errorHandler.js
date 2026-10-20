// Central Error Handler — Express 4-argument middleware.
// Any thrown/rejected service error with a `status` is reported with that status.
// Multer upload failures are normalised to friendly messages as well.

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} -`, err.message);

  if (err && err.name === 'MulterError') {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large - the limit is 5 MB per file.'
        : `Upload failed: ${err.message}`;
    return res.status(status).json({ success: false, message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
