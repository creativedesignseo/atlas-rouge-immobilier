import { supabase } from '@/lib/supabase'

export const AUTH_STORAGE_KEY = 'atlas-rouge-auth-token'

export function storedAccessToken(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)

    if (
      parsed &&
      typeof parsed === 'object' &&
      'access_token' in parsed &&
      typeof (parsed as { access_token?: unknown }).access_token === 'string'
    ) {
      return (parsed as { access_token: string }).access_token
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      'currentSession' in parsed &&
      (parsed as { currentSession?: unknown }).currentSession &&
      typeof (parsed as { currentSession?: { access_token?: unknown } }).currentSession?.access_token === 'string'
    ) {
      return (parsed as { currentSession: { access_token: string } }).currentSession.access_token
    }
  } catch {
    return null
  }

  return null
}

export async function currentAccessToken(timeoutMs = 6000): Promise<string | null> {
  const session = await Promise.race([
    supabase.auth.getSession().then((r) => r.data.session).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ])
  return session?.access_token || storedAccessToken()
}

export async function clearLocalSessionAndRedirect() {
  try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(AUTH_STORAGE_KEY) } catch { /* ignore */ }
    window.location.href = '/admin/login'
  }
}
