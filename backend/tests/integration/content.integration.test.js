// Integration — page content upsert/read round-trip through service → model →
// real Supabase. The service only allows the four real page keys, so fixtures
// ride on the 'contact' page under IT-tagged section keys (the site ignores
// sections it does not know); afterAll deletes exactly those rows.

const contentService = require('../../src/services/contentService');
const { supabase, makeTag, expectOk } = require('./helpers');

const PREFIX = `it_${Date.now()}`.toLowerCase(); // section_key must match ^[a-z0-9_]{1,60}$
const KEY_A = `${PREFIX}_intro`;
const KEY_B = `${PREFIX}_note`;

afterAll(async () => {
  await supabase.from('page_content').delete().eq('page_key', 'contact').like('section_key', `${PREFIX}_%`);
});

test('updatePage upserts sections and getPage returns them as a map', async () => {
  const written = await contentService.updatePage('contact', {
    [KEY_A]: 'IT integration intro',
    [KEY_B]: 'IT integration note',
  });
  expect(written[KEY_A]).toBe('IT integration intro');
  expect(written[KEY_B]).toBe('IT integration note');

  const reread = await contentService.getPage('contact');
  expect(reread[KEY_A]).toBe('IT integration intro');
  expect(reread[KEY_B]).toBe('IT integration note');
});

test('re-upserting the same section keys overwrites the stored value', async () => {
  await contentService.updatePage('contact', { [KEY_A]: 'IT updated intro' });
  const reread = await contentService.getPage('contact');
  expect(reread[KEY_A]).toBe('IT updated intro');
  expect(reread[KEY_B]).toBe('IT integration note'); // untouched sibling section
});

test('unknown page keys are rejected with a 404', async () => {
  await expect(contentService.getPage('not-a-page')).rejects.toMatchObject({ status: 404 });
  await expect(
    contentService.updatePage('test-page', { anything: 'x' })
  ).rejects.toMatchObject({ status: 404 });
});

test('malformed section payloads are rejected with a 400 and write nothing', async () => {
  await expect(contentService.updatePage('contact', null)).rejects.toMatchObject({ status: 400 });
  await expect(contentService.updatePage('contact', { 'Bad-Key!': 'x' })).rejects.toMatchObject({
    status: 400,
  });
  await expect(contentService.updatePage('contact', { [KEY_A]: 123 })).rejects.toMatchObject({
    status: 400,
  });
  await expect(contentService.updatePage('contact', {})).rejects.toMatchObject({ status: 400 });

  const data = expectOk(
    await supabase.from('page_content').select('*').eq('page_key', 'contact').eq('section_key', 'Bad-Key!')
  );
  expect(data).toHaveLength(0);
});
