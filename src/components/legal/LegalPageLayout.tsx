import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

interface LegalSection {
  id?: string
  title: string
  paragraphs: string[]
}

type LegalDocKey = 'legalNotice' | 'privacy' | 'terms'

export default function LegalPageLayout({ docKey }: { docKey: LegalDocKey }) {
  const { t } = useTranslation('legal')
  const { path } = useLang()
  const { hash } = useLocation()

  // React Router no hace scroll automático al #hash al montar (SPA) —
  // lo hacemos manualmente para que enlaces como #cookies (footer) funcionen.
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const title = t(`${docKey}.title`)
  const breadcrumb = t(`${docKey}.breadcrumb`)
  const updated = t(`${docKey}.updated`)
  const intro = t(`${docKey}.intro`, { defaultValue: '' })
  const sections = t(`${docKey}.sections`, { returnObjects: true }) as LegalSection[]

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-[760px] mx-auto px-6 lg:px-0 py-16 md:py-24">
        <nav className="flex items-center gap-2 mb-8 text-text-secondary font-inter text-[13px]">
          <Link to={path('/')} className="hover:text-terracotta transition-colors">
            {t('breadcrumbHome')}
          </Link>
          <ChevronRight size={14} />
          <span>{breadcrumb}</span>
        </nav>

        <h1 className="font-display text-[32px] md:text-[42px] font-medium text-midnight leading-[1.15] tracking-[-0.3px] mb-3">
          {title}
        </h1>
        <p className="font-inter text-[13px] text-text-secondary mb-10">{updated}</p>

        {intro ? (
          <p className="font-inter text-[16px] text-text-secondary leading-[1.8] mb-10">
            {intro}
          </p>
        ) : null}

        <div className="space-y-10">
          {sections.map((section, i) => (
            <section key={section.id ?? i} id={section.id}>
              <h2 className="font-display text-[20px] md:text-[22px] font-semibold text-midnight mb-3">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((p, pi) => (
                  <p
                    key={pi}
                    className="font-inter text-[15px] text-text-secondary leading-[1.8]"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
