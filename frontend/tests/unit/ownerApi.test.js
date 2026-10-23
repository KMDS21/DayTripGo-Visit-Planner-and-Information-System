// Unit — the two axios instances must never swap tokens.
// An owner signed in alongside an admin has both keys in localStorage; the
// owner client must send the owner JWT and the admin client the admin JWT.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import api, {
  ownerApi,
  ADMIN_TOKEN_KEY,
  OWNER_TOKEN_KEY,
} from '../../src/services/api';

const ADMIN_JWT = 'admin.header.payload';
const OWNER_JWT = 'owner.header.payload';

// Swap in an adapter that records the outgoing config, then read a header
// back through AxiosHeaders.get() (property access is not guaranteed).
function recordHeaders(instance) {
  let captured = null;
  instance.defaults.adapter = async (config) => {
    captured = config;
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  return async (url, config) => {
    await instance.get(url, config);
    const headers = captured?.headers;
    if (!headers) return {};
    if (typeof headers.get === 'function') {
      return { authorization: headers.get('Authorization') ?? null };
    }
    return { authorization: headers.Authorization ?? null };
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('admin / owner token separation', () => {
  test('ownerApi sends the owner JWT and never the admin one', async () => {
    localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_JWT);
    localStorage.setItem(OWNER_TOKEN_KEY, OWNER_JWT);

    const send = recordHeaders(ownerApi);
    const { authorization } = await send('/owner/auth/me');

    expect(authorization).toBe(`Bearer ${OWNER_JWT}`);
    expect(authorization).not.toContain('admin');
  });

  test('api sends the admin JWT and never the owner one', async () => {
    localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_JWT);
    localStorage.setItem(OWNER_TOKEN_KEY, OWNER_JWT);

    const send = recordHeaders(api);
    const { authorization } = await send('/messages');

    expect(authorization).toBe(`Bearer ${ADMIN_JWT}`);
    expect(authorization).not.toContain('owner');
  });

  test('an owner session alone leaves the admin client unauthenticated', async () => {
    localStorage.setItem(OWNER_TOKEN_KEY, OWNER_JWT);

    const send = recordHeaders(api);
    const { authorization } = await send('/messages');

    expect(authorization).toBeNull();
  });

  test('an admin session alone leaves the owner client unauthenticated', async () => {
    localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_JWT);

    const send = recordHeaders(ownerApi);
    const { authorization } = await send('/owner/auth/me');

    expect(authorization).toBeNull();
  });

  test('signed out entirely → no Authorization header anywhere', async () => {
    // Each instance gets its own recorder; they are independent objects.
    const adminSend = recordHeaders(api);
    const ownerSend = recordHeaders(ownerApi);

    expect((await adminSend('/messages')).authorization).toBeNull();
    expect((await ownerSend('/owner/auth/me')).authorization).toBeNull();
  });
});
