import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS, type SupportedLanguage } from '@/i18n'

interface Props {
  variant?: 'navbar' | 'mobile' | 'admin'
}

export default function LanguageSwitcher({ variant = 'navbar' }: Props) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguage) || 'en'

  const switchLanguage = (lang: SupportedLanguage) => {
    if (lang === currentLang) return

    // Replace the lang prefix in the URL
    // /en/property/villa → /fr/property/villa
    const segments = pathname.split('/').filter(Boolean)
    if (SUPPORTED_LANGUAGES.includes(segments[0] as SupportedLanguage)) {
      segments[0] = lang
    } else {
      segments.unshift(lang)
    }
    const newPath = '/' + segments.join('/')
    i18n.changeLanguage(lang)
    navigate(newPath, { replace: true })
  }

  if (variant === 'admin') {
    return (
      <div className="flex items-center gap-1 bg-midnight/10 rounded-lg p-1">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => switchLanguage(lang)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              currentLang === lang
                ? 'bg-white text-midnight shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{LANGUAGE_FLAGS[lang]}</span>
            <span className="uppercase">{lang}</span>
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-3 text-[14px] text-text-secondary pt-4">
        {SUPPORTED_LANGUAGES.map((lang, i) => (
          <span key={lang} className="flex items-center gap-3">
            <button
              onClick={() => switchLanguage(lang)}
              className={`flex items-center gap-1 transition-colors ${
                currentLang === lang ? 'text-terracotta font-semibold' : 'hover:text-terracotta'
              }`}
            >
              <span>{LANGUAGE_FLAGS[lang]}</span>
              <span className="uppercase">{lang}</span>
            </button>
            {i < SUPPORTED_LANGUAGES.length - 1 && <span className="text-border-warm">|</span>}
          </span>
        ))}
      </div>
    )
  }

  // navbar variant
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
      {SUPPORTED_LANGUAGES.map((lang, i) => (
        <span key={lang} className="flex items-center gap-1.5">
          <button
            onClick={() => switchLanguage(lang)}
            className={`flex items-center gap-1 transition-colors ${
              currentLang === lang ? 'text-terracotta font-semibold' : 'hover:text-terracotta'
            }`}
          >
            <span>{LANGUAGE_FLAGS[lang]}</span>
            <span className="uppercase">{lang}</span>
          </button>
          {i < SUPPORTED_LANGUAGES.length - 1 && (
            <span className="text-border-warm">|</span>
          )}
        </span>
      ))}
    </div>
  )
}
