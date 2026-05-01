/**
 * Tiny stale-while-revalidate cache for Supabase queries.
 *
 * Why: every admin/public page nav triggered a fresh Supabase round-trip
 * (~300-700ms). Users perceived it as "the page is hanging". With this cache
 * subsequent visits show the previous data instantly while the new fetch
 * runs in the background — same data freshness, no perceived latency.
 *
 * Strategy:
 *   1. swr(key, fetcher) returns cached data immediately if any.
 *   2. In parallel, kicks off a background refetch and updates listeners
 *      when fresh data lands.
 *   3. Mutations (create/update/delete) call invalidate(prefix) to drop
 *      stale entries — the next read fetches fresh.
 *
 * No external deps. Module-level Maps survive route changes (SPA), so the
 * cache lives as long as the tab.
 */

type Listener<T> = (data: T) => void

interface Entry<T> {
  data: T | undefined
  timestamp: number
  inFlight: Promise<T> | null
  listeners: Set<Listener<T>>
}

const cache = new Map<string, Entry<unknown>>()

/** Hard cap on cache age. Anything older is treated as missing — useful
 *  on app boot if a user opens a tab they had open for hours. */
const MAX_AGE_MS = 5 * 60 * 1000

export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key) as Entry<T> | undefined
  if (!entry || entry.data === undefined) return undefined
  if (Date.now() - entry.timestamp > MAX_AGE_MS) return undefined
  return entry.data
}

export function setCached<T>(key: string, data: T): void {
  let entry = cache.get(key) as Entry<T> | undefined
  if (!entry) {
    entry = { data, timestamp: Date.now(), inFlight: null, listeners: new Set() }
    cache.set(key, entry as unknown as Entry<unknown>)
  } else {
    entry.data = data
    entry.timestamp = Date.now()
    entry.listeners.forEach((fn) => fn(data))
  }
}

/**
 * Run `fetcher`, dedupe in-flight calls under the same key, and write the
 * result to the cache. Returns the fresh result.
 */
export async function refetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  let entry = cache.get(key) as Entry<T> | undefined
  if (!entry) {
    entry = { data: undefined, timestamp: 0, inFlight: null, listeners: new Set() }
    cache.set(key, entry as unknown as Entry<unknown>)
  }
  if (entry.inFlight) return entry.inFlight
  entry.inFlight = fetcher().then((data) => {
    if (!entry) throw new Error('cache entry vanished')
    entry.data = data
    entry.timestamp = Date.now()
    entry.inFlight = null
    entry.listeners.forEach((fn) => fn(data))
    return data
  }).catch((err) => {
    if (entry) entry.inFlight = null
    throw err
  })
  return entry.inFlight
}

/**
 * Drop every cache entry whose key starts with the given prefix.
 * Call this from mutations (e.g. after deleteProperty, after createProperty).
 */
export function invalidate(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

/** Wipe the entire cache. Call on sign-out so the next user sees fresh data. */
export function clearAll(): void {
  cache.clear()
}
