// Place Service — GET list/filter/detail (public) + POST/PUT/DELETE (admin JWT).
// Covers SRS FR-1, FR-2, FR-5, FR-16–FR-18.

import api from './api';

export async function getPlaces(params = {}) {
  const res = await api.get('/places', { params });
  return res.data.data;
}

export async function getPlaceById(id) {
  const res = await api.get(`/places/${id}`);
  return res.data.data;
}

export async function createPlace(place) {
  const res = await api.post('/places', place);
  return res.data.data;
}

export async function updatePlace(id, place) {
  const res = await api.put(`/places/${id}`, place);
  return res.data.data;
}

export async function deletePlace(id) {
  const res = await api.delete(`/places/${id}`);
  return res.data.data;
}
