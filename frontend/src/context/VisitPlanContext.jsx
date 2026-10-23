// VisitPlanContext — session-based one-day visit plan (SRS FR-10–FR-13, NFR-7).
// The plan lives on the server; its id is kept in sessionStorage so a new browser
// session starts a fresh plan (no tourist account / no PII).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as visitPlanService from '../services/visitPlanService';
import { errorMessage } from '../services/api';

const VisitPlanContext = createContext(null);

const PLAN_ID_KEY = 'daytripgo_plan_id';
const SESSION_KEY = 'daytripgo_session_id';

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function VisitPlanProvider({ children }) {
  const [planId, setPlanId] = useState(() => sessionStorage.getItem(PLAN_ID_KEY));
  const [items, setItems] = useState([]); // [{ place_id, place }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const syncing = useRef(false);

  // Load an existing plan on mount (FR-12 consolidated view).
  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    setLoading(true);
    visitPlanService
      .getPlan(planId)
      .then((plan) => {
        if (cancelled) return;
        const loaded = (plan.visit_plan_items || [])
          .filter((it) => it.place)
          .map((it) => ({ place_id: it.place_id, place: it.place }));
        setItems(loaded);
      })
      .catch(() => {
        // Stale/invalid plan id — start fresh next time.
        sessionStorage.removeItem(PLAN_ID_KEY);
        setPlanId(null);
        setItems([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist ordered items to the server (FR-10/11/13 add, remove, reorder).
  const persist = useCallback(
    async (nextItems) => {
      if (!planId) return;
      if (syncing.current) return;
      syncing.current = true;
      try {
        await visitPlanService.updatePlan(
          planId,
          nextItems.map((it, i) => ({ place_id: it.place_id, visit_order: i }))
        );
        setError(null);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        syncing.current = false;
      }
    },
    [planId]
  );

  const addPlace = useCallback(
    async (place) => {
      const exists = items.some((it) => it.place_id === place.place_id);
      if (exists) return false;
      let id = planId;
      if (!id) {
        const plan = await visitPlanService.createPlan(getSessionId());
        id = plan.plan_id;
        sessionStorage.setItem(PLAN_ID_KEY, String(id));
        setPlanId(id);
      }
      const next = [...items, { place_id: place.place_id, place }];
      setItems(next);
      await persist(next);
      return true;
    },
    [items, planId, persist]
  );

  const removePlace = useCallback(
    async (placeId) => {
      const next = items.filter((it) => it.place_id !== placeId);
      setItems(next);
      await persist(next);
    },
    [items, persist]
  );

  // Reorder (FR-13): move item at `from` to index `to`.
  const moveItem = useCallback(
    async (from, to) => {
      if (to < 0 || to >= items.length || from === to) return;
      const next = items.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setItems(next);
      await persist(next);
    },
    [items, persist]
  );

  const clearPlan = useCallback(async () => {
    setItems([]);
    await persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({
      planId,
      items,
      loading,
      error,
      count: items.length,
      addPlace,
      removePlace,
      moveItem,
      clearPlan,
      hasPlace: (placeId) => items.some((it) => it.place_id === placeId),
    }),
    [planId, items, loading, error, addPlace, removePlace, moveItem, clearPlan]
  );

  return <VisitPlanContext.Provider value={value}>{children}</VisitPlanContext.Provider>;
}

export function useVisitPlanContext() {
  const ctx = useContext(VisitPlanContext);
  if (!ctx) throw new Error('useVisitPlanContext must be used within <VisitPlanProvider>');
  return ctx;
}
