// Integration — categories list against real Supabase (controller → model → DB).
// Read-only apart from one tagged fixture row removed in afterAll.

const categoryModel = require('../../src/models/categoryModel');
const { supabase, makeTag, expectOk } = require('./helpers');

const TAG = makeTag();

beforeAll(async () => {
  expectOk(
    await supabase.from('categories').insert({ category_name: `${TAG} Cat` }).select().single()
  );
});

afterAll(async () => {
  await supabase.from('categories').delete().like('category_name', `${TAG}%`);
});

test('findAll returns rows shaped like category records', async () => {
  const { data, error } = await categoryModel.findAll();
  expect(error).toBeNull();
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
  for (const row of data) {
    expect(typeof row.category_id).toBe('number');
    expect(typeof row.category_name).toBe('string');
    expect(row.category_name.length).toBeGreaterThan(0);
  }
});

test('the four seeded categories are present', async () => {
  const { data } = await categoryModel.findAll();
  const names = data.map((row) => row.category_name);
  for (const seeded of ['Religious', 'Nature', 'Heritage', 'Cultural']) {
    expect(names).toContain(seeded);
  }
});

test('the tagged fixture category appears in the list', async () => {
  const { data } = await categoryModel.findAll();
  expect(data.map((row) => row.category_name)).toContain(`${TAG} Cat`);
});
