import axios from 'axios';

// Base URL for restaurant API
// In development: uses Vite proxy at /api/v1
// In production: direct API URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token and business ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kaha_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('kaha_token');
      localStorage.removeItem('kaha_user');
      localStorage.removeItem('kaha_refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
