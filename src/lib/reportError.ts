/**
 * Fire-and-forget client error beacon. Sends a minimal report to the
 * /report-error Netlify Function so the owner can see what failed in production
 * without anyone opening DevTools.
 *
 * Hard rules:
 *   - NEVER throws (a broken reporter must never break the app).
 *   - NO PII: only `pathname + hash` is sent (query string is stripped, so a
 *     form's ?email=... never leaks). No cookies, no body.
 *   - Throttled + deduped so a failing page can't spam the endpoint.
 */

export type ErrorSource = 'chunk' | 'data' | 'render' | 'boundary'

const ENDPOINT = '/.netlify/functions/report-error'
const MAX_PER_SESSION = 8

const seen = new Set<string>()
let count = 0

export function reportError(source: ErrorSource, error: unknown): void {
  try {
    const message = (error instanceof Error ? error.message : String(error ?? '')).slice(0, 500)
    const dedupeKey = `${source}|${message}`
    if (seen.has(dedupeKey) || count >= MAX_PER_SESSION) return
    seen.add(dedupeKey)
    count++

    const payload = {
      source,
      message,
      // pathname + hash only — deliberately NO search/query string (no PII).
      url: `${window.location.pathname}${window.location.hash}`.slice(0, 300),
      lang: document.documentElement.lang || undefined,
      userAgent: navigator.userAgent.slice(0, 300),
      ts: new Date().toISOString(),
    }
    const body = JSON.stringify(payload)

    // sendBeacon survives the page unload/reload (critical for stale-chunk,
    // which reports right before window.location.reload()). Same-origin, so no
    // CORS preflight. Fall back to keepalive fetch where unavailable.
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
    } else {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        /* best-effort */
      })
    }
  } catch {
    /* never throw from the reporter */
  }
}
