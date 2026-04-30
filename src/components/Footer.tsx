import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { lang = 'en' } = useParams<{ lang: string }>()
  const { t } = useTranslation('footer')
  const { t: tc } = useTranslation('common')

  const footerColumns = [
    {
      titleKey: 'helpContact',
      links: [
        { labelKey: 'contactUs', href: `/${lang}/contact` },
        { labelKey: 'faq', href: '#' },
        { labelKey: 'buyersGuide', href: `/${lang}/guide-achat-maroc` },
        { labelKey: 'realEstateAdvice', href: `/${lang}/conseils-immobiliers` },
      ],
    },
    {
      titleKey: 'about',
      links: [
        { labelKey: 'whoWeAre', href: `/${lang}/a-propos` },
        { labelKey: 'ourAgencies', href: `/${lang}/contact` },
        { labelKey: 'recruitment', href: '#' },
        { labelKey: 'press', href: '#' },
      ],
    },
    {
      titleKey: 'ourApps',
      links: [
        { labelKey: 'iosApp', href: '#' },
        { labelKey: 'androidApp', href: '#' },
        { labelKey: 'emailAlerts', href: '#' },
      ],
    },
    {
      titleKey: 'legal',
      links: [
        { labelKey: 'legalNotice', href: '#' },
        { labelKey: 'terms', href: '#' },
        { labelKey: 'privacy', href: '#' },
        { labelKey: 'cookies', href: '#' },
      ],
    },
  ]

  const socialLinks = [
    { label: 'Instagram', href: '#' },
    { label: 'Facebook', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'YouTube', href: '#' },
  ]

  return (
    <footer className="bg-midnight text-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {footerColumns.map((column) => (
            <div key={column.titleKey}>
              <h4 className="font-inter text-[14px] font-semibold mb-4 text-white">
                {t(column.titleKey)}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      to={link.href}
                      className="text-white/60 text-[14px] font-inter hover:text-white transition-colors"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-inter text-[14px] font-semibold mb-4 text-white">
              {t('followUs')}
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

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-playfair text-[18px] font-semibold text-terracotta">
                Atlas Rouge
              </span>
              <span className="text-white/40 text-[12px]">|</span>
              <span className="text-white/40 text-[13px] font-inter">
                {tc('tagline')}
              </span>
            </div>
            <p className="text-white/40 text-[13px] font-inter text-center">
              {tc('copyright', { year: new Date().getFullYear() })}
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
