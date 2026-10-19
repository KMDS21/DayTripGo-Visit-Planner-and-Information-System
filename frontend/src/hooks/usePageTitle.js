// usePageTitle — sets the browser tab title for the current page.
// Usage: usePageTitle('Explore')  →  "DayTripGO | Explore"

import { useEffect } from 'react';

const BRAND = 'DayTripGO';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${BRAND} | ${title}` : `${BRAND} — Tour Visit Planner`;
  }, [title]);
}
