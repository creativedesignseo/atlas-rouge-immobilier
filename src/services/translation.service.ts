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

export async function autoTranslateProperty(
  content: TranslatableProperty,
  sourceLang: SupportedLanguage
): Promise<Partial<Record<SupportedLanguage, TranslatedPropertyContent>>> {
  // Admin-only endpoint — attach the current Supabase session so the function
  // can reject anonymous callers (it validates the Bearer token server-side).
  // getSession() can hang on a stuck Navigator Lock (e.g. multiple tabs); race
  // it against a short timeout so a token glitch never freezes the UI forever.
  const session = await Promise.race([
    supabase.auth.getSession().then((r) => r.data.session),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
  ])
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

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

  // 401 = the session is invalid/revoked server-side (the JWT may still look
  // valid locally). Self-heal: clear the dead session and send the user to log
  // in again, instead of leaving them stuck on an error they can't fix.
  if (response.status === 401) {
    try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      try { window.localStorage.clear() } catch { /* ignore */ }
      window.location.href = '/admin/login'
    }
    throw new Error('Tu sesión caducó. Te llevamos a iniciar sesión de nuevo.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || `Translation API error: ${response.status}`)
  }

  return response.json()
}
