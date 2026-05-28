import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import { getImageUrl } from '@/lib/storage'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Landmark,
  FileText,
  AlertTriangle,
  Download,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/* ── Table of contents (label resolved via i18n key) ── */
const tocItems = [
  { key: 'toc.processus', href: '#processus' },
  { key: 'toc.notaire', href: '#notaire' },
  { key: 'toc.frais', href: '#frais' },
  { key: 'toc.credit', href: '#credit' },
  { key: 'toc.fiscalite', href: '#fiscalite' },
  { key: 'toc.precautions', href: '#precautions' },
  { key: 'toc.gestion', href: '#gestion' },
]

/* ── Timeline steps (i18n key suffixes) ── */
const timelineSteps = ['compromis', 'titre', 'compte', 'acte', 'enregistrement']

/* ── Acquisition fees table (i18n row keys) ── */
const feesRows = ['enregistrement', 'notaire', 'adoul', 'publicite', 'total']

/* ── Credit banks (i18n keys) ── */
const banks = ['attijariwafa', 'bmce', 'populaire', 'sgmaroc', 'cih', 'bcp']

/* ── Credit documents (i18n keys) ── */
const creditDocuments = [
  'passeport',
  'revenus',
  'imposition',
  'releves',
  'domicile',
  'patrimoine',
]

/* ── Tax comparison data (i18n row keys) ── */
const taxRows = ['tpi', 'habitation', 'communaux', 'is']

/* ── Precautions checklist (i18n keys) ── */
const precautionsList = [
  'titre',
  'proprietaire',
  'gages',
  'diagnostic',
  'servitudes',
  'conformite',
  'charges',
  'professionnel',
]

/* ── Related articles (image + i18n key) ── */
const relatedArticles = [
  { image: 'blog-pricing.jpg', key: 'pricing' },
  { image: 'blog-neighborhood.jpg', key: 'neighborhood' },
  { image: 'property-01.jpg', key: 'type' },
]

