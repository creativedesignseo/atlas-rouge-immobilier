import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Shield, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import { buildWhatsAppLink } from '@/lib/contact'
import LanguageSwitcher from './LanguageSwitcher'

// Official WhatsApp glyph as inline SVG.
function WhatsAppIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M16.001 5.333c-5.886 0-10.667 4.781-10.667 10.667 0 1.882.494 3.71 1.434 5.32L5.333 26.667l5.487-1.421a10.62 10.62 0 0 0 5.181 1.32h.005c5.885 0 10.661-4.78 10.661-10.666 0-2.85-1.11-5.527-3.124-7.541a10.59 10.59 0 0 0-7.542-3.126Zm0 19.378h-.005a8.85 8.85 0 0 1-4.514-1.236l-.323-.193-3.347.867.893-3.262-.21-.336a8.847 8.847 0 0 1-1.355-4.731c0-4.892 3.981-8.873 8.866-8.873 2.367 0 4.59.923 6.262 2.598a8.798 8.798 0 0 1 2.594 6.281c0 4.892-3.98 8.885-8.861 8.885Zm4.86-6.65c-.267-.133-1.575-.776-1.819-.864-.244-.089-.421-.133-.598.133-.176.267-.687.864-.842 1.04-.155.178-.31.2-.577.067-.266-.133-1.124-.414-2.142-1.32-.792-.706-1.327-1.578-1.482-1.844-.155-.267-.017-.41.117-.543.12-.12.267-.31.4-.466.133-.155.178-.267.267-.444.089-.178.045-.333-.022-.466-.067-.133-.598-1.443-.82-1.977-.216-.519-.435-.448-.598-.456l-.51-.01a.978.978 0 0 0-.71.333c-.244.267-.932.91-.932 2.222 0 1.31.954 2.578 1.087 2.755.133.178 1.876 2.864 4.546 4.018.635.274 1.13.438 1.516.561.637.202 1.217.174 1.676.105.512-.076 1.575-.643 1.797-1.265.222-.622.222-1.155.155-1.265-.067-.111-.243-.178-.51-.31Z" />
    </svg>
  )
}

