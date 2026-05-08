import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Shield, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import { buildWhatsAppLink } from '@/lib/contact'
import LanguageSwitcher from './LanguageSwitcher'

// Official WhatsApp glyph as inline SVG (Lucide doesn't ship one).
// Crisp at any size, inherits currentColor for the foreground.
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

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { lang, path } = useLang()
  const { agent, signOut } = useAuth()
  const { t } = useTranslation('nav')

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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border-warm">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to={`/${lang}/`} className="flex flex-col shrink-0">
            <span className="font-playfair text-[22px] font-semibold text-terracotta leading-tight">
              Atlas Rouge Immobilier
            </span>
            <span className="text-text-secondary text-[12px] font-inter">
              {t('tagline')}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className={`font-inter text-[15px] font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-terracotta'
                    : 'text-text-primary hover:text-terracotta'
                }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher variant="navbar" />

            {agent ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-text-primary font-inter text-[14px] font-medium hover:text-terracotta transition-colors"
                >
                  <Shield size={16} />
                  <span>{t('admin')}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-text-secondary font-inter text-[14px] hover:text-red-600 transition-colors"
                  title={t('signOut')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-1.5 text-text-primary font-inter text-[14px] font-medium hover:text-terracotta transition-colors"
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
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-inter text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(37,211,102,0.25)] transition-all duration-200 hover:bg-[#1da851] hover:shadow-[0_4px_14px_rgba(37,211,102,0.4)] hover:-translate-y-px"
            >
              <WhatsAppIcon size={17} />
              <span>{t('whatsapp')}</span>
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[64px] z-40 bg-white">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className="text-text-primary font-inter text-[16px] font-medium py-3 border-b border-border-warm"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}

            <LanguageSwitcher variant="mobile" />

            {agent ? (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-2 text-terracotta font-inter text-[14px] font-medium py-3"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield size={18} />
                  {t('adminPanel')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 font-inter text-[14px] font-medium py-3 text-left"
                >
                  <LogOut size={18} />
                  {t('signOut')}
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-2 text-text-primary font-inter text-[14px] font-medium py-3"
                onClick={() => setMobileOpen(false)}
              >
                <User size={18} />
                {t('signIn')}
              </Link>
            )}

            <a
              href={buildWhatsAppLink(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('whatsappAria')}
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 font-inter text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all duration-200 hover:bg-[#1da851]"
            >
              <WhatsAppIcon size={18} />
              <span>{t('whatsapp')}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
