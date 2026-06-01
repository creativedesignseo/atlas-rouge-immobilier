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
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const response = await fetch('/.netlify/functions/translate-property', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sourceLang, content }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || `Translation API error: ${response.status}`)
  }

  return response.json()
}
