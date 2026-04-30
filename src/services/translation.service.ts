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
  const response = await fetch('/.netlify/functions/translate-property', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sourceLang, content }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || `Translation API error: ${response.status}`)
  }

  return response.json()
}
