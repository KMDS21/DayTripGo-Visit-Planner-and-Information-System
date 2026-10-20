// usePageTitle — sets the browser tab title for the current page.
// The tab always shows only the company/brand name.
// Usage: usePageTitle('Explore')  →  "DayTripGO"

import { useEffect } from 'react';

const BRAND = 'DayTripGO';

export default function usePageTitle() {
  useEffect(() => {
    document.title = BRAND;
  }, []);
}
