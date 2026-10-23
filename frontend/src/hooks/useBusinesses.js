// useBusinesses — fetches the public business listings and the admin-managed
// tag list, and applies the active tag filter (one tag at a time, cleared by
// passing null — the same contract as usePlaces' category filter).

import { useCallback, useEffect, useState } from 'react';
import { getBusinesses, getBusinessTags } from '../services/businessService';
import { errorMessage } from '../services/api';

export function useBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null); // null = all
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBusinessTags()
      .then(setTags)
      .catch(() => setTags([])); // the filter degrades gracefully
  }, []);

  const fetchBusinesses = useCallback(async (tag) => {
    setLoading(true);
    setError(null);
    try {
      const params = tag ? { tag } : {};
      setBusinesses(await getBusinesses(params));
    } catch (err) {
      setError(errorMessage(err));
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses(activeTag);
  }, [activeTag, fetchBusinesses]);

  return {
    businesses,
    tags,
    activeTag,
    loading,
    error,
    selectTag: setActiveTag, // pass null to clear the filter
    refresh: () => fetchBusinesses(activeTag),
  };
}
