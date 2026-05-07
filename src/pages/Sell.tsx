import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Upload,
  Users,
  Check,
  MapPin,
  ChevronDown,
  Star,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/* ── FAQ keys (content resolved at render time via t()) ── */
const faqKeys = ['estimation', 'duration', 'documents', 'remote', 'fees', 'signing'] as const

/* ── Filter option keys (labels resolved via t() at render) ── */
const specialtyKeys = ['sale', 'rent', 'new'] as const
const typeKeys = ['villa', 'apartment', 'riad', 'prestige'] as const

/* ── Agent mock data — specialties and locations stored as i18n-friendly keys ── */
const agents = [
  {
    name: 'Immobilière Palmeraie',
    rating: 4.8,
    properties: 47,
    specialties: ['sale', 'villa', 'prestige'],
    location: 'Palmeraie, Marrakech',
    initials: 'IP',
  },
  {
    name: 'Médina Immobilier',
    rating: 4.7,
    properties: 32,
    specialties: ['sale', 'riad', 'rent'],
    location: 'Médina, Marrakech',
    initials: 'MI',
  },
  {
    name: 'Gueliz Properties',
    rating: 4.6,
    properties: 65,
    specialties: ['sale', 'apartment', 'new'],
    location: 'Guéliz, Marrakech',
    initials: 'GP',
  },
  {
    name: 'Hivernage Prestige',
    rating: 4.9,
    properties: 28,
    specialties: ['sale', 'prestige', 'rent'],
    location: 'Hivernage, Marrakech',
    initials: 'HP',
  },
  {
    name: 'Atlas Golf Immobilier',
    rating: 4.7,
    properties: 41,
    specialties: ['sale', 'villa', 'rent'],
    location: 'Amelkis, Marrakech',
    initials: 'AG',
  },
  {
    name: 'Ourika Valley Homes',
    rating: 4.5,
    properties: 19,
    specialties: ['sale', 'villa'],
    location: 'Route de l’Ourika, Marrakech',
    initials: 'OV',
  },
]

/* ── How it works steps (labels resolved via i18n at render time) ── */
const stepNumbers = ['01', '02', '03', '04'] as const

/* ── FAQ Accordion Item ── */
function FaqItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className="border-b border-border-warm">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="font-inter text-[16px] font-medium text-midnight pr-4">
          {question}
        </span>
        <ChevronDown
          size={20}
          className={cn(
            'text-text-secondary shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        ref={contentRef}
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
        )}
      >
        <p className="font-inter text-[15px] text-text-secondary leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  )
}

