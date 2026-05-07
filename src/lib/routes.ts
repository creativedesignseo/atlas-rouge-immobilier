import type { SupportedLanguage } from '@/i18n'

// Canonical route keys → URL slug for each supported language.
// Source of truth for all localized URLs across the public site.
export const ROUTES = {
  buy: { fr: 'acheter', es: 'comprar', en: 'buy' },
  rent: { fr: 'louer', es: 'alquilar', en: 'rent' },
  sell: { fr: 'vendre', es: 'vender', en: 'sell' },
  propertyDetail: { fr: 'property', es: 'propiedad', en: 'property' },
  buyerGuide: { fr: 'guide-achat-maroc', es: 'guia-compra-marruecos', en: 'buying-guide-morocco' },
  blog: { fr: 'conseils-immobiliers', es: 'consejos-inmobiliarios', en: 'real-estate-tips' },
  about: { fr: 'a-propos', es: 'sobre-nosotros', en: 'about' },
  contact: { fr: 'contact', es: 'contacto', en: 'contact' },
  favorites: { fr: 'favoris', es: 'favoritos', en: 'favorites' },
  valuation: { fr: 'estimation', es: 'valoracion', en: 'valuation' },
  propertyManagement: { fr: 'gestion-locative', es: 'gestion-alquileres', en: 'property-management' },
  valuationStart: { fr: 'estimer', es: 'valorar', en: 'value' },
} as const

export type RouteKey = keyof typeof ROUTES

export function getSlug(key: RouteKey, lang: SupportedLanguage): string {
  return ROUTES[key][lang]
}

// Returns the unique slugs for a route across all languages.
// Used by App.tsx to register every localized variant as a valid route.
export function getAllSlugsForKey(key: RouteKey): string[] {
  const slugs = Object.values(ROUTES[key])
  return Array.from(new Set(slugs))
}

// Reverse index: any language slug → canonical key.
const SLUG_TO_KEY = new Map<string, RouteKey>()
for (const [key, langMap] of Object.entries(ROUTES)) {
  for (const slug of Object.values(langMap)) {
    if (slug) SLUG_TO_KEY.set(slug, key as RouteKey)
  }
}

export function findKeyBySlug(slug: string): RouteKey | undefined {
  return SLUG_TO_KEY.get(slug)
}

/**
 * Re-translate a full pathname into the target language.
 * Used by LanguageSwitcher so that switching language keeps the user on the
 * same page rather than redirecting to home.
 *
 * Example: translatePath('/fr/vendre/abc#x', 'es') → '/es/vender/abc#x'
 */
export function translatePath(pathname: string, targetLang: SupportedLanguage): string {
  const hashIdx = pathname.indexOf('#')
  const queryIdx = pathname.indexOf('?')
  const splitIdx = [hashIdx, queryIdx].filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1
  const tail = splitIdx >= 0 ? pathname.slice(splitIdx) : ''
  const pathPart = splitIdx >= 0 ? pathname.slice(0, splitIdx) : pathname

  const segments = pathPart.split('/').filter(Boolean)
  if (segments.length === 0) return `/${targetLang}/${tail}`

  // Drop existing lang segment if present so we control its position.
  const SUPPORTED = ['fr', 'es', 'en']
  if (SUPPORTED.includes(segments[0])) segments.shift()

  // Translate any segment that's a known slug; preserve dynamic segments
  // (slugs not in our route table — eg. property slugs, query params).
  const translated = segments.map((seg) => {
    const key = findKeyBySlug(seg)
    return key ? ROUTES[key][targetLang] : seg
  })

  return `/${targetLang}/${translated.join('/')}${tail}`
}
