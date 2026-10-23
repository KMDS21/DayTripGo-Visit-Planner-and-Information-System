// Unit — TTL cache used by the public read endpoints (places list, page copy).
// Pure in-memory behaviour: hit/miss, expiry, invalidation, bounded size.

const { createTtlCache } = require('../../src/utils/ttlCache');

describe('createTtlCache', () => {
  test('set → get round-trips the value', () => {
    const cache = createTtlCache({ ttlMs: 60_000 });
    cache.set('places:public:all', [{ place_id: 1 }]);
    expect(cache.get('places:public:all')).toEqual([{ place_id: 1 }]);
  });

  test('unknown key is a miss', () => {
    const cache = createTtlCache({ ttlMs: 60_000 });
    expect(cache.get('nope')).toBeUndefined();
  });

  test('entries expire after the TTL', async () => {
    const cache = createTtlCache({ ttlMs: 20 });
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');
    await new Promise((r) => setTimeout(r, 30));
    expect(cache.get('k')).toBeUndefined();
    expect(cache.size).toBe(0); // expired entries are dropped on read
  });

  test('delete invalidates one key (the write-invalidation path)', () => {
    const cache = createTtlCache({ ttlMs: 60_000 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
  });

  test('clear invalidates everything (places list after any write)', () => {
    const cache = createTtlCache({ ttlMs: 60_000 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  test('overwriting a key replaces the value and deadline', async () => {
    const cache = createTtlCache({ ttlMs: 40 });
    cache.set('k', 'first');
    await new Promise((r) => setTimeout(r, 25));
    cache.set('k', 'second'); // fresh deadline
    await new Promise((r) => setTimeout(r, 25));
    expect(cache.get('k')).toBe('second'); // the original 40ms deadline would have expired it
  });

  test('size is bounded — the oldest entry is evicted first', () => {
    const cache = createTtlCache({ ttlMs: 60_000, maxEntries: 2 });
    cache.set('first', 1);
    cache.set('second', 2);
    cache.set('third', 3);
    expect(cache.size).toBe(2);
    expect(cache.get('first')).toBeUndefined(); // evicted
    expect(cache.get('second')).toBe(2);
    expect(cache.get('third')).toBe(3);
  });
});
