// Integration — places CRUD round-trip through service → model → real Supabase
// (SRS FR-1…FR-9, FR-16…FR-19). Fixtures are tagged IT-<tag> and cleaned up
// in afterAll, including defensive tag-based deletes for half-failed runs.

const placeService = require('../../src/services/placeService');
const { supabase, makeTag, expectOk, mapsUrlWithCoords } = require('./helpers');

jest.setTimeout(30000); // CRUD flow = many sequential network round trips

const TAG = makeTag();
let categoryId;
let placeId;

beforeAll(async () => {
  const category = expectOk(
    await supabase
      .from('categories')
      .insert({ category_name: `${TAG} Cat` })
      .select()
      .single()
  );
  categoryId = category.category_id;

  const place = await placeService.createPlace(
    {
      name: `${TAG} Test Place`,
      category_id: categoryId,
      description: 'Fixture place for the integration suite.',
      opening_hours: '08:00 - 17:00',
      travel_tips: 'Take the coastal road.',
      image_url: null,
      google_maps_url: mapsUrlWithCoords(6.0234, 80.056),
    },
    null
  );
  placeId = place.place_id;
});

afterAll(async () => {
  // Defensive: remove anything the tests left behind by tag.
  await supabase.from('places').delete().like('name', `${TAG}%`);
  await supabase.from('categories').delete().like('category_name', `${TAG}%`);
});

test('create returns the stored row with coordinates derived from the Maps link', async () => {
  const place = await placeService.getPlace(placeId);
  expect(place.name).toBe(`${TAG} Test Place`);
  expect(place.category_id).toBe(categoryId);
  expect(place.description).toBe('Fixture place for the integration suite.');
  expect(place.google_maps_url).toBe(mapsUrlWithCoords(6.0234, 80.056));
  expect(place.published).toBe(true);
  // Coordinates come from the link, not from columns (migration 003).
  expect(place.latitude).toBeCloseTo(6.0234, 4);
  expect(place.longitude).toBeCloseTo(80.056, 4);
});

test('update persists new field values', async () => {
  const updated = await placeService.updatePlace(placeId, {
    name: `${TAG} Renamed`,
    description: 'Updated by the integration suite.',
    opening_hours: '09:00 - 18:00',
  });
  expect(updated.name).toBe(`${TAG} Renamed`);

  const reread = await placeService.getPlace(placeId);
  expect(reread.name).toBe(`${TAG} Renamed`);
  expect(reread.description).toBe('Updated by the integration suite.');
  expect(reread.opening_hours).toBe('09:00 - 18:00');
  // Fields not part of the update survive untouched.
  expect(reread.travel_tips).toBe('Take the coastal road.');
});

test('public list includes the published fixture, and category filter matches it', async () => {
  const all = await placeService.listPlaces();
  expect(all.some((p) => p.place_id === placeId)).toBe(true);

  const byCategory = await placeService.listPlaces(categoryId);
  expect(byCategory).toHaveLength(1);
  expect(byCategory[0].place_id).toBe(placeId);
});

test('publish switch hides and re-shows the place from the public list', async () => {
  const hidden = await placeService.setPlacePublished(placeId, false);
  expect(hidden.published).toBe(false);

  const afterHide = await placeService.listPlaces();
  expect(afterHide.some((p) => p.place_id === placeId)).toBe(false);
  // Admin view still sees it.
  const adminView = await placeService.listPlaces(undefined, { includeUnpublished: true });
  expect(adminView.some((p) => p.place_id === placeId)).toBe(true);

  await placeService.setPlacePublished(placeId, true);
  const afterShow = await placeService.listPlaces();
  expect(afterShow.some((p) => p.place_id === placeId)).toBe(true);
});

test('delete removes the row; reading it afterwards is a 404', async () => {
  const result = await placeService.deletePlace(placeId);
  expect(result).toEqual({ place_id: placeId });

  await expect(placeService.getPlace(placeId)).rejects.toMatchObject({ status: 404 });

  const remaining = await placeService.listPlaces(undefined, { includeUnpublished: true });
  expect(remaining.some((p) => p.place_id === placeId)).toBe(false);
});
