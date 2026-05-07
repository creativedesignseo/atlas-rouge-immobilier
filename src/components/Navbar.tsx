import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Shield, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import LanguageSwitcher from './LanguageSwitcher'

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

            <Link
              to={path('/sell')}
              className="bg-terracotta text-white font-inter text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:scale-[1.02] transition-transform"
            >
              {t('listProperty')}
            </Link>
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

            <Link
              to={path('/sell')}
              className="bg-terracotta text-white font-inter text-[14px] font-semibold px-5 py-3 rounded-lg text-center mt-2"
              onClick={() => setMobileOpen(false)}
            >
              {t('listProperty')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
