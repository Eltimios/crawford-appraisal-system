const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { stripPasswordHash } = require('../utils/sanitizeUser');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please log in again.' });
      }
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    const profile = await db('users').where({ id: payload.sub }).first();

    if (!profile) {
      return res.status(401).json({ error: 'User profile not found.' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
    }

    req.user = stripPasswordHash(profile);
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required roles: ${allowedRoles.join(', ')}` });
  }
  next();
};

const requireCategory = (...allowedCategories) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
  if (!allowedCategories.includes(req.user.staff_category)) {
    return res.status(403).json({ error: `Access denied. Required categories: ${allowedCategories.join(', ')}` });
  }
  next();
};

// Backwards-compat alias
const verifyToken = authenticate;
const requireRole = authorize;

module.exports = { authenticate, authorize, requireCategory, verifyToken, requireRole };
