import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import {
  Users,
  ClipboardCheck,
  ShieldCheck,
  Wrench,
  FileText,
  Phone,
  Check,
  ArrowRight,
  Camera,
  TrendingUp,
  MessageSquare,
  KeyRound,
  Sparkles,
  LineChart,
} from 'lucide-react'
import SectionReveal from '@/components/SectionReveal'

const services = [
  { icon: Users, key: 'tenantSearch' },
  { icon: ClipboardCheck, key: 'inventory' },
  { icon: ShieldCheck, key: 'rentGuarantee' },
  { icon: Wrench, key: 'maintenance' },
  { icon: FileText, key: 'taxFiling' },
] as const

// Short-let / conciergerie (Airbnb) management — owner-acquisition product.
// Distinct from the long-term tiers above; pricing is a tailored quote (no
// invented commission until the owner confirms real figures).
const conciergeServices = [
  { icon: Camera, key: 'listing' },
  { icon: TrendingUp, key: 'pricing' },
  { icon: MessageSquare, key: 'guests' },
  { icon: KeyRound, key: 'checkin' },
  { icon: Sparkles, key: 'cleaning' },
  { icon: LineChart, key: 'reporting' },
] as const

const pricingTiers = [
  {
    key: 'essential',
    featureKeys: ['tenantSearch', 'inventory', 'lease', 'rentCollection'],
    highlighted: false,
  },
  {
    key: 'comfort',
    featureKeys: ['essentialPack', 'rentGuarantee', 'maintenance', 'recovery'],
    highlighted: true,
  },
  {
    key: 'premium',
    featureKeys: ['comfortPack', 'taxFiling', 'damageInsurance', 'dedicatedAdvisor'],
    highlighted: false,
  },
] as const

