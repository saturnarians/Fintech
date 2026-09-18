import axios from 'axios';

/**
 * ============================================================================
 * LEARNING NOTE: AXIOS HTTP API CLIENT (DRIVEN ADAPTER)
 * ============================================================================
 * Centralized Axios client connecting Next.js frontend to NestJS backend API.
 * Automatically attaches Authorization: Bearer <jwt> for protected routes.
 */

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer Token into requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('phc_jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor to parse API error messages cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error.message) ||
      'An unexpected network error occurred.';
    return Promise.reject(new Error(message));
  },
);
