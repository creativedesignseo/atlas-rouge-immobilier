import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type SupportedLanguage } from '@/i18n'
import { translatePath } from '@/lib/routes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'navbar' | 'mobile' | 'admin'
}

function RoundFlag({ lang }: { lang: SupportedLanguage }) {
  if (lang === 'fr') {
    return (
      <span className="grid size-6 overflow-hidden rounded-full border border-black/10 shadow-sm">
        <span className="flex h-full w-full">
          <span className="flex-1 bg-[#1f4fa3]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#e33b4d]" />
        </span>
      </span>
    )
  }

  if (lang === 'es') {
    return (
      <span className="grid size-6 overflow-hidden rounded-full border border-black/10 shadow-sm">
        <span className="flex h-full w-full flex-col">
          <span className="h-1/4 bg-[#c82232]" />
          <span className="h-1/2 bg-[#f4c430]" />
          <span className="h-1/4 bg-[#c82232]" />
        </span>
      </span>
    )
  }

  return (
    <span className="grid size-6 overflow-hidden rounded-full border border-black/10 bg-[#17336f] shadow-sm">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full">
        <rect width="24" height="24" fill="#17336f" />
        <path d="M-2 2 22 26M26 2 2 26" stroke="#fff" strokeWidth="5" />
        <path d="M-2 2 22 26M26 2 2 26" stroke="#c8203a" strokeWidth="2.4" />
        <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="7" />
        <path d="M12 0v24M0 12h24" stroke="#c8203a" strokeWidth="4" />
      </svg>
    </span>
  )
}

export default function LanguageSwitcher({ variant = 'navbar' }: Props) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguage) || 'en'

  const switchLanguage = (lang: SupportedLanguage) => {
    if (lang === currentLang) return

    // Admin variant: only change i18n locale, no URL navigation
    // (admin routes are not language-prefixed).
    if (variant === 'admin') {
      i18n.changeLanguage(lang)
      return
    }

    // translatePath also re-translates known slugs (vendre→vender, acheter→comprar, etc.)
    // so users stay on the same page when switching language.
    const newPath = translatePath(pathname, lang)
    i18n.changeLanguage(lang)
    navigate(newPath, { replace: true })
  }

  const triggerClassName = cn(
    'inline-flex items-center gap-2 rounded-full border border-border-warm bg-white text-text-primary shadow-sm transition-colors hover:border-terracotta/50 hover:text-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/30',
    variant === 'admin' ? 'h-9 px-3 text-sm' : 'h-9 px-2.5 text-[13px]',
    variant === 'mobile' && 'h-10 px-3 text-sm'
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={triggerClassName} aria-label="Change language">
          <RoundFlag lang={currentLang} />
          <span className="font-medium uppercase">{currentLang}</span>
          <ChevronDown size={14} className="text-text-secondary" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] rounded-xl border-border-warm bg-white p-1.5 shadow-xl">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => switchLanguage(lang)}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm"
          >
            <RoundFlag lang={lang} />
            <span className="flex-1">{LANGUAGE_NAMES[lang]}</span>
            <span className="text-xs font-semibold uppercase text-text-secondary">{lang}</span>
            {currentLang === lang && <Check size={15} className="text-terracotta" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
