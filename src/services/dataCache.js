const TTL = 60 * 1000 // 60 seconds

const store = {}

export const cache = {
  get(key) {
    const entry = store[key]
    if (!entry) return null
    if (Date.now() - entry.ts > TTL) {
      delete store[key]
      return null
    }
    return entry.data
  },

  set(key, data) {
    store[key] = { data, ts: Date.now() }
  },

  invalidate(...keys) {
    keys.forEach(k => delete store[k])
  },

  invalidateAll() {
    Object.keys(store).forEach(k => delete store[k])
  },
}
