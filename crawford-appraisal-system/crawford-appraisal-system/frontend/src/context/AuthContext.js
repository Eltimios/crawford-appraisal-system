import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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

    if (!supabase) {
      // No Supabase client — restore from stored backend token if present
      if (storedToken) {
        setToken(storedToken);
        fetchProfile(storedToken).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setUser(session.user);
          setToken(session.access_token);
          localStorage.setItem('token', session.access_token);
          await fetchProfile(session.access_token);
        } else {
          // No Supabase session — check for a backend-issued token (our login flow)
          const backendToken = localStorage.getItem('token');
          if (backendToken) {
            setToken(backendToken);
            await fetchProfile(backendToken);
          } else {
            setUser(null);
            setProfile(null);
            setToken(null);
          }
        }
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
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
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Build a backwards-compatible userProfile shape that existing pages expect
  const compatProfile = profile
    ? { ...profile, displayName: profile.full_name, email: user?.email || profile.email }
    : null;

  const refreshProfile = async () => {
    const t = token || localStorage.getItem('token');
    if (t) await fetchProfile(t);
  };

  const value = {
    // v2 shape
    user,
    profile,
    token,
    loading,
    login,
    logout,
    refreshProfile,
    // Backwards-compat aliases for existing pages
    currentUser: user,
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
