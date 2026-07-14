const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { stripPasswordHash } = require('../utils/sanitizeUser');

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Staff ID / Email and password are required.' });

    let email = identifier.trim();
    if (!email.includes('@')) {
      // Not an email — treat as Staff ID and resolve to the account's email.
      const staffRecord = await db('users').select('email').whereRaw('staff_id ILIKE ?', [email]).first();
      if (!staffRecord) return res.status(401).json({ error: 'Invalid Staff ID/Email or password.' });
      email = staffRecord.email;
    }

    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ error: 'Invalid Staff ID/Email or password.' });

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid Staff ID/Email or password.' });

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        staff_category: user.staff_category,
        department: user.department,
        college: user.college,
        current_rank: user.current_rank,
        staff_id: user.staff_id,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

const logout = async (_req, res) => {
  res.json({ message: 'Logged out successfully.' });
};

const getProfile = async (req, res) => {
  try {
    res.json({ user: stripPasswordHash(req.user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, highest_qualification } = req.body;
    if (!full_name?.trim()) return res.status(400).json({ error: 'Full name is required.' });
    const updates = { full_name: full_name.trim() };
    if (highest_qualification !== undefined) updates.highest_qualification = highest_qualification;
    await db('users').where({ id: req.user.id }).update(updates);
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    const password_hash = await bcrypt.hash(new_password, 10);
    await db('users').where({ id: req.user.id }).update({ password_hash });
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    // NOTE: this previously relied on Supabase's hosted reset-password email,
    // which had no corresponding frontend page to complete the flow anyway.
    // Kept as a stub with the same response shape — always generic, so the
    // endpoint doesn't leak which emails are registered — pending a follow-up
    // pass to wire up real delivery (nodemailer) and a reset-password page.
    res.json({ message: 'If an account with that email exists, password reset instructions will be sent.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

module.exports = { login, logout, getProfile, updateProfile, updatePassword, resetPassword };
