// useVisitPlan — consumes VisitPlanContext (plan §14.3 Step 15).

import { useVisitPlanContext } from '../context/VisitPlanContext';

export function useVisitPlan() {
  return useVisitPlanContext();
}
