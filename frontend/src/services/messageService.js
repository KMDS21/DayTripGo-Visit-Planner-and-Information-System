// Message Service — Contact us responses (POST public, admin routes need JWT).

import api from './api';

export async function submitMessage(body) {
  const res = await api.post('/messages', body);
  return res.data.data;
}

export async function getMessages() {
  const res = await api.get('/messages');
  return res.data.data;
}

export async function markMessageRead(id) {
  const res = await api.patch(`/messages/${id}/read`);
  return res.data.data;
}

export async function deleteMessage(id) {
  const res = await api.delete(`/messages/${id}`);
  return res.data.data;
}
