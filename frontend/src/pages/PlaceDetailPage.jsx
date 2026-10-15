// PlaceDetailPage — /places/:id (SRS FR-5…FR-9, T-4.4…T-4.6).

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPlaceById } from '../services/placeService';
import { getCategories } from '../services/categoryService';
import { errorMessage } from '../services/api';
import { useVisitPlan } from '../hooks/useVisitPlan';
import DetailView from '../components/PlaceDetail/DetailView';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';

export default function PlaceDetailPage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const { addPlace, hasPlace } = useVisitPlan();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPlaceById(id)
      .then((data) => !cancelled && setPlace(data))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    getCategories()
      .then((data) => !cancelled && setCategories(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAdd = async (p) => {
    const ok = await addPlace(p);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  if (loading) return <Loader label="Loading place…" />;
  if (error) return <ErrorMessage message={error} />;
  if (!place) return <ErrorMessage message="Place not found." />;

  const categoryName = categories.find((c) => c.category_id === place.category_id)?.category_name;

  return (
    <div className="py-8">
      <DetailView
        place={place}
        categoryName={categoryName}
        inPlan={hasPlace(place.place_id)}
        onAdd={handleAdd}
        added={added}
      />
    </div>
  );
}
