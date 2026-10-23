// Integration — contact message lifecycle through service → model → real
// Supabase: submit → admin list → mark read → delete, plus validation rejections.

const messageService = require('../../src/services/messageService');
const messageModel = require('../../src/models/messageModel');
const { supabase, makeTag } = require('./helpers');

jest.setTimeout(30000); // full lifecycle = many sequential round trips

const TAG = makeTag();
const EMAIL = `it-${TAG.toLowerCase()}@example.com`;
let messageId;

afterAll(async () => {
  // Defensive: exact-tag cleanup in case a test failed before deleting.
  await supabase.from('contact_messages').delete().eq('email', EMAIL);
});

test('missing or malformed input is rejected with a 400 before any insert', async () => {
  await expect(messageService.submitMessage({ email: 'a@b.c', message: 'hi' })).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    messageService.submitMessage({ name: 'IT', email: 'not-an-email', message: 'hi' })
  ).rejects.toMatchObject({ status: 400 });
});

test('submit → list → markRead → delete round-trips through the database', async () => {
  const created = await messageService.submitMessage({
    name: `${TAG} Traveller`,
    email: EMAIL,
    phone: '+94 77 000 0000',
    country: 'Sri Lanka',
    city: 'Colombo',
    subject: `${TAG} enquiry`,
    message: 'Integration-suite fixture message.',
  });
  messageId = created.message_id;
  expect(messageId).toEqual(expect.any(Number));
  expect(created.status).toBe('new');

  const inbox = await messageService.listMessages();
  const found = inbox.find((m) => m.message_id === messageId);
  expect(found).toBeDefined();
  expect(found.email).toBe(EMAIL);
  expect(found.name).toBe(`${TAG} Traveller`);

  const read = await messageService.markRead(messageId);
  expect(read.status).toBe('read');
  expect(read.read_at).toBeTruthy();

  const deleted = await messageService.deleteMessage(messageId);
  expect(deleted).toEqual({ message_id: messageId });

  const { data } = await messageModel.findById(messageId);
  expect(data).toBeNull();
});

test('deleting an unknown message is a 404', async () => {
  await expect(messageService.deleteMessage(999999999)).rejects.toMatchObject({ status: 404 });
});

test('marking an unknown message read is a 404', async () => {
  // Fixed in the caching round: .single() answers PGRST116 when no row
  // matches — the service now maps that to its 404 branch instead of the
  // generic 500 it used to raise (see 02-integration-testing.md).
  await expect(messageService.markRead(999999999)).rejects.toMatchObject({ status: 404 });
});
