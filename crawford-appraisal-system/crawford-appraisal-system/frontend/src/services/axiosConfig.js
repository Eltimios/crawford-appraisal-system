import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
