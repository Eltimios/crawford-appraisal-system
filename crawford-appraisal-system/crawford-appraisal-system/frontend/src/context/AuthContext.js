import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const fetchProfile = async (accessToken) => {
    try {
      const res = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setProfile(res.data.user);
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const res = await axios.post('/api/auth/login', { identifier, password });
    const { token: accessToken, user: userProfile } = res.data;
    setToken(accessToken);
    setProfile(userProfile);
    localStorage.setItem('token', accessToken);
    return userProfile;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch { /* ignore */ }
    setProfile(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Build a backwards-compatible userProfile shape that existing pages expect
  const compatProfile = profile
    ? { ...profile, displayName: profile.full_name }
    : null;

  const refreshProfile = async () => {
    const t = token || localStorage.getItem('token');
    if (t) await fetchProfile(t);
  };

  const value = {
    profile,
    token,
    loading,
    login,
    logout,
    refreshProfile,
    // Backwards-compat aliases for existing pages
    userProfile: compatProfile,
    userRole: profile?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