/**
 * Minimal editorial navbar.
 *
 * Design intent:
 * - Transparent over the hero (overlays the full-bleed image). After 60px
 *   scroll, fades to a solid cream background with a hairline bottom border.
 * - No shadow, no chrome. Whitespace and type weight do all the work.
 * - Logo set in uppercase Schibsted Grotesk with wide tracking — the "luxury
 *   wordmark" treatment used by Aman, Chrifia Hills, etc.
 * - Links uppercase tiny (12px) tracking-eyebrow. The smaller the link,
 *   the more luxe the brand reads (counter-intuitive but true).
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { lang, path } = useLang()
  const { agent, signOut } = useAuth()
  const { t } = useTranslation('nav')

  // Detect if we're on the home page — only there do we want the
  // transparent-over-hero treatment. On all other pages the navbar
  // is solid cream from the start so it doesn't collide with content.
  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { key: 'buy', href: path('/buy') },
    { key: 'rent', href: path('/rent') },
    { key: 'sell', href: path('/sell') },
    { key: 'estimate', href: path('/valuation') },
    { key: 'guides', href: path('/blog') },
  ]

  const isActive = (href: string) => pathname === href

  const handleSignOut = async () => {
    await signOut()
    setMobileOpen(false)
  }

  // Visual mode: transparent over hero (white text), or solid cream after scroll / off-home (ink text)
  const transparent = isHome && !scrolled && !mobileOpen
  const textColor = transparent ? 'text-white' : 'text-ink'
  const linkHover = transparent ? 'hover:text-white/70' : 'hover:text-terracotta'

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-premium ${
        transparent
          ? 'bg-transparent'
          : 'bg-cream-warm/95 backdrop-blur-md border-b border-border-subtle'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-[80px]">
          {/* Wordmark — uppercase, wide tracking, the "luxury silent" treatment */}
          <Link to={`/${lang}/`} className="shrink-0 group">
            <span
              className={`block font-display text-[15px] md:text-[16px] font-medium uppercase leading-none transition-colors duration-500 ${textColor}`}
              style={{ letterSpacing: '0.22em' }}
            >
              Atlas Rouge
            </span>
            <span
              className={`block font-inter text-[9px] uppercase mt-1.5 transition-colors duration-500 ${
                transparent ? 'text-white/55' : 'text-stone'
              }`}
              style={{ letterSpacing: '0.32em' }}
            >
              Immobilier · Marrakech
            </span>
          </Link>

          {/* Desktop Nav — uppercase tiny links, eyebrow tracking */}
          <nav className="hidden lg:flex items-center gap-9">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className={`font-inter text-[11px] uppercase font-medium transition-colors duration-300 ${textColor} ${linkHover} ${
                  isActive(link.href) ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                }`}
                style={{ letterSpacing: '0.18em' }}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-6">
            <LanguageSwitcher variant="navbar" />

            {agent ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 font-inter text-[11px] uppercase font-medium transition-colors ${textColor} ${linkHover}`}
                  style={{ letterSpacing: '0.16em' }}
                >
                  <Shield size={14} strokeWidth={1.5} />
                  <span>{t('admin')}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`opacity-60 hover:opacity-100 transition-opacity ${textColor}`}
                  title={t('signOut')}
                >
                  <LogOut size={14} strokeWidth={1.5} />
                </button>
              </div>
            ) : null}

            {/* WhatsApp CTA — outlined ghost on transparent, filled ink on solid */}
            <a
              href={buildWhatsAppLink(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('whatsappAria')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 font-inter text-[11px] uppercase font-medium transition-all duration-300 rounded-full ${
                transparent
                  ? 'border border-white/40 text-white hover:bg-white hover:text-ink'
                  : 'bg-ink text-cream-warm hover:bg-terracotta'
              }`}
              style={{ letterSpacing: '0.16em' }}
            >
              <WhatsAppIcon size={14} />
              <span>{t('whatsapp')}</span>
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            className={`lg:hidden p-2 transition-colors ${textColor}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[80px] z-40 bg-cream-warm">
          <div className="flex flex-col p-6 gap-1 max-w-[480px] mx-auto pt-10">
            {navLinks.map((link, idx) => (
              <Link
                key={link.key}
                to={link.href}
                className="font-display text-[28px] font-medium text-ink py-3 border-b border-border-subtle leading-none tracking-tight"
                onClick={() => setMobileOpen(false)}
                style={{ transitionDelay: `${idx * 40}ms` }}
              >
                {t(link.key)}
              </Link>
            ))}

            <div className="mt-8">
              <LanguageSwitcher variant="mobile" />
            </div>

            {agent ? (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-2 text-terracotta font-inter text-[12px] uppercase font-medium py-3 mt-4"
                  style={{ letterSpacing: '0.16em' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield size={16} />
                  {t('adminPanel')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-stone font-inter text-[12px] uppercase font-medium py-3 text-left"
                  style={{ letterSpacing: '0.16em' }}
                >
                  <LogOut size={16} />
                  {t('signOut')}
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-2 text-stone font-inter text-[12px] uppercase font-medium py-3 mt-4"
                style={{ letterSpacing: '0.16em' }}
                onClick={() => setMobileOpen(false)}
              >
                <User size={16} />
                {t('signIn')}
              </Link>
            )}

            <a
              href={buildWhatsAppLink(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('whatsappAria')}
              onClick={() => setMobileOpen(false)}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream-warm px-6 py-3.5 font-inter text-[11px] uppercase font-medium"
              style={{ letterSpacing: '0.18em' }}
            >
              <WhatsAppIcon size={16} />
              <span>{t('whatsapp')}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
