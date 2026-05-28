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
import enAbout from './locales/en/about.json'
import enBlog from './locales/en/blog.json'
import enEstimation from './locales/en/estimation.json'
import enServices from './locales/en/services.json'
import enAmenities from './locales/en/amenities.json'
import enErrors from './locales/en/errors.json'
import enBuyerGuide from './locales/en/buyerGuide.json'

import frNav from './locales/fr/nav.json'
import frCommon from './locales/fr/common.json'
import frHome from './locales/fr/home.json'
import frFooter from './locales/fr/footer.json'
import frProperty from './locales/fr/property.json'
import frContact from './locales/fr/contact.json'
import frAdmin from './locales/fr/admin.json'
import frSearch from './locales/fr/search.json'
import frSell from './locales/fr/sell.json'
import frAbout from './locales/fr/about.json'
import frBlog from './locales/fr/blog.json'
import frEstimation from './locales/fr/estimation.json'
import frServices from './locales/fr/services.json'
import frAmenities from './locales/fr/amenities.json'
import frErrors from './locales/fr/errors.json'
import frBuyerGuide from './locales/fr/buyerGuide.json'

import esNav from './locales/es/nav.json'
import esCommon from './locales/es/common.json'
import esHome from './locales/es/home.json'
import esFooter from './locales/es/footer.json'
import esProperty from './locales/es/property.json'
import esContact from './locales/es/contact.json'
import esAdmin from './locales/es/admin.json'
import esSearch from './locales/es/search.json'
import esSell from './locales/es/sell.json'
import esAbout from './locales/es/about.json'
import esBlog from './locales/es/blog.json'
import esEstimation from './locales/es/estimation.json'
import esServices from './locales/es/services.json'
import esAmenities from './locales/es/amenities.json'
import esErrors from './locales/es/errors.json'
import esBuyerGuide from './locales/es/buyerGuide.json'

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
      en: {
        nav: enNav, common: enCommon, home: enHome, footer: enFooter,
        property: enProperty, contact: enContact, admin: enAdmin, search: enSearch,
        sell: enSell, about: enAbout, blog: enBlog, estimation: enEstimation,
        services: enServices, amenities: enAmenities, errors: enErrors,
        buyerGuide: enBuyerGuide,
      },
      fr: {
        nav: frNav, common: frCommon, home: frHome, footer: frFooter,
        property: frProperty, contact: frContact, admin: frAdmin, search: frSearch,
        sell: frSell, about: frAbout, blog: frBlog, estimation: frEstimation,
        services: frServices, amenities: frAmenities, errors: frErrors,
        buyerGuide: frBuyerGuide,
      },
      es: {
        nav: esNav, common: esCommon, home: esHome, footer: esFooter,
        property: esProperty, contact: esContact, admin: esAdmin, search: esSearch,
        sell: esSell, about: esAbout, blog: esBlog, estimation: esEstimation,
        services: esServices, amenities: esAmenities, errors: esErrors,
        buyerGuide: esBuyerGuide,
      },
    },
    defaultNS: 'common',
    // Fallback francés: idioma base del proyecto (cliente francés, contenido
    // original FR). Si una clave falta en ES o EN, vemos francés, NUNCA
    // inglés (que era el bug recurrente reportado).
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // URL primero — la SPA está organizada por /:lang/ y eso debe ganar.
      // Eliminado localStorage: cuando un visitante venía de un share link
      // /es/... y tenía 'en' cacheado de visita anterior, el cache pisaba
      // la URL → idioma inconsistente. La URL es la verdad única.
      order: ['path', 'navigator'],
      lookupFromPathIndex: 0,
      caches: [], // no cachear — confiar solo en URL + browser
    },
    // All resources are bundled (no remote loading), so Suspense should never
    // need to wait. Disabling explicitly avoids any chance of the Layout
    // Suspense fallback flashing during a language switch.
    react: {
      useSuspense: false,
    },
  })

export default i18n
