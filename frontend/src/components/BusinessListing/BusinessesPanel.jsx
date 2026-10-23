// BusinessesPanel — the "Businesses" tab of the Explore page.
// Self-contained (tag filter + grid + detail popup) so it only loads its data
// while the tab is actually selected.

import { useState } from 'react';
import { useBusinesses } from '../../hooks/useBusinesses';
import Loader from '../Common/Loader';
import ErrorMessage from '../Common/ErrorMessage';
import BusinessTagFilter from './BusinessTagFilter';
import BusinessGrid from './BusinessGrid';
import BusinessPreviewModal from './BusinessPreviewModal';

export default function BusinessesPanel({ initialPreviewId = null }) {
  const { businesses, tags, activeTag, loading, error, selectTag, refresh } = useBusinesses();
  // A card tapped in the home page's featured carousel hands its id over
  // through the router state (see ExplorePage); the listing itself is looked
  // up from this tab's data, which arrives a moment later.
  const [previewId, setPreviewId] = useState(() => Number(initialPreviewId) || null);
  const preview = previewId === null ? null : businesses.find((b) => b.business_id === previewId) || null;

  const tagNamesFor = (business) =>
    (business.tags || [])
      .map((id) => tags.find((t) => t.category_id === id)?.category_name)
      .filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Filter row — tag pills on the right, count on the left */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">
          {loading
            ? 'Loading businesses…'
            : `${businesses.length} ${businesses.length === 1 ? 'business' : 'businesses'}`}
        </p>
        <BusinessTagFilter tags={tags} activeTag={activeTag} onSelect={selectTag} />
      </div>

      {loading && <Loader label="Loading businesses…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={refresh} />}
      {!loading && !error && (
        <BusinessGrid businesses={businesses} tags={tags} onOpen={(business) => setPreviewId(business.business_id)} />
      )}

      {preview && (
        <BusinessPreviewModal
          business={preview}
          tagNames={tagNamesFor(preview)}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}
