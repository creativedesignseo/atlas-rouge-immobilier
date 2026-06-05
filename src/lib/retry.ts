/**
 * Resilience helpers for data fetches (Supabase queries in particular).
 *
 * `withTimeout` races a promise against a deadline — critical because supabase-js
 * queries occasionally hang (flaky mobile network, browser waking from
 * background) and never settle on their own.
 *
 * `withRetry` re-runs a fetch on *transient* failure with exponential backoff +
 * jitter, so a single network blip on first load self-heals instead of leaving
 * the page empty until a manual reload.
 */

/**
 * Reject with Error('TIMEOUT') if `promise` doesn't settle within `ms`.
 * Note: the underlying request is NOT cancelled — it keeps running in the
 * background; we just stop waiting on it.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('TIMEOUT')), ms)
    promise.then(
      (v) => {
        clearTimeout(id)
        resolve(v)
      },
      (e) => {
        clearTimeout(id)
        reject(e)
      },
    )
  })
}

export interface RetryOptions {
  /** Number of retries after the first attempt. Default 2 → 3 attempts total. */
  retries?: number
  /** Base backoff in ms (grows exponentially per attempt). Default 300. */
  baseDelayMs?: number
  /** Cap on a single backoff delay. Default 2000. */
  maxDelayMs?: number
  /** Per-attempt timeout. Each attempt gets its own clock. Default 8000. */
  timeoutMs?: number
  /** Decide whether an error is worth retrying. Default: only transient errors. */
  isRetryable?: (err: unknown) => boolean
}

/**
 * True only for *transient* failures worth retrying: our own TIMEOUT, browser
 * network failures, and HTTP 5xx / 429. Deliberately NOT retryable: PostgREST 4xx
 * (a malformed filter won't fix itself in 300ms), and `.single()` with 0 rows
 * (that's a legitimate 404, not a blip). Retrying those just burns round-trips
 * and makes perceived latency worse.
 */
export function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    if (err.message === 'TIMEOUT') return true
    // fetch() network failure (offline, DNS, connection reset, CORS preflight…)
    if (/Failed to fetch|NetworkError|Network request failed|Load failed/i.test(err.message)) {
      return true
    }
  }
  // PostgREST/supabase-js error objects expose a numeric-ish status / code.
  const status = (err as { status?: number; code?: string | number } | null)?.status
  if (typeof status === 'number') return status >= 500 || status === 429
  const code = (err as { code?: string | number } | null)?.code
  if (typeof code === 'number') return code >= 500 || code === 429
  return false
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Run `fn`, retrying transient failures with exponential backoff + jitter.
 * Each attempt is wrapped in its own `timeoutMs` (a 3× retry of an 8s timeout is
 * NOT a 24s global wait — every attempt restarts the clock). Non-retryable
 * errors (or the final attempt) reject immediately.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    retries = 2,
    baseDelayMs = 300,
    maxDelayMs = 2000,
    timeoutMs = 8000,
    isRetryable = isTransientError,
  } = opts

  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(Promise.resolve(fn()), timeoutMs)
    } catch (err) {
      lastErr = err
      if (attempt === retries || !isRetryable(err)) throw err
      // Exponential backoff with full-ish jitter: half fixed, half random.
      // Jitter prevents a thundering herd when Supabase blips for everyone.
      const expo = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
      await sleep(expo * (0.5 + Math.random() * 0.5))
    }
  }
  throw lastErr
}
