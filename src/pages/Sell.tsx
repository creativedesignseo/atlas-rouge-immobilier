import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Users, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/* ── FAQ keys (content resolved at render time via t()) ── */
const faqKeys = ['estimation', 'duration', 'documents', 'remote', 'fees', 'signing'] as const

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

  const heroRef = useRef<HTMLDivElement>(null)
  const featureCardsRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
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
      // Progress line traces left → right as the user scrolls through the
      // steps. `scrub` ties the line growth directly to scroll position so
      // it feels like a recorrido (the line "follows" the reader's eye).
      const progressLine = howItWorksRef.current!.querySelector('.hiw-line-progress')
      if (progressLine) {
        gsap.to(progressLine, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: howItWorksRef.current,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 0.6,
          },
        })
      }
    },
    { scope: howItWorksRef }
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
              to={path('/valuation')}
              className="bg-terracotta text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
            >
              {t('hero.estimateButton')}
            </Link>
            <Link
              to={path('/contact')}
              className="bg-white text-text-primary font-inter text-[14px] font-semibold px-6 py-3 rounded-lg border border-border-warm hover:scale-[1.02] transition-transform"
            >
              {t('hero.contactButton')}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ Single Feature Card — Confier la vente ═══════ */}
      <section className="bg-white py-16 px-6">
        <div
          ref={featureCardsRef}
          className="max-w-[640px] mx-auto"
        >
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
                to={path('/contact')}
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
            {/* Connector lines (desktop only) — span between the centers of
                step 1 and step 4, exactly through the vertical middle of the
                number row (60px tall → top: 30px). */}
            <div className="hidden lg:block absolute top-[30px] left-[12.5%] right-[12.5%] border-t-2 border-dashed border-sand pointer-events-none" />
            <div className="hiw-line-progress hidden lg:block absolute top-[30px] left-[12.5%] right-[12.5%] h-[2px] bg-terracotta origin-left scale-x-0 pointer-events-none" />

            {stepNumbers.map((number, idx) => (
              <div key={number} className="hiw-step relative text-center">
                {/* Fixed-height container ensures the connector line passes
                    cleanly through the visual middle of every number, with
                    a bg-cream-warm "cap" on the digits hiding the line under
                    them so it never overlaps the glyphs. */}
                <div className="relative h-[60px] flex items-center justify-center mb-3">
                  <span className="font-playfair text-[48px] font-semibold text-terracotta/30 leading-none bg-cream-warm px-3 relative z-10">
                    {number}
                  </span>
                </div>
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

      {/* ═══════ FAQ Accordion ═══════ */}
      <section ref={faqRef} className="bg-white py-16 md:py-24 px-6">
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
