import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'
import { ROUTES, findKeyBySlug, type RouteKey } from '@/lib/routes'

/**
 * Returns the current language from the URL param (or i18n fallback),
 * and a `path()` helper that builds a URL prefixed with the current lang
 * AND auto-translates the first slug segment to the current language.
 *
 * The first segment is matched either as:
 * - a canonical route key  (e.g. path('/sell')   → /es/vender)
 * - a slug in any language (e.g. path('/vendre') → /es/vender)
 *
 * Subsequent segments (dynamic IDs, slugs) are passed through untouched.
 * Hash and query strings are preserved.
 */
export function useLang() {
  const { lang } = useParams<{ lang?: string }>()
  const { i18n } = useTranslation()

  const current: SupportedLanguage =
    lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
      ? (lang as SupportedLanguage)
      : ((i18n.language?.slice(0, 2) as SupportedLanguage) ?? 'en')

  const path = (input: string): string => {
    // Strip leading slash. Empty input → home.
    const raw = input.startsWith('/') ? input.slice(1) : input
    if (!raw) return `/${current}/`

    // Split off hash/query so they can be reattached at the end.
    const hashIdx = raw.indexOf('#')
    const queryIdx = raw.indexOf('?')
    const splitIdx = [hashIdx, queryIdx].filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1
    const tail = splitIdx >= 0 ? raw.slice(splitIdx) : ''
    const pathPart = splitIdx >= 0 ? raw.slice(0, splitIdx) : raw

    const segments = pathPart.split('/').filter(Boolean)
    if (segments.length === 0) return `/${current}/${tail}`

    // Translate the first segment when possible. Try canonical key first,
    // then fall back to a slug-from-any-language lookup.
    const first = segments[0]
    if (first in ROUTES) {
      segments[0] = ROUTES[first as RouteKey][current]
    } else {
      const key = findKeyBySlug(first)
      if (key) segments[0] = ROUTES[key][current]
    }

    return `/${current}/${segments.join('/')}${tail}`
  }

  return { lang: current, path }
}
