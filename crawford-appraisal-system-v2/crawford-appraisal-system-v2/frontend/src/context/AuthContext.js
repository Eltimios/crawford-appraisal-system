import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import axios from 'axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          setToken(session.access_token);
          localStorage.setItem('token', session.access_token);
          await fetchProfile(session.access_token);
        } else {
          setUser(null);
          setProfile(null);
          setToken(null);
          localStorage.removeItem('token');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (accessToken) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/profile`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setProfile(response.data.user);
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
      { email, password }
    );
    const { token: accessToken, user: userProfile } = response.data;
    setToken(accessToken);
    setProfile(userProfile);
    localStorage.setItem('token', accessToken);
    return userProfile;
  };

  const logout = async () => {
    await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Axios interceptor for attaching token to all requests
  axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;
  axios.interceptors.request.use((config) => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  });

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
