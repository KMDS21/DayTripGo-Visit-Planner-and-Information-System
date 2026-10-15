// PhotoGallery — representative photo of a place on the detail page (SRS FR-7,
// "where available"). Renders the admin-provided image or a generated
// category-gradient placeholder.

import { placeImage } from '../../utils/placeImage';

export default function PhotoGallery({ place, categoryName }) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-border shadow-sm">
      <img
        src={placeImage(place, categoryName)}
        alt={place.name}
        className="aspect-[4/3] w-full object-cover"
      />
      {!place.image_url && (
        <figcaption className="bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
          No photo yet — the administrator can add one from the dashboard.
        </figcaption>
      )}
    </figure>
  );
}