export default function BuyerGuide() {
  const { t } = useTranslation('buyerGuide')
  const { path } = useLang()
  const [activeSection, setActiveSection] = useState('')
  const [email, setEmail] = useState('')

  const heroRef = useRef<HTMLDivElement>(null)
  const tocRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const relatedRef = useRef<HTMLDivElement>(null)

  /* Track active section */
  useEffect(() => {
    const sectionIds = tocItems.map((item) => item.href.replace('#', ''))
    const observers: IntersectionObserver[] = []

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${id}`)
          }
        },
        { rootMargin: '-20% 0px -70% 0px' }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

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
          heroRef.current!.querySelector('.hero-date'),
          { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' },
          '-=0.35'
        )
    },
    { scope: heroRef }
  )

  /* TOC animation */
  useGSAP(
    () => {
      if (!tocRef.current) return
      gsap.fromTo(
        tocRef.current!.querySelectorAll('.toc-link'),
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out', delay: 0.3 },
      )
    },
    { scope: tocRef }
  )

  /* Content sections animation */
  useGSAP(
    () => {
      if (!contentRef.current) return
      const sections =
        contentRef.current!.querySelectorAll('.guide-section')
      sections.forEach((section) => {
        gsap.fromTo(
          section.querySelectorAll('.gsap-fade'),
          { y: 30, opacity: 0 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            once: true,
          } },
        )
      })
    },
    { scope: contentRef }
  )

  /* CTA animation */
  useGSAP(
    () => {
      if (!ctaRef.current) return
      gsap.fromTo(
        ctaRef.current!.querySelectorAll('.cta-fade'),
        { y: 30, opacity: 0 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 85%',
          once: true,
        } },
      )
    },
    { scope: ctaRef }
  )

  /* Related articles animation */
  useGSAP(
    () => {
      if (!relatedRef.current) return
      gsap.fromTo(
        relatedRef.current!.querySelectorAll('.related-card'),
        { y: 40, opacity: 0 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12, scrollTrigger: {
          trigger: relatedRef.current,
          start: 'top 85%',
          once: true,
        } },
      )
    },
    { scope: relatedRef }
  )

  return (
    <div>
      {/* ═══════ Hero Section ═══════ */}
      <section ref={heroRef} className="bg-midnight pt-[80px] pb-[64px] px-6">
        <div className="max-w-[1100px] mx-auto text-center">
          {/* Breadcrumb */}
          <p className="text-white/60 text-[13px] font-inter mb-6">
            <Link to={path('/')} className="hover:text-white transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <span className="mx-2">&gt;</span>
            <Link
              to={path('/conseils-immobiliers')}
              className="hover:text-white transition-colors"
            >
              {t('breadcrumb.guides')}
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="text-white/80">{t('breadcrumb.current')}</span>
          </p>

          <h1 className="hero-title font-display text-[42px] md:text-[48px] font-medium text-white leading-tight max-w-[700px] mx-auto mb-6">
            {t('hero.title')}
          </h1>
          <p className="hero-subtitle text-white/75 text-[17px] md:text-[18px] font-inter max-w-[640px] mx-auto mb-4 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <p className="hero-date text-white/50 text-[13px] font-inter">
            {t('hero.updated')}
          </p>
        </div>
      </section>

      {/* ═══════ Main Content ═══════ */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* ── Sticky Table of Contents ── */}
            <aside ref={tocRef} className="lg:w-[280px] shrink-0">
              {/* Mobile: horizontal chips */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4">
                {tocItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'shrink-0 px-4 py-2 rounded-full text-[13px] font-inter font-medium transition-colors',
                      activeSection === item.href
                        ? 'bg-palm text-white'
                        : 'bg-cream-warm text-text-secondary hover:text-midnight'
                    )}
                  >
                    {t(item.key)}
                  </a>
                ))}
              </div>

              {/* Desktop: sticky sidebar */}
              <div className="hidden lg:block sticky top-[96px]">
                <p className="text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-4">
                  {t('toc.label')}
                </p>
                <nav className="flex flex-col gap-1">
                  {tocItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'toc-link relative pl-4 py-2 text-[15px] font-inter transition-colors',
                        activeSection === item.href
                          ? 'text-terracotta font-medium'
                          : 'text-text-secondary hover:text-midnight'
                      )}
                    >
                      {activeSection === item.href && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-terracotta rounded-full" />
                      )}
                      {t(item.key)}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* ── Main Content ── */}
            <div ref={contentRef} className="flex-1 min-w-0">
              {/* Section: Pourquoi acheter à Marrakech (intro before first TOC) */}
              <div className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  {t('intro.eyebrow')}
                </p>
                <h2 className="gsap-fade font-display text-[28px] md:text-[32px] font-medium text-midnight mb-6">
                  {t('intro.title')}
                </h2>
                <div className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] space-y-4">
                  <p>{t('intro.p1')}</p>
                  <p>{t('intro.p2')}</p>
                  <p>{t('intro.p3')}</p>
                  <p>{t('intro.p4')}</p>
                </div>
              </div>

              {/* Section 1: Le processus d'achat */}
              <div id="processus" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  {t('process.eyebrow')}
                </p>
                <h2 className="gsap-fade font-display text-[28px] md:text-[32px] font-medium text-midnight mb-4">
                  {t('process.title')}
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  {t('process.intro')}
                </p>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical connector */}
                  <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-sand" />
                  {timelineSteps.map((step, index) => (
                    <div
                      key={step}
                      className="gsap-fade relative flex gap-6 mb-8 last:mb-0"
                    >
                      {/* Number circle */}
                      <div className="relative z-10 w-[38px] h-[38px] rounded-full bg-terracotta text-white flex items-center justify-center shrink-0">
                        <span className="font-display text-[16px] font-semibold">
                          {index + 1}
                        </span>
                      </div>
                      {/* Content */}
                      <div className="pt-1">
                        <h4 className="font-display text-[18px] font-semibold text-midnight mb-2">
                          {t(`process.steps.${step}.title`)}
                        </h4>
                        <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                          {t(`process.steps.${step}.body`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Notaire ou Adoul */}
              <div id="notaire" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  {t('notary.eyebrow')}
                </p>
                <h2 className="gsap-fade font-display text-[28px] md:text-[32px] font-medium text-midnight mb-6">
                  {t('notary.title')}
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  {t('notary.intro')}
                </p>

                <div className="gsap-fade grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Notaire card */}
                  <div className="bg-white rounded-xl border border-border-warm p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-cream-warm flex items-center justify-center text-terracotta">
                        <Landmark size={20} />
                      </div>
                      <h3 className="font-display text-[20px] font-semibold text-midnight">
                        {t('notary.notaireCard.title')}
                      </h3>
                    </div>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      {t('notary.notaireCard.body')}
                    </p>
                  </div>

                  {/* Adoul card */}
                  <div className="bg-white rounded-xl border border-border-warm p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-cream-warm flex items-center justify-center text-palm">
                        <FileText size={20} />
                      </div>
                      <h3 className="font-display text-[20px] font-semibold text-midnight">
                        {t('notary.adoulCard.title')}
                      </h3>
                    </div>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      {t('notary.adoulCard.body')}
                    </p>
                  </div>
                </div>

                {/* Info box */}
                <div className="gsap-fade bg-cream-warm border-l-[3px] border-terracotta p-5 rounded-r-lg">
                  <p className="text-text-primary text-[15px] font-inter leading-relaxed">
                    <strong>{t('notary.recommendation.label')}</strong>{' '}
                    {t('notary.recommendation.text')}
                  </p>
                </div>
              </div>

              {/* Section 3: Les frais d'acquisition */}
              <div id="frais" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  {t('fees.eyebrow')}
                </p>
                <h2 className="gsap-fade font-display text-[28px] md:text-[32px] font-medium text-midnight mb-6">
                  {t('fees.title')}
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-6">
                  {t('fees.intro')}
                </p>

                {/* Fees table */}
                <div className="gsap-fade overflow-x-auto mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border-warm">
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3 pr-4">
                          {t('fees.table.head.item')}
                        </th>
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3 pr-4">
                          {t('fees.table.head.rate')}
                        </th>
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3">
                          {t('fees.table.head.notes')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {feesRows.map((row, i) => (
                        <tr
                          key={row}
                          className={cn(
                            'border-b border-border-warm',
                            i === feesRows.length - 1 &&
                              'bg-cream-warm font-medium'
                          )}
                        >
                          <td className="text-text-primary text-[15px] font-inter py-3 pr-4">
                            {t(`fees.table.rows.${row}.item`)}
                          </td>
                          <td className="text-text-secondary text-[15px] font-inter py-3 pr-4">
                            {t(`fees.table.rows.${row}.rate`)}
                          </td>
                          <td className="text-text-secondary text-[15px] font-inter py-3">
                            {t(`fees.table.rows.${row}.notes`)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Highlight box */}
                <div className="gsap-fade bg-cream-warm border-l-[3px] border-terracotta p-5 rounded-r-lg">
                  <p className="text-text-primary text-[15px] font-inter leading-relaxed">
                    <strong>{t('fees.highlight.label')}</strong>{' '}
                    {t('fees.highlight.text')}
                  </p>
                </div>
              </div>

              {/* Section 4: Le credit immobilier */}
              <div id="credit" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  {t('credit.eyebrow')}
                </p>
                <h2 className="gsap-fade font-display text-[28px] md:text-[32px] font-medium text-midnight mb-4">
                  {t('credit.title')}
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  {t('credit.intro')}
                </p>

                {/* Info card: rates */}
                <div className="gsap-fade bg-cream-warm rounded-xl p-6 mb-8 border border-border-warm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                    <p className="text-text-primary text-[15px] font-inter font-medium">
                      {t('credit.rates.label')}{' '}
                      <strong>{t('credit.rates.value')}</strong>{' '}
                      {t('credit.rates.suffix')}
                    </p>
                  </div>
                  <p className="text-text-secondary text-[14px] font-inter leading-relaxed">
                    {t('credit.rates.note')}
                  </p>
                </div>

                {/* Warning */}
                <div className="gsap-fade bg-terracotta/10 border-l-[3px] border-terracotta p-5 rounded-r-lg mb-8">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={20}
                      className="text-terracotta shrink-0 mt-0.5"
                    />
                    <p className="text-text-primary text-[15px] font-inter leading-relaxed">
                      <strong>{t('credit.warning.label')}</strong>{' '}
                      {t('credit.warning.text')}
                    </p>
                  </div>
                </div>

                {/* Banks list */}
                <h3 className="gsap-fade font-display text-[20px] font-semibold text-midnight mb-4">
                  {t('credit.banksTitle')}
                </h3>
                <div className="gsap-fade grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {banks.map((bank) => (
                    <div
                      key={bank}
                      className="flex items-center gap-3 bg-white border border-border-warm rounded-lg px-4 py-3"
                    >
                      <Check size={16} className="text-palm shrink-0" />
                      <span className="text-text-primary text-[14px] font-inter">
                        {t(`credit.banks.${bank}`)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Required documents */}
                <h3 className="gsap-fade font-display text-[20px] font-semibold text-midnight mb-4">
                  {t('credit.documentsTitle')}
                </h3>
                <ul className="gsap-fade space-y-2">
                  {creditDocuments.map((doc) => (
                    <li
                      key={doc}
                      className="flex items-start gap-3 text-text-secondary text-[15px] font-inter"
                    >
                      <Check
                        size={16}
                        className="text-palm shrink-0 mt-1"
                      />
                      <span>{t(`credit.documents.${doc}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 5: La fiscalite */}
              <div id="fiscalite" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  {t('tax.eyebrow')}
                </p>
                <h2 className="gsap-fade font-display text-[28px] md:text-[32px] font-medium text-midnight mb-4">
                  {t('tax.title')}
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  {t('tax.intro')}
                </p>

                {/* Tax comparison table */}
                <div className="gsap-fade overflow-x-auto mb-8">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border-warm">
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3 pr-4">
                          {t('tax.table.head.tax')}
                        </th>
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3 pr-4">
                          {t('tax.table.head.resident')}
                        </th>
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3">
                          {t('tax.table.head.nonResident')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxRows.map((row) => (
                        <tr
                          key={row}
                          className="border-b border-border-warm"
                        >
                          <td className="text-text-primary text-[15px] font-inter py-3 pr-4">
                            {t(`tax.table.rows.${row}.category`)}
                          </td>
                          <td className="text-text-secondary text-[15px] font-inter py-3 pr-4">
                            {t(`tax.table.rows.${row}.resident`)}
                          </td>
                          <td className="text-text-secondary text-[15px] font-inter py-3">
                            {t(`tax.table.rows.${row}.nonResident`)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info box */}
                <div className="gsap-fade bg-cream-warm border-l-[3px] border-terracotta p-5 rounded-r-lg">
                  <p className="text-text-primary text-[15px] font-inter leading-relaxed">
                    <strong>{t('tax.info.label')}</strong> {t('tax.info.text')}
                  </p>
                </div>
              </div>

              {/* Section 6: Les precautions */}
              <div id="precautions" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  {t('precautions.eyebrow')}
                </p>
                <h2 className="gsap-fade font-display text-[28px] md:text-[32px] font-medium text-midnight mb-6">
                  {t('precautions.title')}
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-6">
                  {t('precautions.intro')}
                </p>

                {/* Checklist */}
                <div className="gsap-fade grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {precautionsList.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 bg-cream-warm rounded-lg px-4 py-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} className="text-terracotta" />
                      </div>
                      <span className="text-text-primary text-[14px] font-inter">
                        {t(`precautions.checklist.${item}`)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Warning box */}
                <div className="gsap-fade bg-terracotta/10 border-l-[3px] border-terracotta p-5 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={20}
                      className="text-terracotta shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-text-primary text-[15px] font-inter font-medium mb-1">
                        {t('precautions.warning.title')}
                      </p>
                      <p className="text-text-secondary text-[14px] font-inter leading-relaxed">
                        {t('precautions.warning.text')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 7: Gestion locative */}
              <div id="gestion" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  {t('rental.eyebrow')}
                </p>
                <h2 className="gsap-fade font-display text-[28px] md:text-[32px] font-medium text-midnight mb-4">
                  {t('rental.title')}
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  {t('rental.intro')}
                </p>

                <div className="gsap-fade space-y-6 mb-8">
                  <div>
                    <h3 className="font-display text-[20px] font-semibold text-midnight mb-2">
                      {t('rental.seasonal.title')}
                    </h3>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      {t('rental.seasonal.body')}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-[20px] font-semibold text-midnight mb-2">
                      {t('rental.longTerm.title')}
                    </h3>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      {t('rental.longTerm.body')}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-[20px] font-semibold text-midnight mb-2">
                      {t('rental.concierge.title')}
                    </h3>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      {t('rental.concierge.body')}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  to={path('/gestion-locative')}
                  className="gsap-fade inline-block bg-palm text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
                >
                  {t('rental.cta')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Download CTA ═══════ */}
      <section ref={ctaRef} className="bg-terracotta py-16 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h3 className="cta-fade font-display text-[26px] md:text-[28px] font-medium text-white mb-3">
            {t('download.title')}
          </h3>
          <p className="cta-fade text-white/80 text-[16px] font-inter mb-8 leading-relaxed">
            {t('download.subtitle')}
          </p>
          <div className="cta-fade flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto mb-4">
            <input
              type="email"
              placeholder={t('download.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-[48px] px-4 rounded-lg bg-white font-inter text-[14px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={() => alert(t('download.alert'))}
              className="h-[48px] px-6 bg-white text-terracotta font-inter text-[14px] font-semibold rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              {t('download.button')}
            </button>
          </div>
          <p className="cta-fade text-white/60 text-[12px] font-inter">
            {t('download.disclaimer')}
          </p>
        </div>
      </section>

      {/* ═══════ Related Articles ═══════ */}
      <section ref={relatedRef} className="bg-cream-warm py-16 px-6">
        <div className="max-w-[1100px] mx-auto">
          <h3 className="font-display text-[28px] font-medium text-midnight mb-8">
            {t('related.title')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map((article) => (
              <Link
                key={article.key}
                to={path('/conseils-immobiliers')}
                className="related-card group bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={getImageUrl(article.image, { width: 600, height: 375, resize: 'cover' })}
                    alt={t(`related.articles.${article.key}.title`)}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <span className="bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded mb-3 inline-block uppercase">
                    {t(`related.articles.${article.key}.category`)}
                  </span>
                  <h4 className="font-display text-[16px] font-medium text-text-primary mb-2 line-clamp-2 group-hover:text-terracotta transition-colors">
                    {t(`related.articles.${article.key}.title`)}
                  </h4>
                  <p className="text-text-secondary text-[13px] font-inter">
                    {t(`related.articles.${article.key}.date`)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
