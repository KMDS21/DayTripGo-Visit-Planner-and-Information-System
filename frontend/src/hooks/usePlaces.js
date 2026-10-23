// usePlaces — fetches places, applies the active category filter (plan §14.3 Step 15,
// SRS FR-1 list + FR-2 filter one category at a time + FR-3 clear filter).

import { useCallback, useEffect, useState } from 'react';
import { getPlaces } from '../services/placeService';
import { getCategories } from '../services/categoryService';
import { errorMessage } from '../services/api';

export function usePlaces() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // null = all (FR-3)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([])); // filter degrades gracefully
  }, []);

  const fetchPlaces = useCallback(async (category) => {
    setLoading(true);
    setError(null);
    try {
      const params = category ? { category } : {};
      setPlaces(await getPlaces(params));
    } catch (err) {
      setError(errorMessage(err));
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces(activeCategory);
  }, [activeCategory, fetchPlaces]);

  return {
    places,
    categories,
    activeCategory,
    loading,
    error,
    selectCategory: setActiveCategory, // pass null to clear the filter (FR-3)
    refresh: () => fetchPlaces(activeCategory),
  };
}
