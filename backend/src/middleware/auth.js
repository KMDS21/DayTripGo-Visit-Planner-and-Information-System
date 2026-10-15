// JWT Authentication Middleware
// Verifies `Authorization: Bearer <token>` on protected admin routes (SRS FR-15, NFR-6).

const { verifyToken } = require('../utils/tokenUtils');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    req.admin = verifyToken(token); // { admin_id, username }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };
