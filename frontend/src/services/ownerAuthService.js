// Owner Auth Service — business owner registration, login and profile.
// Talks to /api/owner/auth through `ownerApi`, which carries the owner JWT.

import { ownerApi } from './api';

// Step 1 of the flow: → { token, owner }. The listing itself (business name,
// tags, photos) is saved afterwards, in step 2, against this owner.
export async function register(details) {
  const res = await ownerApi.post('/owner/auth/register', details);
  return res.data.data;
}

// → { token, owner }
export async function login(credentials) {
  const res = await ownerApi.post('/owner/auth/login', credentials);
  return res.data.data;
}

export async function logout() {
  const res = await ownerApi.post('/owner/auth/logout');
  return res.data.data;
}

export async function getProfile() {
  const res = await ownerApi.get('/owner/auth/me');
  return res.data.data;
}

export async function updateProfile(patch) {
  const res = await ownerApi.put('/owner/auth/me', patch);
  return res.data.data;
}

// payload: { current_password, new_password }
export async function changePassword(payload) {
  const res = await ownerApi.put('/owner/auth/password', payload);
  return res.data.data;
}
