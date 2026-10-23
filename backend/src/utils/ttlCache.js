// Tiny in-process TTL cache — used by the public read endpoints so a request
// never pays the hosted-Supabase round-trip (~320 ms, measured in the load
// round) unless the data actually changed. Writes invalidate explicitly (see
// placeService / contentService); the TTL is only a safety net for changes
// that happen outside this process (SQL editor, a second instance).

function createTtlCache({ ttlMs = 60 * 1000, maxEntries = 200 } = {}) {
  const store = new Map();

  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (Date.now() > hit.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },

    set(key, value) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      // Map keeps insertion order — evict the oldest entry when full.
      if (store.size > maxEntries) {
        store.delete(store.keys().next().value);
      }
    },

    delete(key) {
      store.delete(key);
    },

    clear() {
      store.clear();
    },

    get size() {
      return store.size;
    },
  };
}

module.exports = { createTtlCache };
