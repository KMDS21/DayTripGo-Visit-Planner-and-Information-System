// JWT Authentication Middleware
// Verifies `Authorization: Bearer <token>` on protected routes (SRS FR-15, NFR-6).
// Two roles share one secret but carry disjoint claims, so each guard rejects
// the other role's token outright:
//   admin → { admin_id, username }   ·   business owner → { owner_id, username }

const { verifyToken } = require('../utils/tokenUtils');

function readToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  // An owner JWT must never unlock admin routes.
  if (payload.admin_id === undefined || payload.admin_id === null) {
    return res.status(401).json({ success: false, message: 'Administrator authentication required.' });
  }

  req.admin = payload; // { admin_id, username }
  next();
}

// Business owner guard — same contract, other role.
function requireOwner(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  if (payload.owner_id === undefined || payload.owner_id === null) {
    return res.status(401).json({ success: false, message: 'Business owner authentication required.' });
  }

  req.owner = payload; // { owner_id, username }
  next();
}

module.exports = { requireAuth, requireOwner };
