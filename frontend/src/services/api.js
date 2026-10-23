// Axios instance for the DayTripGO REST API (plan §14.3 Step 13).
// Dev: Vite proxies /api → http://localhost:5000 (vite.config.js).
// Admin JWT from localStorage is attached to every request when present.
// `ownerApi` is the business-owner twin: same base URL, its own token, so an
// owner session can never accidentally attach an admin JWT (and vice versa).

import axios from 'axios';

export const ADMIN_TOKEN_KEY = 'daytripgo_token';
export const OWNER_TOKEN_KEY = 'daytripgo_owner_token';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ownerApi = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

ownerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(OWNER_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise axios errors to a friendly message for the UI (NFR-9).
export function errorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
}

export { ownerApi };
export default api;
