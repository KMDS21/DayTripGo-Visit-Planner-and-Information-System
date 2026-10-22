// Unit — JWT sign/verify for admin auth (SRS FR-14, NFR-5).
// JWT_SECRET is injected by tests/setup.js before this module loads.

const jwt = require('jsonwebtoken');
const { signToken, verifyToken } = require('../../src/utils/tokenUtils');

const SECRET = process.env.JWT_SECRET;

describe('tokenUtils', () => {
  test('sign → verify round-trips the payload', () => {
    const token = signToken({ admin_id: 7, username: 'admin' });
    const payload = verifyToken(token);
    expect(payload.admin_id).toBe(7);
    expect(payload.username).toBe('admin');
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');
  });

  test('a tampered token fails verification', () => {
    const token = signToken({ admin_id: 7 });
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
    expect(() => verifyToken(tampered)).toThrow();
  });

  test('a token signed with another secret fails verification', () => {
    const foreign = jwt.sign({ admin_id: 7 }, 'someone-elses-secret');
    expect(() => verifyToken(foreign)).toThrow();
  });

  test('an expired token is rejected', () => {
    const expired = jwt.sign({ admin_id: 7 }, SECRET, { expiresIn: '-10s' });
    expect(() => verifyToken(expired)).toThrow(/expired/i);
  });

  test('throws a clear error when JWT_SECRET is not configured', () => {
    const prev = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    let isolated;
    jest.isolateModules(() => {
      isolated = require('../../src/utils/tokenUtils');
    });
    try {
      expect(() => isolated.signToken({})).toThrow('JWT_SECRET is not configured.');
      expect(() => isolated.verifyToken('anything')).toThrow('JWT_SECRET is not configured.');
    } finally {
      process.env.JWT_SECRET = prev;
    }
  });
});
