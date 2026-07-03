const { supabase } = require('../config/supabase');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    // Decode the JWT payload directly — avoids calling supabase.auth.getUser()
    // which mutates the client's internal auth state and causes subsequent DB
    // writes to execute as the "authenticated" role (triggering RLS errors)
    // instead of the service_role that bypasses RLS.
    let payload;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    } catch {
      return res.status(401).json({ error: 'Invalid token format. Please log in again.' });
    }

    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    // Fetch profile via the service-role client — this call is pure DB, no auth mutation
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found.' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
    }

    req.user = profile;
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
