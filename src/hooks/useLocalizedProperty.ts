import { useTranslation } from 'react-i18next'
import type { PropertyRow } from '@/types/supabase'
import type { SupportedLanguage } from '@/i18n'

/**
 * Returns the localized title, description and highlights for a property.
 * Falls back to French if the requested language is not available,
 * then falls back to the base `title` / `description` / `highlights` fields.
 */
export function useLocalizedProperty(property: PropertyRow | null | undefined) {
  const { i18n } = useTranslation()
  const lang = (i18n.language?.slice(0, 2) as SupportedLanguage) || 'en'

  if (!property) return { title: '', description: '', highlights: [] as string[] }

  const title =
    property[`title_${lang}` as keyof PropertyRow] as string ||
    property.title_fr ||
    property.title

  const description =
    property[`description_${lang}` as keyof PropertyRow] as string ||
    property.description_fr ||
    property.description

  const highlights =
    (property[`highlights_${lang}` as keyof PropertyRow] as string[] | null)?.length
      ? (property[`highlights_${lang}` as keyof PropertyRow] as string[])
      : property.highlights_fr?.length
      ? property.highlights_fr
      : property.highlights

  return { title, description, highlights }
}
