import axios from 'axios';
import { buildAppHref, resolveApiBaseUrl } from '../utils/runtimeConfig';

// Create axios instance with default config
const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const skipAuth = Boolean(config?.skipAuth);
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token && !skipAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const skipAuthRedirect = Boolean(error?.config?.skipAuthRedirect);
    if (!error.response) {
      console.error('Network error: backend may be unavailable at API base URL', API.defaults.baseURL);
    } else if (error.response?.status === 401 && !skipAuthRedirect) {
      // Token expired or unauthorized
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = buildAppHref('/login');
    } else if (error.response?.status === 403) {
      console.error('Access forbidden:', error.message);
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
