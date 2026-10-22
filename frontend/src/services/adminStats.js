// Admin Stats Service — dashboard counters + storage status bar (admin JWT).

import api from './api';

export async function getStats() {
  const res = await api.get('/admin/stats');
  return res.data.data;
}
