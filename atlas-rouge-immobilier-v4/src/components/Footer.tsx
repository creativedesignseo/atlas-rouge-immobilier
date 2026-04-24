import { Link } from 'react-router-dom'

const footerColumns = [
  {
    title: 'Aide & Contact',
    links: [
      { label: 'Nous contacter', href: '/contact' },
      { label: 'Questions fr\u00E9quentes', href: '#' },
      { label: 'Guide d\u2019achat', href: '/guide-achat-maroc' },
      { label: 'Conseils immobiliers', href: '/conseils-immobiliers' },
    ],
  },
  {
    title: '\u00C0 propos',
    links: [
      { label: 'Qui sommes-nous ?', href: '/a-propos' },
      { label: 'Nos agences', href: '/contact' },
      { label: 'Recrutement', href: '#' },
      { label: 'Presse', href: '#' },
    ],
  },
  {
    title: 'Nos applications',
    links: [
      { label: 'Application iOS', href: '#' },
      { label: 'Application Android', href: '#' },
      { label: 'Alertes e-mail', href: '#' },
    ],
  },
  {
    title: 'Informations l\u00E9gales',
    links: [
      { label: 'Mentions l\u00E9gales', href: '#' },
      { label: 'CGU / CGV', href: '#' },
      { label: 'Politique de confidentialit\u00E9', href: '#' },
      { label: 'Gestion des cookies', href: '#' },
    ],
  },
]

const socialLinks = [
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'YouTube', href: '#' },
]

export default function Footer() {
  return (
    <footer className="bg-midnight text-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-16">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="font-inter text-[14px] font-semibold mb-4 text-white">
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-white/60 text-[14px] font-inter hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <h4 className="font-inter text-[14px] font-semibold mb-4 text-white">
              Suivez-nous
            </h4>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/60 text-[14px] font-inter hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-playfair text-[18px] font-semibold text-terracotta">
                Atlas Rouge
              </span>
              <span className="text-white/40 text-[12px]">|</span>
              <span className="text-white/40 text-[13px] font-inter">
                Immobilier Marrakech
              </span>
            </div>
            <p className="text-white/40 text-[13px] font-inter text-center">
              &copy; 2025 Atlas Rouge Immobilier. Tous droits r&eacute;serv&eacute;s.
            </p>
            <div className="flex items-center gap-3 text-[12px] text-white/40">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>PayPal</span>
              <span>SSL</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