export default function GestionLocative() {
  const { path } = useLang()
  const { t } = useTranslation('services')
  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="bg-midnight pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal y={40}>
            <h1 className="font-display text-[36px] md:text-[48px] font-medium text-white leading-[1.1] tracking-[-0.3px] mb-4">
              {t('rental.hero.title')}
            </h1>
          </SectionReveal>

          <SectionReveal y={30} delay={0.15}>
            <p className="font-inter text-[16px] md:text-[18px] text-white/70 max-w-[640px] mx-auto">
              {t('rental.hero.subtitle')}
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ SERVICES ═══════ */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <div className="text-center mb-12">
              <span className="text-terracotta text-[12px] font-inter font-medium uppercase tracking-[2px]">
                {t('rental.services.badge')}
              </span>
              <h2 className="font-display text-[28px] md:text-[36px] font-medium text-midnight mt-3 mb-3">
                {t('rental.services.heading')}
              </h2>
              <p className="font-inter text-[16px] text-text-secondary max-w-[560px] mx-auto">
                {t('rental.services.subheading')}
              </p>
            </div>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            stagger={0.1}
            y={30}
          >
            {services.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="bg-cream-warm rounded-card p-6 md:p-8 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250"
              >
                <div className="w-12 h-12 rounded-lg bg-palm/10 flex items-center justify-center mb-4">
                  <Icon size={24} className="text-palm" />
                </div>
                <h3 className="font-display text-[20px] font-semibold text-midnight mb-2">
                  {t(`rental.services.items.${key}.title`)}
                </h3>
                <p className="font-inter text-[14px] text-text-secondary leading-[1.7]">
                  {t(`rental.services.items.${key}.description`)}
                </p>
              </div>
            ))}
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section className="bg-cream-warm py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <div className="text-center mb-12">
              <h2 className="font-display text-[28px] md:text-[36px] font-medium text-midnight mb-3">
                {t('rental.pricing.heading')}
              </h2>
              <p className="font-inter text-[16px] text-text-secondary max-w-[560px] mx-auto">
                {t('rental.pricing.subheading')}
              </p>
            </div>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            stagger={0.12}
            y={40}
          >
            {pricingTiers.map((tier) => {
              const name = t(`rental.pricing.tiers.${tier.key}.name`)
              return (
                <div
                  key={tier.key}
                  className={`rounded-card p-8 ${
                    tier.highlighted
                      ? 'bg-midnight text-white shadow-lg scale-[1.02]'
                      : 'bg-white text-text-primary'
                  }`}
                >
                  <h3
                    className={`font-display text-[22px] font-semibold mb-2 ${
                      tier.highlighted ? 'text-white' : 'text-midnight'
                    }`}
                  >
                    {name}
                  </h3>
                  <div className="mb-1">
                    <span
                      className={`font-display text-[48px] font-semibold ${
                        tier.highlighted ? 'text-terracotta' : 'text-terracotta'
                      }`}
                    >
                      {t(`rental.pricing.tiers.${tier.key}.price`)}
                    </span>
                  </div>
                  <p
                    className={`font-inter text-[14px] mb-6 ${
                      tier.highlighted ? 'text-white/60' : 'text-text-secondary'
                    }`}
                  >
                    {t('rental.pricing.subtitle')}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {tier.featureKeys.map((featureKey) => (
                      <li
                        key={featureKey}
                        className={`flex items-start gap-2 font-inter text-[14px] ${
                          tier.highlighted
                            ? 'text-white/80'
                            : 'text-text-secondary'
                        }`}
                      >
                        <Check
                          size={18}
                          className={`shrink-0 mt-0.5 ${
                            tier.highlighted
                              ? 'text-terracotta'
                              : 'text-palm'
                          }`}
                        />
                        {t(`rental.pricing.tiers.${tier.key}.features.${featureKey}`)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={path('/contact')}
                    className={`flex items-center justify-center gap-2 w-full h-12 rounded-lg font-inter text-[14px] font-semibold transition-transform hover:scale-[1.02] ${
                      tier.highlighted
                        ? 'bg-terracotta text-white'
                        : 'border border-border-warm text-text-primary hover:border-terracotta hover:text-terracotta'
                    }`}
                  >
                    {t('rental.pricing.choose', { tier: name })}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )
            })}
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ CONCIERGERIE (short-let / Airbnb) ═══════ */}
      <section className="bg-midnight py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <div className="text-center mb-12">
              <span className="text-terracotta text-[12px] font-inter font-medium uppercase tracking-[2px]">
                {t('rental.concierge.badge')}
              </span>
              <h2 className="font-display text-[28px] md:text-[36px] font-medium text-white mt-3 mb-3">
                {t('rental.concierge.heading')}
              </h2>
              <p className="font-inter text-[16px] text-white/70 max-w-[620px] mx-auto">
                {t('rental.concierge.subheading')}
              </p>
            </div>
          </SectionReveal>

          <SectionReveal
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            stagger={0.1}
            y={30}
          >
            {conciergeServices.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="bg-white/5 border border-white/10 rounded-card p-6 md:p-8 hover:bg-white/[0.08] transition-colors duration-250"
              >
                <div className="w-12 h-12 rounded-lg bg-terracotta/15 flex items-center justify-center mb-4">
                  <Icon size={24} className="text-terracotta" />
                </div>
                <h3 className="font-display text-[20px] font-semibold text-white mb-2">
                  {t(`rental.concierge.items.${key}.title`)}
                </h3>
                <p className="font-inter text-[14px] text-white/70 leading-[1.7]">
                  {t(`rental.concierge.items.${key}.description`)}
                </p>
              </div>
            ))}
          </SectionReveal>

          <SectionReveal y={30} delay={0.1}>
            <div className="max-w-[720px] mx-auto mt-12 text-center">
              <h3 className="font-display text-[20px] md:text-[22px] font-semibold text-white mb-3">
                {t('rental.concierge.model.heading')}
              </h3>
              <p className="font-inter text-[15px] text-white/70 leading-[1.7] mb-8">
                {t('rental.concierge.model.body')}
              </p>
              <div className="flex flex-col items-center gap-3">
                <Link
                  to={path('/contact')}
                  className="inline-flex items-center gap-2 bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
                >
                  {t('rental.concierge.cta.button')}
                  <ArrowRight size={16} />
                </Link>
                <span className="font-inter text-[13px] text-white/50">
                  {t('rental.concierge.cta.note')}
                </span>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[800px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal y={30}>
            <h2 className="font-display text-[28px] md:text-[36px] font-medium text-midnight mb-4">
              {t('rental.cta.heading')}
            </h2>
            <p className="font-inter text-[16px] text-text-secondary mb-8 max-w-[560px] mx-auto">
              {t('rental.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={path('/contact')}
                className="inline-block bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
              >
                {t('rental.cta.appointment')}
              </Link>
              <a
                href="tel:+212524000000"
                className="inline-flex items-center gap-2 text-terracotta font-inter text-[14px] font-medium hover:underline"
              >
                <Phone size={18} />
                {t('rental.cta.phone')}
              </a>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  )
}
