// featuredConfig — serialisation helpers for the admin-chosen home page
// selections, stored in `page_content` as flat text sections:
//   featured_place_ids   = "3,7,1"                          (CSV, in display order)
//   featured_covers      = "3=/uploads/places/a.png;7="      (id=cover pairs, ";")
//   home_place_ids       = "3,7,1"                          (cards in All places)
// Businesses keep their own keys so the places editor stays untouched:
//   featured_business_ids / featured_business_covers / home_business_ids

export const PLACE_FEATURED_KEYS = { ids: 'featured_place_ids', covers: 'featured_covers' };
export const BUSINESS_FEATURED_KEYS = { ids: 'featured_business_ids', covers: 'featured_business_covers' };

// "3,7,1" -> [3, 7, 1]; junk entries are dropped (same rules the featured
// rows use, so a hand-edited section can never break the page).
export function parseIdCsv(value = '') {
  return String(value || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

// [3, 7] -> "3,7"
export function serializeIdCsv(ids = []) {
  return [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))].join(',');
}

// "3,7,1" + "3=/uploads/x.png" -> [{ id: 3, cover: '/uploads/x.png' }, { id: 7, cover: '' }, ...]
export function parseFeaturedRows(idsValue = '', coversValue = '') {
  const covers = {};
  for (const pair of String(coversValue || '').split(';')) {
    if (!pair.trim()) continue;
    const idx = pair.indexOf('=');
    if (idx > 0) covers[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return String(idsValue || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)
    .map((id) => ({ id, cover: covers[String(id)] || '' }));
}

// [{ id: 3, cover: '/uploads/x.png' }, ...] -> the two text sections to save.
// `keys` picks which sections are written: places use the defaults above,
// businesses pass BUSINESS_FEATURED_KEYS (see AdminBusinessesPage).
export function serializeFeaturedRows(rows, keys = PLACE_FEATURED_KEYS) {
  const clean = (rows || []).filter((row) => row && Number.isInteger(Number(row.id)) && Number(row.id) > 0);
  return {
    [keys.ids]: clean.map((row) => Number(row.id)).join(','),
    [keys.covers]: clean
      .filter((row) => row.cover)
      .map((row) => `${Number(row.id)}=${row.cover}`)
      .join(';'),
  };
}
