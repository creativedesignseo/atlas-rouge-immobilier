import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import {
  UserCheck,
  BadgeCheck,
  Clock,
  Handshake,
  FileText,
  Search,
  Send,
  Phone,
} from 'lucide-react'
import SectionReveal from '@/components/SectionReveal'

export default function Estimation() {
  const { t } = useTranslation('estimation')
  const { path } = useLang()
  const [expertForm, setExpertForm] = useState({
    name: '',
    phone: '',
    date: '',
  })

  const steps = [
    {
      number: '1',
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
      icon: FileText,
    },
    {
      number: '2',
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
      icon: Search,
    },
    {
      number: '3',
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
      icon: Send,
    },
  ]

  const trustElements = [
    { icon: BadgeCheck, label: t('trust.free') },
    { icon: Handshake, label: t('trust.noCommitment') },
    { icon: Clock, label: t('trust.result24h') },
  ]

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="bg-midnight pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal y={40}>
            <h1 className="font-playfair text-[36px] md:text-[48px] font-medium text-white leading-[1.1] tracking-[-0.3px] mb-4">
              {t('hero.title')}
            </h1>
          </SectionReveal>

          <SectionReveal y={30} delay={0.15}>
            <p className="font-inter text-[16px] md:text-[18px] text-white/70 max-w-[600px] mx-auto mb-8">
              {t('hero.subtitle')}
            </p>
          </SectionReveal>

          {/* Trust badges */}
          <SectionReveal
            className="flex items-center justify-center gap-6 md:gap-10"
            delay={0.3}
            stagger={0.1}
          >
            {trustElements.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-white/70"
              >
                <Icon size={20} className="text-terracotta" />
                <span className="font-inter text-[14px]">{label}</span>
              </div>
            ))}
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ EXPERT CTA CARD ═══════ */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-[560px] mx-auto px-6 lg:px-12">
          <div className="bg-cream-warm rounded-card p-8">
            <div className="w-12 h-12 rounded-lg bg-palm/10 flex items-center justify-center mb-5">
              <UserCheck size={24} className="text-palm" />
            </div>
            <h2 className="font-playfair text-[24px] font-medium text-midnight mb-2">
              {t('expert.title')}
            </h2>
            <p className="font-inter text-[14px] text-text-secondary mb-6">
              {t('expert.subtitle')}
            </p>

            <form className="space-y-4">
              <div>
                <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                  {t('expert.nameLabel')}
                </label>
                <input
                  type="text"
                  value={expertForm.name}
                  onChange={(e) =>
                    setExpertForm((s) => ({ ...s, name: e.target.value }))
                  }
                  className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                  placeholder={t('expert.namePlaceholder')}
                />
              </div>

              <div>
                <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                  {t('expert.phoneLabel')}
                </label>
                <input
                  type="tel"
                  value={expertForm.phone}
                  onChange={(e) =>
                    setExpertForm((s) => ({ ...s, phone: e.target.value }))
                  }
                  className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                  placeholder={t('expert.phonePlaceholder')}
                />
              </div>

              <div>
                <label className="block font-inter text-[13px] font-medium text-text-primary mb-1.5">
                  {t('expert.dateLabel')}
                </label>
                <input
                  type="date"
                  value={expertForm.date}
                  onChange={(e) =>
                    setExpertForm((s) => ({ ...s, date: e.target.value }))
                  }
                  className="w-full h-12 px-4 border border-border-warm rounded-lg font-inter text-[14px] focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/20 transition-colors"
                />
              </div>

              <button
                type="button"
                className="w-full h-12 bg-palm text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-transform"
              >
                {t('expert.submit')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════ STEPS ═══════ */}
      <section className="bg-cream-warm py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight text-center mb-12">
              {t('steps.heading')}
            </h2>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            stagger={0.12}
            y={40}
          >
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div
                key={number}
                className="bg-white rounded-card p-8 text-center hover:shadow-card-hover transition-shadow duration-250"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-terracotta/10 flex items-center justify-center">
                  <Icon size={24} className="text-terracotta" />
                </div>
                <span className="inline-block w-8 h-8 rounded-full bg-terracotta text-white font-inter text-[14px] font-semibold leading-8 mb-3">
                  {number}
                </span>
                <h3 className="font-playfair text-[20px] font-semibold text-midnight mb-2">
                  {title}
                </h3>
                <p className="font-inter text-[14px] text-text-secondary leading-[1.7]">
                  {description}
                </p>
              </div>
            ))}
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[800px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal y={30}>
            <h2 className="font-playfair text-[28px] md:text-[36px] font-medium text-midnight mb-4">
              {t('cta.title')}
            </h2>
            <p className="font-inter text-[16px] text-text-secondary mb-8 max-w-[560px] mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={path('/contact')}
                className="inline-block bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
              >
                {t('cta.contact')}
              </Link>
              <a
                href="tel:+212524000000"
                className="inline-flex items-center gap-2 text-terracotta font-inter text-[14px] font-medium hover:underline"
              >
                <Phone size={18} />
                +212 524 00 00 00
              </a>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  )
}
