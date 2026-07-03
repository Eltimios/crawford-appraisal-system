const { supabase, supabaseAuth } = require('../config/supabase');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    // Use supabaseAuth (isolated client) so the session is NOT set on the
    // service-role supabase client — that would make all subsequent DB calls
    // run as the user role and trigger RLS violations.
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid email or password.' });

    // Profile fetch via the service-role client (RLS-bypassed, always clean)
    const { data: profile, error: profileError } = await supabase
      .from('users').select('*').eq('id', data.user.id).single();
    if (profileError) return res.status(500).json({ error: 'Failed to fetch user profile.' });

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        staff_category: profile.staff_category,
        department: profile.department,
        college: profile.college,
        current_rank: profile.current_rank,
        staff_id: profile.staff_id,
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
    res.json({ user: req.user });
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
    const { error } = await supabase.from('users').update(updates).eq('id', req.user.id);
    if (error) throw error;
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
    // Use admin API — no user session needed, service role handles it
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password: new_password });
    if (error) throw error;
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });
    if (error) throw error;
    res.json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to send reset email.' });
  }
};

module.exports = { login, logout, getProfile, updateProfile, updatePassword, resetPassword };
