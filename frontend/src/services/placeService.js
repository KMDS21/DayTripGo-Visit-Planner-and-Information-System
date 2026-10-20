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

// Publish switch — hides/shows the place on the public site (admin JWT).
export async function setPlacePublished(id, published) {
  const res = await api.put(`/places/${id}/publish`, { published });
  return res.data.data;
}

export async function deletePlace(id) {
  const res = await api.delete(`/places/${id}`);
  return res.data.data;
}

// Photo gallery — up to 10 photos per place; one is chosen as the card photo.
// Files live in the server folder; the chosen photo's path is kept in image_url.
export async function getPlacePhotos(id) {
  const res = await api.get(`/places/${id}/photos`);
  return res.data.data;
}

// Upload returns { place, photos } — place.image_url reflects the card photo.
export async function uploadPlacePhoto(id, file) {
  const formData = new FormData();
  formData.append('photo', file);
  const res = await api.post(`/places/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function removePlacePhoto(id, photoId) {
  const res = await api.delete(`/places/${id}/photos/${photoId}`);
  return res.data.data;
}

export async function setPlacePrimaryPhoto(id, photoId) {
  const res = await api.post(`/places/${id}/photos/${photoId}/primary`);
  return res.data.data;
}