/* ── Main Component ── */
export default function Sell() {
  const { path } = useLang()
  const { t } = useTranslation('sell')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const heroRef = useRef<HTMLDivElement>(null)
  const featureCardsRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const agentSearchRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)

  /* Hero animations */
  useGSAP(
    () => {
      if (!heroRef.current) return
      const tl = gsap.timeline()
      tl.from(heroRef.current!.querySelector('.hero-title'), {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.1,
      })
        .from(
          heroRef.current!.querySelector('.hero-subtitle'),
          { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.45'
        )
        .from(
          heroRef.current!.querySelector('.hero-buttons'),
          { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' },
          '-=0.35'
        )
    },
    { scope: heroRef }
  )

  /* Feature cards animation */
  useGSAP(
    () => {
      if (!featureCardsRef.current) return
      gsap.from(featureCardsRef.current!.querySelectorAll('.feature-card'), {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: featureCardsRef.current,
          start: 'top 85%',
          once: true,
        },
      })
      gsap.from(
        featureCardsRef.current!.querySelectorAll('.feature-check'),
        {
          opacity: 0,
          x: -10,
          duration: 0.4,
          stagger: 0.06,
          delay: 0.5,
          scrollTrigger: {
            trigger: featureCardsRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      )
    },
    { scope: featureCardsRef }
  )

  /* How it works animation */
  useGSAP(
    () => {
      if (!howItWorksRef.current) return
      gsap.from(howItWorksRef.current!.querySelector('.hiw-title'), {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: 'top 85%',
          once: true,
        },
      })
      gsap.from(howItWorksRef.current!.querySelectorAll('.hiw-step'), {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: howItWorksRef }
  )

  /* Agent search animation */
  useGSAP(
    () => {
      if (!agentSearchRef.current) return
      gsap.from(agentSearchRef.current!.querySelector('.agent-title'), {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: agentSearchRef.current,
          start: 'top 85%',
          once: true,
        },
      })
      gsap.from(agentSearchRef.current!.querySelectorAll('.agent-card'), {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: agentSearchRef.current!.querySelector('.agent-grid'),
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: agentSearchRef }
  )

  /* FAQ animation */
  useGSAP(
    () => {
      if (!faqRef.current) return
      gsap.from(faqRef.current!.querySelector('.faq-title'), {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: faqRef.current,
          start: 'top 85%',
          once: true,
        },
      })
      gsap.from(faqRef.current!.querySelectorAll('.faq-item'), {
        y: 15,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: faqRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: faqRef }
  )

  /* Filtered agents — filters compare against language-stable keys */
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      !searchQuery ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSpecialty =
      !specialtyFilter || agent.specialties.includes(specialtyFilter)
    const matchesType = !typeFilter || agent.specialties.includes(typeFilter)
    return matchesSearch && matchesSpecialty && matchesType
  })

  /* Translate a specialty/type key — falls back to the key itself if missing */
  const translateTag = (key: string) => {
    if ((specialtyKeys as readonly string[]).includes(key)) {
      return t(`agents.filters.specialties.${key}`)
    }
    if ((typeKeys as readonly string[]).includes(key)) {
      return t(`agents.filters.types.${key}`)
    }
    return key
  }

  return (
    <div>
      {/* ═══════ Hero Section ═══════ */}
      <section
        ref={heroRef}
        className="bg-cream-warm pt-[80px] pb-[64px] px-6"
      >
        <div className="max-w-[1100px] mx-auto text-center">
          {/* Breadcrumb */}
          <p className="text-text-secondary text-[13px] font-inter mb-6">
            <Link to={path('/')} className="hover:text-terracotta transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <span className="mx-2">&gt;</span>
            <span>{t('breadcrumb.sell')}</span>
          </p>

          <h1 className="hero-title font-playfair text-[42px] md:text-[48px] font-medium text-midnight leading-tight max-w-[700px] mx-auto mb-6">
            {t('hero.title')}
          </h1>
          <p className="hero-subtitle text-text-secondary text-[17px] md:text-[18px] font-inter max-w-[560px] mx-auto mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={path('/estimation')}
              className="bg-terracotta text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
            >
              {t('hero.estimateButton')}
            </Link>
            <Link
              to="#depot"
              className="bg-white text-text-primary font-inter text-[14px] font-semibold px-6 py-3 rounded-lg border border-border-warm hover:scale-[1.02] transition-transform"
            >
              {t('hero.publishButton')}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ Two-Column Feature Cards ═══════ */}
      <section className="bg-white py-16 px-6">
        <div
          ref={featureCardsRef}
          className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Card 1 — Déposer une annonce */}
          <div
            id="depot"
            className="feature-card bg-white rounded-card border border-border-warm p-8 md:p-12 shadow-card"
          >
            <div className="w-12 h-12 text-terracotta mb-4">
              <Upload size={48} strokeWidth={1.5} />
            </div>
            <h3 className="font-playfair text-[28px] font-medium text-text-primary mb-4">
              {t('features.depot.title')}
            </h3>
            <p className="text-text-secondary text-[16px] font-inter leading-[1.7] mb-6">
              {t('features.depot.description')}
            </p>
            <ul className="space-y-3 mb-8">
              {(t('features.depot.items', { returnObjects: true }) as string[]).map((item) => (
                <li
                  key={item}
                  className="feature-check flex items-center gap-3 text-text-primary text-[14px] font-inter"
                >
                  <Check
                    size={18}
                    className="text-palm shrink-0"
                    strokeWidth={2.5}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to={path('/vendre#depot')}
                className="bg-terracotta text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
              >
                {t('features.depot.cta')}
              </Link>
              <Link
                to="#"
                className="text-terracotta font-inter text-[14px] font-medium hover:underline"
              >
                {t('features.depot.learnMore')}
              </Link>
            </div>
          </div>

          {/* Card 2 — Mandater une agence */}
          <div className="feature-card bg-white rounded-card border border-border-warm p-8 md:p-12 shadow-card">
            <div className="w-12 h-12 text-palm mb-4">
              <Users size={48} strokeWidth={1.5} />
            </div>
            <h3 className="font-playfair text-[28px] font-medium text-text-primary mb-4">
              {t('features.sell.title')}
            </h3>
            <p className="text-text-secondary text-[16px] font-inter leading-[1.7] mb-6">
              {t('features.sell.description')}
            </p>
            <ul className="space-y-3 mb-8">
              {(t('features.sell.items', { returnObjects: true }) as string[]).map((item) => (
                <li
                  key={item}
                  className="feature-check flex items-center gap-3 text-text-primary text-[14px] font-inter"
                >
                  <Check
                    size={18}
                    className="text-palm shrink-0"
                    strokeWidth={2.5}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="#agents"
                className="bg-palm text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
              >
                {t('features.sell.cta')}
              </Link>
              <Link
                to="#comment"
                className="text-palm font-inter text-[14px] font-medium hover:underline"
              >
                {t('features.sell.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ How It Works ═══════ */}
      <section
        ref={howItWorksRef}
        id="comment"
        className="bg-cream-warm py-16 md:py-24 px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          {/* Section label */}
          <p className="text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] text-center mb-3">
            {t('howItWorks.label')}
          </p>
          <h2 className="hiw-title font-playfair text-[36px] md:text-[40px] font-medium text-midnight text-center mb-16">
            {t('howItWorks.title')}
          </h2>

          {/* Steps */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Dashed connector line - desktop */}
            <div className="hidden lg:block absolute top-[30px] left-[12%] right-[12%] border-t border-dashed border-sand" />

            {stepNumbers.map((number, idx) => (
              <div key={number} className="hiw-step relative text-center">
                <span className="font-playfair text-[48px] font-semibold text-terracotta/30 block mb-3">
                  {number}
                </span>
                <h4 className="font-playfair text-[20px] font-semibold text-midnight mb-2">
                  {t(`howItWorks.steps.${idx + 1}.title`)}
                </h4>
                <p className="text-text-secondary text-[14px] font-inter leading-relaxed">
                  {t(`howItWorks.steps.${idx + 1}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Find an Agent ═══════ */}
      <section
        ref={agentSearchRef}
        id="agents"
        className="bg-white py-16 md:py-24 px-6"
      >
        <div className="max-w-[1100px] mx-auto">
          <h2 className="agent-title font-playfair text-[36px] md:text-[40px] font-medium text-midnight text-center mb-8">
            {t('agents.title')}
          </h2>

          {/* Search bar */}
          <div className="max-w-[600px] mx-auto mb-8">
            <div className="relative">
              <MapPin
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder={t('agents.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[56px] pl-12 pr-4 border border-border-warm rounded-card bg-white font-inter text-[15px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-terracotta transition-colors"
              />
              <Search
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary/60"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="h-[44px] px-4 border border-border-warm rounded-lg bg-white font-inter text-[14px] text-text-primary focus:outline-none focus:border-terracotta"
            >
              <option value="">{t('agents.filters.specialty')}</option>
              {specialtyKeys.map((k) => (
                <option key={k} value={k}>{t(`agents.filters.specialties.${k}`)}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-[44px] px-4 border border-border-warm rounded-lg bg-white font-inter text-[14px] text-text-primary focus:outline-none focus:border-terracotta"
            >
              <option value="">{t('agents.filters.type')}</option>
              {typeKeys.map((k) => (
                <option key={k} value={k}>{t(`agents.filters.types.${k}`)}</option>
              ))}
            </select>
          </div>

          {/* Agent cards grid */}
          <div className="agent-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.length === 0 ? (
              <div className="col-span-full text-center text-text-secondary font-inter text-[14px] py-12">
                {t('agents.noResults')}
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <div
                  key={agent.name}
                  className="agent-card bg-white rounded-card border border-border-warm p-6 shadow-card hover:shadow-card-hover transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[60px] h-[60px] rounded-full bg-cream-warm flex items-center justify-center shrink-0">
                      <span className="font-playfair text-[20px] font-semibold text-midnight">
                        {agent.initials}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-inter text-[16px] font-semibold text-text-primary">
                        {agent.name}
                      </h4>
                      <div className="flex items-center gap-2 text-text-secondary text-[13px] font-inter">
                        <span>
                          {t('agents.card.stats', { count: agent.properties, rating: agent.rating })}
                        </span>
                        <Star
                          size={13}
                          className="fill-gold text-gold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {agent.specialties.map((s) => (
                      <span
                        key={s}
                        className="bg-cream-warm text-text-secondary text-[12px] font-medium px-3 py-1 rounded-full"
                      >
                        {translateTag(s)}
                      </span>
                    ))}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-text-secondary text-[13px] font-inter mb-4">
                    <MapPin size={14} />
                    <span>{agent.location}</span>
                  </div>

                  {/* CTA */}
                  <Link
                    to="#"
                    className="block w-full text-center bg-white border border-border-warm text-text-primary font-inter text-[14px] font-medium py-2.5 rounded-lg hover:bg-cream-warm transition-colors"
                  >
                    {t('agents.card.viewProfile')}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ Accordion ═══════ */}
      <section ref={faqRef} className="bg-cream-warm py-16 md:py-24 px-6">
        <div className="max-w-[720px] mx-auto">
          <h2 className="faq-title font-playfair text-[36px] md:text-[40px] font-medium text-midnight text-center mb-12">
            {t('faq.title')}
          </h2>
          <div>
            {faqKeys.map((key, index) => (
              <div key={key} className="faq-item">
                <FaqItem
                  question={t(`faq.items.${key}.question`)}
                  answer={t(`faq.items.${key}.answer`)}
                  isOpen={openFaq === index}
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
