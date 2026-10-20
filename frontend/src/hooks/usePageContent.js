// usePageContent — loads admin-edited copy for a public page.
// Fields that are missing/empty fall back to `defaults` (the built-in text),
// so the site keeps working before migration 002 is run or if the API is down.

import { useEffect, useState } from 'react';
import { getPageContent } from '../services/contentService';

export default function usePageContent(page, defaults = {}) {
  const [sections, setSections] = useState({});

  useEffect(() => {
    let alive = true;
    getPageContent(page)
      .then((data) => {
        if (alive) setSections(data || {});
      })
      .catch(() => {
        if (alive) setSections({});
      });
    return () => {
      alive = false;
    };
  }, [page]);

  const get = (key) => {
    const value = sections[key];
    return typeof value === 'string' && value.trim() !== '' ? value : defaults[key];
  };

  return { get, sections };
}
