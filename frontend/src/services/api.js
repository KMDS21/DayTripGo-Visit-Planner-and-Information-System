// Axios instance for the DayTripGO REST API (plan §14.3 Step 13).
// Dev: Vite proxies /api → http://localhost:5000 (vite.config.js).
// Admin JWT from localStorage is attached to every request when present.

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('daytripgo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise axios errors to a friendly message for the UI (NFR-9).
export function errorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
}

export default api;
