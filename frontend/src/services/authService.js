// Auth Service — administrator login/logout (SRS FR-14, NFR-5).

import api from './api';

export async function login(credentials) {
  const res = await api.post('/auth/login', credentials);
  return res.data.data; // { token, admin }
}

export async function logout() {
  const res = await api.post('/auth/logout');
  return res.data.data;
}
