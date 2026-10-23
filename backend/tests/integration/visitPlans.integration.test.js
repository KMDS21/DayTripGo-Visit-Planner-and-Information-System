// Integration — visit plan lifecycle through service → model → real Supabase
// (SRS FR-10…FR-13, NFR-7): create plan → replace ordered items → read back
// with place details → empty the plan. Fixtures tagged, cleaned in afterAll.

const visitPlanService = require('../../src/services/visitPlanService');
const { supabase, makeTag, expectOk, mapsUrlWithCoords } = require('./helpers');

jest.setTimeout(30000); // plan + items + place fixtures = many round trips

const TAG = makeTag();
const SESSION_ID = `it-${TAG.toLowerCase()}`;
let categoryId;
let placeOneId;
let placeTwoId;
let planId;

beforeAll(async () => {
  const category = expectOk(
    await supabase.from('categories').insert({ category_name: `${TAG} Cat` }).select().single()
  );
  categoryId = category.category_id;

  const one = expectOk(
    await supabase
      .from('places')
      .insert({
        name: `${TAG} Place One`,
        category_id: categoryId,
        description: 'First fixture place.',
        google_maps_url: mapsUrlWithCoords(6.02, 80.06),
      })
      .select()
      .single()
  );
  const two = expectOk(
    await supabase
      .from('places')
      .insert({
        name: `${TAG} Place Two`,
        category_id: categoryId,
        description: 'Second fixture place.',
        google_maps_url: mapsUrlWithCoords(6.03, 80.05),
      })
      .select()
      .single()
  );
  placeOneId = one.place_id;
  placeTwoId = two.place_id;
});

afterAll(async () => {
  // visit_plan_items go with their plan via ON DELETE CASCADE.
  await supabase.from('visit_plans').delete().eq('session_id', SESSION_ID);
  await supabase.from('places').delete().like('name', `${TAG}%`);
  await supabase.from('categories').delete().like('category_name', `${TAG}%`);
});

test('createPlan stores a session plan with the default title', async () => {
  const plan = await visitPlanService.createPlan(SESSION_ID);
  planId = plan.plan_id;
  expect(typeof planId).toBe('number');
  expect(plan.session_id).toBe(SESSION_ID);
  expect(plan.plan_title).toBe('My One-Day Plan');
});

test('setPlanItems replaces the ordered set; getPlan returns items sorted with place details', async () => {
  // Deliberately out of order — the service must sort by visit_order.
  const plan = await visitPlanService.setPlanItems(planId, [
    { place_id: placeTwoId, visit_order: 2 },
    { place_id: placeOneId, visit_order: 1 },
  ]);
  expect(plan.visit_plan_items).toHaveLength(2);

  const [first, second] = plan.visit_plan_items;
  expect(first.visit_order).toBe(1);
  expect(first.place.place_id).toBe(placeOneId);
  expect(first.place.name).toBe(`${TAG} Place One`);
  expect(second.visit_order).toBe(2);
  expect(second.place.place_id).toBe(placeTwoId);

  // Coordinates derived from each place's Maps link (no lat/lng columns).
  expect(first.place.latitude).toBeCloseTo(6.02, 3);
  expect(second.place.longitude).toBeCloseTo(80.05, 3);
});

test('a second replace swaps the whole item set (FR-13)', async () => {
  const plan = await visitPlanService.setPlanItems(planId, [
    { place_id: placeOneId, visit_order: 1 },
  ]);
  expect(plan.visit_plan_items).toHaveLength(1);
  expect(plan.visit_plan_items[0].place.place_id).toBe(placeOneId);
});

test('replacing with an empty list clears the plan', async () => {
  const plan = await visitPlanService.setPlanItems(planId, []);
  expect(plan.visit_plan_items).toHaveLength(0);

  // Cascade check: no orphan items remain in the join table.
  const data = expectOk(
    await supabase.from('visit_plan_items').select('*').eq('plan_id', planId)
  );
  expect(data).toHaveLength(0);
});

test('reading an unknown plan is a 404', async () => {
  await expect(visitPlanService.getPlan(999999999)).rejects.toMatchObject({ status: 404 });
});
