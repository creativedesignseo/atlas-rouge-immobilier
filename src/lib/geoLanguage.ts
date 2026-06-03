import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

const STORAGE_KEY = 'i18nextLng'
const GEO_RESOLVED_KEY = 'atlas-rouge-geo-resolved'

function mapToSupported(code: string | undefined | null): SupportedLanguage | null {
  if (!code) return null
  const two = code.slice(0, 2).toLowerCase()
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(two)
    ? (two as SupportedLanguage)
    : null
}

/**
 * Infer the preferred language from the browser itself (navigator.language(s)).
 *
 * GDPR/RGPD: we deliberately do NOT call any third-party geo-IP service. The
 * previous implementation fetched https://ipapi.co/json/, which transmitted the
 * visitor's IP (personal data) to a US processor on first load, before any
 * consent and with no disclosure. navigator.language never leaves the browser —
 * no network request, no PII. (Name kept for call-site compatibility.)
 */
export async function detectLanguageFromGeo(): Promise<SupportedLanguage | null> {
  if (typeof navigator === 'undefined') return null
  const candidates = [navigator.language, ...(navigator.languages || [])]
  for (const c of candidates) {
    const lang = mapToSupported(c)
    if (lang) return lang
  }
  return null
}

/**
 * Resolves the user's preferred language on first visit:
 *   1. localStorage (already chosen) — skip detection
 *   2. URL path /:lang/ — i18next-browser-languagedetector handles this first
 *   3. Browser navigator.language(s) → mapped language (no external geo-IP)
 *   4. Default 'en'
 *
 * Runs at most once per session (sessionStorage guard).
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
