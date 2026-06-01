import { supabase } from '@/lib/supabase'
import type { SupportedLanguage } from '@/i18n'

export interface TranslatableProperty {
  title: string
  description: string
  highlights: string[]
  amenities: string[]
  transaction: 'sale' | 'rent'
  type: string
  city: string
  neighborhood: string
  priceEUR?: number
  priceMAD?: number
  surface?: number
  landSurface?: number | null
  rooms?: number
  bedrooms?: number
  bathrooms?: number
}

export interface TranslatedPropertyContent {
  title: string
  description: string
  highlights: string[]
  amenities?: string[]
}

export interface TranslationResult {
  en: TranslatedPropertyContent
  fr: TranslatedPropertyContent
  es: TranslatedPropertyContent
}

const AUTH_STORAGE_KEY = 'atlas-rouge-auth-token'

interface TranslationApiError {
  error?: string
  reason?: string
}

function storedAccessToken(): string | null {
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

async function currentAccessToken(): Promise<string | null> {
  const session = await Promise.race([
    supabase.auth.getSession().then((r) => r.data.session).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
  ])
  return session?.access_token || storedAccessToken()
}

async function clearLocalSessionAndRedirect() {
  try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(AUTH_STORAGE_KEY) } catch { /* ignore */ }
    window.location.href = '/admin/login'
  }
}

function shouldRedirectToLogin(reason?: string): boolean {
  return !reason || ['missing_authorization', 'session_rejected', 'user_missing_id'].includes(reason)
}

function authErrorMessage(error: TranslationApiError | null): string {
  switch (error?.reason) {
    case 'agent_not_active':
      return "Votre compte n'est pas un agent actif. Contactez l'administrateur du site."
    case 'agent_lookup_failed':
      return 'La session est valide, mais la fiche agent n\'a pas pu être vérifiée. Réessayez dans un instant.'
    case 'missing_api_key':
      return "Le service de traduction n'est pas correctement configuré côté serveur."
    default:
      return 'Tu sesión caducó. Te llevamos a iniciar sesión de nuevo.'
  }
}

export async function autoTranslateProperty(
  content: TranslatableProperty,
  sourceLang: SupportedLanguage
): Promise<Partial<Record<SupportedLanguage, TranslatedPropertyContent>>> {
  // Admin-only endpoint — attach the current Supabase session so the function
  // can reject anonymous callers (it validates the Bearer token server-side).
  // getSession() can hang on a stuck Navigator Lock (e.g. multiple tabs); race
  // it against a short timeout so a token glitch never freezes the UI forever.
  const accessToken = await currentAccessToken()
  if (!accessToken) {
    await clearLocalSessionAndRedirect()
    throw new Error('Tu sesión caducó. Te llevamos a iniciar sesión de nuevo.')
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  headers.Authorization = `Bearer ${accessToken}`

  // Abort the request if it hangs (blocked network, etc.) so the caller gets a
  // clear error instead of an endless "Adaptando…" spinner.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)
  let response: Response
  try {
    response = await fetch('/.netlify/functions/translate-property', {
      method: 'POST',
      headers,
      body: JSON.stringify({ sourceLang, content }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('La traducción tardó demasiado (posible problema de conexión). Reintenta.')
    }
    throw new Error('No se pudo conectar con el servicio de traducción. Revisa tu conexión.')
  } finally {
    clearTimeout(timeout)
  }

  // 401 can mean a dead session, but it can also mean the function could not
  // verify the active-agent row. Only bounce to login for true session failures.
  if (response.status === 401) {
    const error = await response.json().catch(() => null) as TranslationApiError | null
    if (shouldRedirectToLogin(error?.reason)) {
      await clearLocalSessionAndRedirect()
    }
    throw new Error(authErrorMessage(error))
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || `Translation API error: ${response.status}`)
  }

  return response.json()
}
