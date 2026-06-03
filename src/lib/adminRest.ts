import { clearLocalSessionAndRedirect, currentAccessToken } from '@/lib/authSession'

// Shared authenticated PostgREST helper for admin operations. Mirrors the
// pattern in propertyAdmin.service (direct fetch to PostgREST with the agent
// JWT, a timeout, and session-expiry handling) so new admin services don't
// re-implement it. supabase-js is intentionally avoided here: it has hung in
// the admin (see feedback memory), so we go straight to REST with a timeout.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const DEFAULT_TIMEOUT_MS = 30000

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface AdminRequestOptions {
  method: Method
  body?: unknown
  timeoutMs?: number
  // PostgREST returns the affected rows when Prefer: return=representation is
  // set. DELETE/PATCH callers that don't need the body can set this false.
  returnRepresentation?: boolean
}

export async function adminRestRequest<T>(
  path: string,
  options: AdminRequestOptions,
): Promise<T> {
  const accessToken = await currentAccessToken()
  if (!accessToken) {
    await clearLocalSessionAndRedirect()
    throw new Error('Tu sesión caducó. Te llevamos a iniciar sesión de nuevo.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  try {
    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
    if (options.returnRepresentation !== false) {
      headers.Prefer = 'return=representation'
    }

    const response = await fetch(`${SUPABASE_URL}${path}`, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    })

    if (response.status === 401) {
      await clearLocalSessionAndRedirect()
      throw new Error('Tu sesión caducó. Te llevamos a iniciar sesión de nuevo.')
    }

    const result = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(
        (result && (result.message || result.error || result.hint)) ||
          `Request failed (${response.status})`,
      )
    }
    return result as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La operación tardó demasiado. Reintenta.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
