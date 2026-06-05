/**
 * Detects "stale chunk" errors: after a deploy, an open tab still runs the old
 * index.js, which imports lazy chunks (Search-XXX.js, PropertyDetail-XXX.js, ...)
 * whose content hashes no longer exist on the server. The dynamic import then
 * fails. The right recovery is a one-shot reload (handled in main.tsx), not the
 * error boundary fallback.
 *
 * Shared by main.tsx (reload logic) and ErrorBoundary.tsx (skip the fallback for
 * these). Kept in a neutral module so neither imports the other (the boundary
 * used to duplicate this regex to dodge a circular import with main.tsx).
 *
 * The patterns cover the wording each engine uses for a failed module import:
 *   - Chromium: "Failed to fetch dynamically imported module"
 *   - Firefox:  "error loading dynamically imported module"
 *   - Safari:   "Importing a module script failed" / "module script failed"
 *   - WebKit:   "Load failed" (generic network failure during import)
 *   - Bundlers: "ChunkLoadError"
 */
export function isStaleChunkError(reason: unknown): boolean {
  const msg = reason instanceof Error ? reason.message : String(reason ?? '')
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|module script failed|dynamically imported module|ChunkLoadError|Load failed/i.test(
    msg,
  )
}
