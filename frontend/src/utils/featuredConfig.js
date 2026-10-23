// featuredConfig — serialisation helpers for the admin-chosen "Featured
// escapes" selection, stored in `page_content` as flat text sections:
//   featured_place_ids = "3,7,1"               (CSV, in display order)
//   featured_covers   = "3=/uploads/places/a.png;7="  (id=cover pairs, ";"-separated)

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
export function serializeFeaturedRows(rows) {
  const clean = (rows || []).filter((row) => row && Number.isInteger(Number(row.id)) && Number(row.id) > 0);
  return {
    featured_place_ids: clean.map((row) => Number(row.id)).join(','),
    featured_covers: clean
      .filter((row) => row.cover)
      .map((row) => `${Number(row.id)}=${row.cover}`)
      .join(';'),
  };
}
