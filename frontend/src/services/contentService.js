// Content Service — per-page editable copy (GET public, PUT admin JWT).

import api from './api';

export async function getPageContent(page) {
  const res = await api.get(`/content/${page}`);
  return res.data.data.sections || {};
}

export async function savePageContent(page, sections) {
  const res = await api.put(`/content/${page}`, { sections });
  return res.data.data.sections || {};
}

export async function uploadPageCover(page, file) {
  const formData = new FormData();
  formData.append('cover', file);
  const res = await api.post(`/content/${page}/cover`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url;
}
