import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enNav from './locales/en/nav.json'
import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import enFooter from './locales/en/footer.json'
import enProperty from './locales/en/property.json'
import enContact from './locales/en/contact.json'
import enAdmin from './locales/en/admin.json'
import enSearch from './locales/en/search.json'
import enSell from './locales/en/sell.json'

import frNav from './locales/fr/nav.json'
import frCommon from './locales/fr/common.json'
import frHome from './locales/fr/home.json'
import frFooter from './locales/fr/footer.json'
import frProperty from './locales/fr/property.json'
import frContact from './locales/fr/contact.json'
import frAdmin from './locales/fr/admin.json'
import frSearch from './locales/fr/search.json'
import frSell from './locales/fr/sell.json'

import esNav from './locales/es/nav.json'
import esCommon from './locales/es/common.json'
import esHome from './locales/es/home.json'
import esFooter from './locales/es/footer.json'
import esProperty from './locales/es/property.json'
import esContact from './locales/es/contact.json'
import esAdmin from './locales/es/admin.json'
import esSearch from './locales/es/search.json'
import esSell from './locales/es/sell.json'

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
}

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  es: '🇪🇸',
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { nav: enNav, common: enCommon, home: enHome, footer: enFooter, property: enProperty, contact: enContact, admin: enAdmin, search: enSearch, sell: enSell },
      fr: { nav: frNav, common: frCommon, home: frHome, footer: frFooter, property: frProperty, contact: frContact, admin: frAdmin, search: frSearch, sell: frSell },
      es: { nav: esNav, common: esCommon, home: esHome, footer: esFooter, property: esProperty, contact: esContact, admin: esAdmin, search: esSearch, sell: esSell },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Order: URL param first, then localStorage, then browser
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
    },
    // All resources are bundled (no remote loading), so Suspense should never
    // need to wait. Disabling explicitly avoids any chance of the Layout
    // Suspense fallback flashing during a language switch.
    react: {
      useSuspense: false,
    },
  })

export default i18n
