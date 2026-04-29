import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

/**
 * Returns the current language from the URL param (or i18n fallback),
 * and a `path()` helper to prefix any route with the current lang.
 *
 * Works both inside /:lang routes AND in admin routes (no lang param).
 */
export function useLang() {
  const { lang } = useParams<{ lang?: string }>()
  const { i18n } = useTranslation()

  const current: SupportedLanguage =
    lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
      ? (lang as SupportedLanguage)
      : ((i18n.language?.slice(0, 2) as SupportedLanguage) ?? 'en')

  const path = (url: string) =>
    `/${current}${url.startsWith('/') ? url : '/' + url}`

  return { lang: current, path }
}
