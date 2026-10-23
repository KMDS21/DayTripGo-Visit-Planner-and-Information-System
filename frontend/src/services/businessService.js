// Business Service — public listings, owner CRUD and admin moderation.

import api, { ownerApi } from './api';

// ── Public ────────────────────────────────────────────────────────────────
// params: { tag } — filter by one business tag (null/undefined = all).
export async function getBusinesses(params = {}) {
  const res = await api.get('/businesses', { params });
  return res.data.data;
}

export async function getBusinessTags() {
  const res = await api.get('/business-tags');
  return res.data.data;
}

// ── Owner (owner JWT) ─────────────────────────────────────────────────────
export async function getMyBusinesses() {
  const res = await ownerApi.get('/businesses', { params: { scope: 'owner' } });
  return res.data.data;
}

export async function getMyBusiness(id) {
  const res = await ownerApi.get(`/businesses/${id}`, { params: { scope: 'owner' } });
  return res.data.data;
}

// The owner's own gallery, pending listings included (used by the form).
export async function getMyBusinessPhotos(id) {
  const res = await ownerApi.get(`/businesses/${id}/photos`, { params: { scope: 'owner' } });
  return res.data.data;
}

export async function createBusiness(payload) {
  const res = await ownerApi.post('/businesses', payload);
  return res.data.data;
}

export async function updateBusiness(id, payload) {
  const res = await ownerApi.put(`/businesses/${id}`, payload);
  return res.data.data;
}

export async function deleteBusiness(id) {
  const res = await ownerApi.delete(`/businesses/${id}`);
  return res.data.data;
}

// multipart — field name "photo"; returns { business, photos }.
// role: 'explore' (card cover) | 'featured' (feature cover) | 'gallery'.
export async function uploadBusinessPhoto(id, file, role = 'gallery') {
  const form = new FormData();
  form.append('photo', file);
  form.append('role', role);
  const res = await ownerApi.post(`/businesses/${id}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

// Move a saved photo between the three slots; returns { business, photos }.
export async function setBusinessPhotoRole(id, photoId, role) {
  const res = await ownerApi.put(`/businesses/${id}/photos/${photoId}/role`, { role });
  return res.data.data;
}

export async function deleteBusinessPhoto(id, photoId) {
  const res = await ownerApi.delete(`/businesses/${id}/photos/${photoId}`);
  return res.data.data;
}

// Public gallery — approved listings only, so the preview modal can show the
// "more photos" strip without an owner token.
export async function getBusinessPhotos(id) {
  const res = await api.get(`/businesses/${id}/photos`);
  return res.data.data;
}

// ── Admin (admin JWT) ─────────────────────────────────────────────────────
export async function getBusinessesForAdmin() {
  const res = await api.get('/businesses', { params: { scope: 'admin' } });
  return res.data.data;
}

// published: true → approve, false → unpublish.
export async function setBusinessPublished(id, published) {
  const res = await api.put(`/businesses/${id}/publish`, { published });
  return res.data.data;
}

export async function deleteBusinessAsAdmin(id) {
  const res = await api.delete(`/businesses/admin/${id}`);
  return res.data.data;
}

// ── Tags ──────────────────────────────────────────────────────────────────
export async function createBusinessTag(category_name) {
  const res = await api.post('/business-tags', { category_name });
  return res.data.data;
}

export async function updateBusinessTag(id, category_name) {
  const res = await api.put(`/business-tags/${id}`, { category_name });
  return res.data.data;
}

export async function deleteBusinessTag(id) {
  const res = await api.delete(`/business-tags/${id}`);
  return res.data.data;
}
