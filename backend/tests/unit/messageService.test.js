// Unit — message service business rules with the model mocked out.
// No network, no Supabase: only validation, cleanup and error mapping.

jest.mock('../../src/models/messageModel');

const messageModel = require('../../src/models/messageModel');
const messageService = require('../../src/services/messageService');

const VALID = {
  name: 'Jane Traveller',
  email: 'jane@example.com',
  message: 'Is the temple open on Poya days?',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('submitMessage', () => {
  test('rejects a body with missing fields (400)', async () => {
    for (const body of [{}, { ...VALID, name: '  ' }, { ...VALID, message: '' }]) {
      await expect(messageService.submitMessage(body)).rejects.toMatchObject({ status: 400 });
    }
    expect(messageModel.create).not.toHaveBeenCalled();
  });

  test('rejects an invalid email (400)', async () => {
    await expect(
      messageService.submitMessage({ ...VALID, email: 'not-an-email' })
    ).rejects.toMatchObject({ status: 400 });
    expect(messageModel.create).not.toHaveBeenCalled();
  });

  test('cleans fields and applies defaults before persisting', async () => {
    messageModel.create.mockResolvedValue({ data: { message_id: 1 }, error: null });
    await messageService.submitMessage({
      ...VALID,
      name: '  Jane Traveller  ',
      phone: ' ',
      subject: '   ',
    });
    expect(messageModel.create).toHaveBeenCalledWith({
      name: 'Jane Traveller',
      email: 'jane@example.com',
      message: 'Is the temple open on Poya days?',
      phone: null,
      country: null,
      city: null,
      subject: 'General enquiry',
      status: 'new',
    });
  });

  test('truncates over-long fields to their column limits', async () => {
    messageModel.create.mockResolvedValue({ data: { message_id: 2 }, error: null });
    await messageService.submitMessage({
      ...VALID,
      name: 'n'.repeat(500),
      message: 'm'.repeat(6000),
    });
    const saved = messageModel.create.mock.calls[0][0];
    expect(saved.name).toHaveLength(120);
    expect(saved.message).toHaveLength(5000);
  });

  test('maps a missing table to a 503 with migration guidance', async () => {
    messageModel.create.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "public.messages" does not exist' },
    });
    await expect(messageService.submitMessage(VALID)).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('database/schema/002_contact_content.sql'),
    });
  });

  test('maps an unexpected database failure to a 500', async () => {
    messageModel.create.mockResolvedValue({ data: null, error: { message: 'connection reset' } });
    await expect(messageService.submitMessage(VALID)).rejects.toMatchObject({ status: 500 });
  });
});

describe('listMessages', () => {
  test('returns whatever the model lists', async () => {
    const rows = [{ message_id: 1 }, { message_id: 2 }];
    messageModel.findAll.mockResolvedValue({ data: rows, error: null });
    await expect(messageService.listMessages()).resolves.toEqual(rows);
  });

  test('maps a missing table to a 503', async () => {
    messageModel.findAll.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'does not exist' },
    });
    await expect(messageService.listMessages()).rejects.toMatchObject({ status: 503 });
  });
});

describe('markRead', () => {
  test('returns the updated row', async () => {
    const row = { message_id: 1, status: 'read' };
    messageModel.markRead.mockResolvedValue({ data: row, error: null });
    await expect(messageService.markRead(1)).resolves.toEqual(row);
  });

  test('unknown id → 404', async () => {
    messageModel.markRead.mockResolvedValue({ data: null, error: null });
    await expect(messageService.markRead(999)).rejects.toMatchObject({ status: 404 });
  });

  test('PGRST116 from .single() (no matching row) → 404, not 500', async () => {
    // The real-DB shape: an UPDATE matching zero rows makes .single() fail
    // with PGRST116. The service maps that to "not found", not a server fault.
    messageModel.markRead.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
    });
    await expect(messageService.markRead(999)).rejects.toMatchObject({ status: 404 });
  });

  test('other database errors stay 500', async () => {
    messageModel.markRead.mockResolvedValue({
      data: null,
      error: { code: 'XX000', message: 'connection to server lost' },
    });
    await expect(messageService.markRead(1)).rejects.toMatchObject({ status: 500 });
  });
});

describe('deleteMessage', () => {
  test('deletes an existing message and echoes the id', async () => {
    messageModel.findById.mockResolvedValue({ data: { message_id: 5 }, error: null });
    messageModel.remove.mockResolvedValue({ error: null });
    await expect(messageService.deleteMessage(5)).resolves.toEqual({ message_id: 5 });
    expect(messageModel.remove).toHaveBeenCalledWith(5);
  });

  test('unknown id → 404 and never calls remove', async () => {
    messageModel.findById.mockResolvedValue({ data: null, error: null });
    await expect(messageService.deleteMessage(404)).rejects.toMatchObject({ status: 404 });
    expect(messageModel.remove).not.toHaveBeenCalled();
  });
});
