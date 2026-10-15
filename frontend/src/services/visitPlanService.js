// Visit Plan Service — session-based one-day plan (SRS FR-10–FR-13, NFR-7).
// POST create · GET view · PUT replace ordered items.

import api from './api';

export async function createPlan(sessionId) {
  const res = await api.post('/visit-plans', { session_id: sessionId });
  return res.data.data;
}

export async function getPlan(planId) {
  const res = await api.get(`/visit-plans/${planId}`);
  return res.data.data;
}

export async function updatePlan(planId, items) {
  const res = await api.put(`/visit-plans/${planId}`, { items });
  return res.data.data;
}
