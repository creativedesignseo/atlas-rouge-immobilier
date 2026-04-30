import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

const COUNTRY_TO_LANG: Record<string, SupportedLanguage> = {
  // Spanish-speaking countries
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es', GQ: 'es',
  // French-speaking countries (and Morocco — main market)
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', CA: 'fr',
  MA: 'fr', DZ: 'fr', TN: 'fr', SN: 'fr', CI: 'fr', ML: 'fr',
  CM: 'fr', BF: 'fr', NE: 'fr', TD: 'fr', MG: 'fr', CG: 'fr',
  CD: 'fr', GA: 'fr', BJ: 'fr', TG: 'fr', GN: 'fr', RW: 'fr',
  BI: 'fr', DJ: 'fr', HT: 'fr', VU: 'fr',
}

const STORAGE_KEY = 'i18nextLng'
const GEO_RESOLVED_KEY = 'atlas-rouge-geo-resolved'

export async function detectLanguageFromGeo(): Promise<SupportedLanguage | null> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const data = await response.json()
    const country = (data.country_code || data.country || '').toUpperCase()
    const lang = COUNTRY_TO_LANG[country]
    return lang || null
  } catch {
    return null
  }
}

/**
 * Resolves the user's preferred language on first visit:
 *   1. localStorage (already chosen) — skip detection
 *   2. URL path /:lang/ — i18next-browser-languagedetector handles this first
 *   3. Geo-IP country → mapped language
 *   4. Browser navigator.language
 *   5. Default 'en'
 *
 * Only runs the GeoIP call once per browser; result is cached in localStorage
 * via the standard i18nextLng key.
 */
export async function resolveInitialLanguage(currentLang: string): Promise<SupportedLanguage | null> {
  // If user already has a language chosen (URL path or previous visit), respect it.
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LANGUAGES.includes(stored.slice(0, 2) as SupportedLanguage)) {
    return null
  }

  // Already resolved geo this session — don't refetch.
  if (sessionStorage.getItem(GEO_RESOLVED_KEY)) {
    return null
  }
  sessionStorage.setItem(GEO_RESOLVED_KEY, '1')

  // If URL provided a lang, the detector already used it; skip geo override.
  const path = window.location.pathname.split('/').filter(Boolean)
  if (path[0] && SUPPORTED_LANGUAGES.includes(path[0] as SupportedLanguage)) {
    return null
  }

  const geoLang = await detectLanguageFromGeo()
  if (geoLang && geoLang !== currentLang) return geoLang
  return null
}
