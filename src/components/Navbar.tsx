import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, MapPin, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Acheter', href: '/acheter' },
  { label: 'Louer', href: '/louer' },
  { label: 'Vendre', href: '/vendre' },
  { label: 'Estimer', href: '/estimation' },
  { label: 'Guides', href: '/conseils-immobiliers' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border-warm">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-[72px] md:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex flex-col shrink-0">
            <span className="font-playfair text-[22px] font-semibold text-terracotta leading-tight">
              Atlas Rouge Immobilier
            </span>
            <span className="text-text-secondary text-[12px] font-inter">
              Immobilier Marrakech
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-text-primary font-inter text-[15px] font-medium hover:text-terracotta transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-text-secondary mr-2">
              <span className="cursor-pointer hover:text-terracotta">FR</span>
              <span className="text-border-warm">|</span>
              <span className="cursor-pointer hover:text-terracotta">EUR</span>
              <span className="text-border-warm">|</span>
              <span className="cursor-pointer hover:text-terracotta">MAD</span>
            </div>
            <Link
              to="/contact"
              className="text-text-primary font-inter text-[14px] font-medium hover:text-terracotta transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/vendre"
              className="bg-terracotta text-white font-inter text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:scale-[1.02] transition-transform"
            >
              D&eacute;poser une annonce
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
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
                key={link.href}
                to={link.href}
                className="text-text-primary font-inter text-[16px] font-medium py-3 border-b border-border-warm"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 text-[14px] text-text-secondary pt-4">
              <span className="cursor-pointer">FR</span>
              <span>|</span>
              <span className="cursor-pointer">EUR</span>
              <span>|</span>
              <span className="cursor-pointer">MAD</span>
            </div>
            <Link
              to="/contact"
              className="text-text-primary font-inter text-[14px] font-medium py-3"
              onClick={() => setMobileOpen(false)}
            >
              Se connecter
            </Link>
            <Link
              to="/vendre"
              className="bg-terracotta text-white font-inter text-[14px] font-semibold px-5 py-3 rounded-lg text-center mt-2"
              onClick={() => setMobileOpen(false)}
            >
              D&eacute;poser une annonce
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
