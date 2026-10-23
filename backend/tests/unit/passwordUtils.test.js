// Unit — password hashing (SRS NFR-5).

const { hashPassword, comparePassword } = require('../../src/utils/passwordUtils');

describe('passwordUtils', () => {
  test('hashPassword returns a bcrypt hash, never the plain text', async () => {
    const hash = await hashPassword('Secret123!');
    expect(hash).not.toBe('Secret123!');
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
  });

  test('the same password hashes differently every time (per-password salt)', async () => {
    const a = await hashPassword('Secret123!');
    const b = await hashPassword('Secret123!');
    expect(a).not.toBe(b);
  });

  test('comparePassword accepts the correct password', async () => {
    const hash = await hashPassword('Secret123!');
    await expect(comparePassword('Secret123!', hash)).resolves.toBe(true);
  });

  test('comparePassword rejects a wrong password', async () => {
    const hash = await hashPassword('Secret123!');
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});
