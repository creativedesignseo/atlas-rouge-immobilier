import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

/* ── Table of contents ── */
const tocItems = [
  { label: 'Le processus d\u2019achat', href: '#processus' },
  { label: 'Notaire ou Adoul ?', href: '#notaire' },
  { label: 'Les frais d\u2019acquisition', href: '#frais' },
  { label: 'Le cr\u00E9dit immobilier au Maroc', href: '#credit' },
  { label: 'La fiscalit\u00E9', href: '#fiscalite' },
  { label: 'Les pr\u00E9cautions \u00E0 prendre', href: '#precautions' },
  { label: 'Gestion locative', href: '#gestion' },
]

/* ── Timeline steps ── */
const timelineSteps = [
  {
    title: 'Signature du compromis',
    body: 'Le compromis de vente engage vendeur et acheteur. Il fixe le prix, les d\u00E9lais et les conditions suspensives (obtention de cr\u00E9dit, etc.). Versement d\u2019un d\u00E9p\u00F4t de garantie de 10%.',
  },
  {
    title: 'Obtention du titre foncier',
    body: 'Le titre foncier est le document foncier unique au Maroc. Il atteste de la propri\u00E9t\u00E9 du bien. V\u00E9rifiez qu\u2019il existe et qu\u2019il n\u2019est pas gag\u00E9 ou hypoth\u00E9qu\u00E9.',
  },
  {
    title: 'Ouverture d\u2019un compte bancaire',
    body: 'Un compte bancaire au Maroc est n\u00E9cessaire pour l\u2019acte d\u2019achat et les paiements. Les banques demandent g\u00E9n\u00E9ralement un passeport, un justificatif de revenus et un justificatif de domicile.',
  },
  {
    title: 'Signature de l\u2019acte d\u00E9finitif',
    body: 'L\u2019acte authentique est sign\u00E9 chez le notaire ou l\u2019Adoul. Le solde du prix est vers\u00E9 et les cl\u00E9s sont remises. L\u2019acte est ensuite enregistr\u00E9.',
  },
  {
    title: 'Enregistrement et remise des cl\u00E9s',
    body: 'L\u2019acte est enregistr\u00E9 aupr\u00E8s de la conservation fonci\u00E8re. Les droits d\u2019enregistrement sont acquitt\u00E9s. Le nouveau titre foncier est \u00E9tabli au nom de l\u2019acqu\u00E9reur.',
  },
]

/* ── Acquisition fees table ── */
const feesData = [
  { item: 'Droits d\u2019enregistrement', rate: '4% du prix', notes: '\u00C0 la charge de l\u2019acheteur' },
  { item: 'Honoraires de notaire', rate: '1 \u2013 1.5%', notes: 'N\u00E9gociables' },
  { item: 'Frais d\u2019Adoul', rate: '~0.5%', notes: 'Moins cher que le notaire' },
  { item: 'Taxe de publicit\u00E9 fonci\u00E8re', rate: '1%', notes: 'Obligatoire' },
  { item: 'Total estim\u00E9', rate: '6 \u2013 8% du prix', notes: '\u00C0 pr\u00E9voir en plus du prix d\u2019achat' },
]

/* ── Credit banks ── */
const banks = [
  'Attijariwafa Bank',
  'BMCE Bank of Africa',
  'Banque Populaire',
  'Soci\u00E9t\u00E9 G\u00E9n\u00E9rale Maroc',
  'CIH Bank',
  'BCP',
]

/* ── Credit documents ── */
const creditDocuments = [
  'Passeport valide',
  'Justificatifs de revenus (3 derni\u00E8res ann\u00E9es)',
  'Avis d\u2019imposition fran\u00E7ais',
  'Relev\u00E9s bancaires',
  'Justificatif de domicile',
  'Attestation de patrimoine',
]

/* ── Tax comparison data ── */
const taxData = [
  {
    category: 'Taxe sur les profits immobiliers (TPI)',
    resident: 'Exon\u00E9r\u00E9 apr\u00E8s 6 ans',
    nonResident: 'Exon\u00E9r\u00E9 apr\u00E8s 6 ans',
  },
  {
    category: 'Taxe d\u2019habitation',
    resident: 'Variable selon ville',
    nonResident: 'Variable selon ville',
  },
  {
    category: 'Taxe de services communaux',
    resident: 'Environ 6.5% du loyer',
    nonResident: 'Environ 6.5% du loyer',
  },
  {
    category: 'IS (revenus locatifs)',
    resident: 'Progressif 10-31%',
    nonResident: 'Forfaitaire 10%',
  },
]

/* ── Precautions checklist ── */
const precautionsList = [
  'V\u00E9rifier l\u2019existence du titre foncier',
  'S\u2019assurer que le vendeur est bien le propri\u00E9taire',
  'V\u00E9rifier l\u2019absence de gages ou hypoth\u00E8ques',
  'Faire r\u00E9aliser un diagnostic technique',
  'V\u00E9rifier les servitudes \u00E9ventuelles',
  'Contr\u00F4ler la conformit\u00E9 des constructions',
  'V\u00E9rifier les charges et taxes impay\u00E9es',
  'Se faire accompagner par un professionnel',
]

/* ── Related articles ── */
const relatedArticles = [
  {
    image: 'blog-pricing.jpg',
    category: 'March\u00E9',
    title: 'Prix de l\u2019immobilier \u00E0 Marrakech : tendances 2024',
    date: '15 Jan 2024',
  },
  {
    image: 'blog-neighborhood.jpg',
    category: 'Quartiers',
    title: 'Choisir son quartier \u00E0 Marrakech : le guide complet',
    date: '8 Jan 2024',
  },
  {
    image: 'property-01.jpg',
    category: 'Achat',
    title: 'Riad ou villa : quel bien choisir \u00E0 Marrakech ?',
    date: '2 Jan 2024',
  },
]

export default function BuyerGuide() {
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
      gsap.from(tocRef.current!.querySelectorAll('.toc-link'), {
        opacity: 0,
        x: -10,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power3.out',
        delay: 0.3,
      })
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
        gsap.from(section.querySelectorAll('.gsap-fade'), {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            once: true,
          },
        })
      })
    },
    { scope: contentRef }
  )

  /* CTA animation */
  useGSAP(
    () => {
      if (!ctaRef.current) return
      gsap.from(ctaRef.current!.querySelectorAll('.cta-fade'), {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: ctaRef }
  )

  /* Related articles animation */
  useGSAP(
    () => {
      if (!relatedRef.current) return
      gsap.from(relatedRef.current!.querySelectorAll('.related-card'), {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: relatedRef.current,
          start: 'top 85%',
          once: true,
        },
      })
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
            <Link to="/" className="hover:text-white transition-colors">
              Accueil
            </Link>
            <span className="mx-2">&gt;</span>
            <Link
              to="/conseils-immobiliers"
              className="hover:text-white transition-colors"
            >
              Guides
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="text-white/80">Achat au Maroc</span>
          </p>

          <h1 className="hero-title font-playfair text-[42px] md:text-[48px] font-medium text-white leading-tight max-w-[700px] mx-auto mb-6">
            Guide d&rsquo;achat immobilier au Maroc
          </h1>
          <p className="hero-subtitle text-white/75 text-[17px] md:text-[18px] font-inter max-w-[640px] mx-auto mb-4 leading-relaxed">
            Tout ce que vous devez savoir pour acheter une propri&eacute;t&eacute; au
            Maroc en toute s&eacute;r&eacute;nit&eacute;.
          </p>
          <p className="hero-date text-white/50 text-[13px] font-inter">
            Mis &agrave; jour le 15 janvier 2024
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
                    {item.label}
                  </a>
                ))}
              </div>

              {/* Desktop: sticky sidebar */}
              <div className="hidden lg:block sticky top-[96px]">
                <p className="text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-4">
                  Sommaire
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
                      {item.label}
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
                  Introduction
                </p>
                <h2 className="gsap-fade font-playfair text-[28px] md:text-[32px] font-medium text-midnight mb-6">
                  Pourquoi acheter &agrave; Marrakech ?
                </h2>
                <div className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] space-y-4">
                  <p>
                    Marrakech attire chaque ann&eacute;e des milliers d&rsquo;acheteurs
                    &eacute;trangers, et notamment des Fran&ccedil;ais, s&eacute;duits par son
                    climat exceptionnel, sa culture riche et ses perspectives
                    d&rsquo;investissement. Surnomm&eacute;e la &laquo; ville ocre &raquo;, elle
                    offre un cadre de vie unique entre tradition marocaine et
                    modernit&eacute;.
                  </p>
                  <p>
                    Le climat ensoleill&eacute; toute l&rsquo;ann&eacute;e, avec plus de 300
                    jours de soleil, est l&rsquo;un des premiers attraits. Les hivers
                    doux et les &eacute;t&eacute;s chauds mais secs permettent de profiter
                    des jardins, terrasses et piscines en permanence.
                  </p>
                  <p>
                    Sur le plan culturel, la M&eacute;dina class&eacute;e au patrimoine de
                    l&rsquo;UNESCO, les palais, les jardins Majorelle, et la
                    c&eacute;l&egrave;bre place Jemaa el-Fna offrent un environnement
                    culturel d&rsquo;exception. La cuisine marocaine, les hammams, le
                    souk : chaque jour apporte sa d&eacute;couverte.
                  </p>
                  <p>
                    C&ocirc;t&eacute; investissement, les prix au m&sup2; restent
                    attractifs compar&eacute;s aux grandes m&eacute;tropoles europ&eacute;ennes.
                    Avec un rendement locatif pouvant atteindre 8% brut en
                    saisonnier, Marrakech repr&eacute;sente une opportunit&eacute;
                    financi&egrave;re int&eacute;ressante.
                  </p>
                </div>
              </div>

              {/* Section 1: Le processus d'achat */}
              <div id="processus" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  &Eacute;tape par &eacute;tape
                </p>
                <h2 className="gsap-fade font-playfair text-[28px] md:text-[32px] font-medium text-midnight mb-4">
                  Le processus d&rsquo;achat en 5 &eacute;tapes
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  L&rsquo;achat immobilier au Maroc suit un processus bien
                  &eacute;tabli, diff&eacute;rent du syst&egrave;me fran&ccedil;ais sur certains
                  points. Voici les &eacute;tapes cl&eacute;s.
                </p>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical connector */}
                  <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-sand" />
                  {timelineSteps.map((step, index) => (
                    <div
                      key={index}
                      className="gsap-fade relative flex gap-6 mb-8 last:mb-0"
                    >
                      {/* Number circle */}
                      <div className="relative z-10 w-[38px] h-[38px] rounded-full bg-terracotta text-white flex items-center justify-center shrink-0">
                        <span className="font-playfair text-[16px] font-semibold">
                          {index + 1}
                        </span>
                      </div>
                      {/* Content */}
                      <div className="pt-1">
                        <h4 className="font-playfair text-[18px] font-semibold text-midnight mb-2">
                          {step.title}
                        </h4>
                        <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Notaire ou Adoul */}
              <div id="notaire" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  Formalit&eacute;s
                </p>
                <h2 className="gsap-fade font-playfair text-[28px] md:text-[32px] font-medium text-midnight mb-6">
                  Notaire ou Adoul : qui choisir ?
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  Au Maroc, deux professionnels peuvent r&eacute;diger votre acte
                  d&rsquo;achat : le notaire et l&rsquo;Adoul. Chacun pr&eacute;sente des
                  avantages selon votre situation.
                </p>

                <div className="gsap-fade grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Notaire card */}
                  <div className="bg-white rounded-xl border border-border-warm p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-cream-warm flex items-center justify-center text-terracotta">
                        <Landmark size={20} />
                      </div>
                      <h3 className="font-playfair text-[20px] font-semibold text-midnight">
                        Le notaire
                      </h3>
                    </div>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      Le notaire est un officier minist&eacute;riel qui s&eacute;curise la
                      transaction. Il r&eacute;dige l&rsquo;acte authentique, v&eacute;rifie les
                      titres de propri&eacute;t&eacute;, et garantit la validit&eacute;
                      juridique de l&rsquo;acte. Indispensable pour les achats
                      complexes ou lors d&rsquo;un recours au cr&eacute;dit.
                    </p>
                  </div>

                  {/* Adoul card */}
                  <div className="bg-white rounded-xl border border-border-warm p-6 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-cream-warm flex items-center justify-center text-palm">
                        <FileText size={20} />
                      </div>
                      <h3 className="font-playfair text-[20px] font-semibold text-midnight">
                        L&rsquo;Adoul
                      </h3>
                    </div>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      L&rsquo;Adoul est un officier de l&rsquo;&eacute;tat civil habilit&eacute;
                      &agrave; r&eacute;diger les actes. Solution plus rapide et moins
                      co&ucirc;teuse pour les achats au comptant entre
                      particuliers. Ses honoraires sont d&rsquo;environ 0.5%
                      contre 1-1.5% pour le notaire.
                    </p>
                  </div>
                </div>

                {/* Info box */}
                <div className="gsap-fade bg-cream-warm border-l-[3px] border-terracotta p-5 rounded-r-lg">
                  <p className="text-text-primary text-[15px] font-inter leading-relaxed">
                    <strong>Notre recommandation :</strong> optez pour le
                    notaire si vous &ecirc;tes acheteur &eacute;tranger ou si le montant de
                    l&rsquo;achat est sup&eacute;rieur &agrave; 500 000 &euro;. L&rsquo;Adoul peut
                    suffire pour les petites transactions au comptant avec un
                    vendeur de confiance.
                  </p>
                </div>
              </div>

              {/* Section 3: Les frais d'acquisition */}
              <div id="frais" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  Budget
                </p>
                <h2 className="gsap-fade font-playfair text-[28px] md:text-[32px] font-medium text-midnight mb-6">
                  Les frais d&rsquo;acquisition
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-6">
                  En plus du prix d&rsquo;achat, pr&eacute;voyez un budget de 6 &agrave; 8%
                  pour les frais annexes. Voici le d&eacute;tail.
                </p>

                {/* Fees table */}
                <div className="gsap-fade overflow-x-auto mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border-warm">
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3 pr-4">
                          Poste
                        </th>
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3 pr-4">
                          Taux
                        </th>
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {feesData.map((row, i) => (
                        <tr
                          key={i}
                          className={cn(
                            'border-b border-border-warm',
                            i === feesData.length - 1 &&
                              'bg-cream-warm font-medium'
                          )}
                        >
                          <td className="text-text-primary text-[15px] font-inter py-3 pr-4">
                            {row.item}
                          </td>
                          <td className="text-text-secondary text-[15px] font-inter py-3 pr-4">
                            {row.rate}
                          </td>
                          <td className="text-text-secondary text-[15px] font-inter py-3">
                            {row.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Highlight box */}
                <div className="gsap-fade bg-cream-warm border-l-[3px] border-terracotta p-5 rounded-r-lg">
                  <p className="text-text-primary text-[15px] font-inter leading-relaxed">
                    <strong>Le budget total &agrave; pr&eacute;voir est de 106-108% du
                    prix d&rsquo;achat.</strong> Pr&eacute;voyez une marge de s&eacute;curit&eacute;
                    suppl&eacute;mentaire pour les &eacute;ventuels travaux et l&rsquo;ameublement.
                  </p>
                </div>
              </div>

              {/* Section 4: Le credit immobilier */}
              <div id="credit" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  Financement
                </p>
                <h2 className="gsap-fade font-playfair text-[28px] md:text-[32px] font-medium text-midnight mb-4">
                  Le cr&eacute;dit immobilier au Maroc pour les &eacute;trangers
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  Les banques marocaines accordent des pr&ecirc;ts aux ressortissants
                  &eacute;trangers, sous certaines conditions. Voici ce qu&rsquo;il faut
                  savoir.
                </p>

                {/* Info card: rates */}
                <div className="gsap-fade bg-cream-warm rounded-xl p-6 mb-8 border border-border-warm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                    <p className="text-text-primary text-[15px] font-inter font-medium">
                      Taux d&rsquo;int&eacute;r&ecirc;t actuels :{' '}
                      <strong>5.5% &agrave; 7%</strong> sur 15-20 ans
                    </p>
                  </div>
                  <p className="text-text-secondary text-[14px] font-inter leading-relaxed">
                    Les taux sont l&eacute;g&egrave;rement sup&eacute;rieurs &agrave; ceux pratiqu&eacute;s en
                    France mais restent comp&eacute;titifs eu &eacute;gard au potentiel de
                    valorisation du march&eacute; immobilier marocain.
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
                      <strong>Attention :</strong> les banques marocaines
                      exigent g&eacute;n&eacute;ralement un apport de 30-50% pour les
                      non-r&eacute;sidents. Quelques banques peuvent descendre &agrave; 20%
                      pour des profils tr&egrave;s solides.
                    </p>
                  </div>
                </div>

                {/* Banks list */}
                <h3 className="gsap-fade font-playfair text-[20px] font-semibold text-midnight mb-4">
                  Principales banques
                </h3>
                <div className="gsap-fade grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {banks.map((bank) => (
                    <div
                      key={bank}
                      className="flex items-center gap-3 bg-white border border-border-warm rounded-lg px-4 py-3"
                    >
                      <Check size={16} className="text-palm shrink-0" />
                      <span className="text-text-primary text-[14px] font-inter">
                        {bank}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Required documents */}
                <h3 className="gsap-fade font-playfair text-[20px] font-semibold text-midnight mb-4">
                  Documents requis
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
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 5: La fiscalite */}
              <div id="fiscalite" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  Imp&ocirc;ts
                </p>
                <h2 className="gsap-fade font-playfair text-[28px] md:text-[32px] font-medium text-midnight mb-4">
                  La fiscalit&eacute; immobili&egrave;re au Maroc
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  La fiscalit&eacute; marocaine pr&eacute;sente des sp&eacute;cificit&eacute;s importantes
                  pour les acheteurs &eacute;trangers. Comprendre ces r&egrave;gles vous
                  permet d&rsquo;optimiser votre investissement.
                </p>

                {/* Tax comparison table */}
                <div className="gsap-fade overflow-x-auto mb-8">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border-warm">
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3 pr-4">
                          Taxe
                        </th>
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3 pr-4">
                          R&eacute;sident
                        </th>
                        <th className="text-left text-text-primary font-inter text-[14px] font-semibold py-3">
                          Non-r&eacute;sident
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxData.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-border-warm"
                        >
                          <td className="text-text-primary text-[15px] font-inter py-3 pr-4">
                            {row.category}
                          </td>
                          <td className="text-text-secondary text-[15px] font-inter py-3 pr-4">
                            {row.resident}
                          </td>
                          <td className="text-text-secondary text-[15px] font-inter py-3">
                            {row.nonResident}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info box */}
                <div className="gsap-fade bg-cream-warm border-l-[3px] border-terracotta p-5 rounded-r-lg">
                  <p className="text-text-primary text-[15px] font-inter leading-relaxed">
                    <strong>Bonne nouvelle :</strong> la convention fiscale
                    France-Maroc &eacute;vite la double imposition. Les revenus
                    locatifs sont impos&eacute;s au Maroc et exempt&eacute;s d&rsquo;ISF en
                    France (sous conditions). Consultez un fiscaliste pour
                    optimiser votre situation.
                  </p>
                </div>
              </div>

              {/* Section 6: Les precautions */}
              <div id="precautions" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  S&eacute;curit&eacute;
                </p>
                <h2 className="gsap-fade font-playfair text-[28px] md:text-[32px] font-medium text-midnight mb-6">
                  Pr&eacute;cautions &agrave; prendre
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-6">
                  L&rsquo;achat immobilier au Maroc est s&ucirc;r &agrave; condition de suivre
                  quelques pr&eacute;cautions essentielles. Voici la check-list &agrave;
                  respecter avant toute signature.
                </p>

                {/* Checklist */}
                <div className="gsap-fade grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {precautionsList.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-cream-warm rounded-lg px-4 py-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} className="text-terracotta" />
                      </div>
                      <span className="text-text-primary text-[14px] font-inter">
                        {item}
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
                        Ne signez jamais un compromis sans v&eacute;rification du
                        titre foncier
                      </p>
                      <p className="text-text-secondary text-[14px] font-inter leading-relaxed">
                        Le titre foncier est la seule preuve l&eacute;gale de
                        propri&eacute;t&eacute; au Maroc. Sa v&eacute;rification aupr&egrave;s de la
                        conservation fonci&egrave;re est indispensable avant tout
                        versement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 7: Gestion locative */}
              <div id="gestion" className="guide-section mb-16">
                <p className="gsap-fade text-terracotta text-[12px] font-inter font-medium uppercase tracking-[0.3px] mb-3">
                  Rentabilit&eacute;
                </p>
                <h2 className="gsap-fade font-playfair text-[28px] md:text-[32px] font-medium text-midnight mb-4">
                  La gestion locative
                </h2>
                <p className="gsap-fade text-text-secondary text-[16px] font-inter leading-[1.7] mb-8">
                  Si vous envisagez de louer votre bien, Marrakech offre
                  d&rsquo;excellentes opportunit&eacute;s de rendement, notamment en
                  location saisonni&egrave;re.
                </p>

                <div className="gsap-fade space-y-6 mb-8">
                  <div>
                    <h3 className="font-playfair text-[20px] font-semibold text-midnight mb-2">
                      Location saisonni&egrave;re
                    </h3>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      Avec plus de 13 millions de visiteurs par an, Marrakech
                      est une destination tr&egrave;s pris&eacute;e. Les rendements bruts
                      en location saisonni&egrave;re peuvent atteindre 6% &agrave; 8%. Les
                      villas avec piscine et les riads de charme sont les plus
                      recherch&eacute;s.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-playfair text-[20px] font-semibold text-midnight mb-2">
                      Location longue dur&eacute;e
                    </h3>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      La location longue dur&eacute;e offre des revenus stables avec
                      moins de gestion courante. Les contrats sont
                      g&eacute;n&eacute;ralement sign&eacute;s pour un an renouvelable.
                      Rendements bruts : 4% &agrave; 6%.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-playfair text-[20px] font-semibold text-midnight mb-2">
                      Conciergerie
                    </h3>
                    <p className="text-text-secondary text-[15px] font-inter leading-[1.7]">
                      De nombreuses agences de conciergerie &agrave; Marrakech
                      proposent la gestion compl&egrave;te de votre bien : accueil,
                      m&eacute;nage, maintenance, et promotion sur les plateformes de
                      r&eacute;servation. Leurs honoraires varient de 15% &agrave; 25% des
                      recettes locatives.
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  to="/gestion-locative"
                  className="gsap-fade inline-block bg-palm text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
                >
                  D&eacute;couvrir nos services de gestion
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Download CTA ═══════ */}
      <section ref={ctaRef} className="bg-terracotta py-16 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h3 className="cta-fade font-playfair text-[26px] md:text-[28px] font-medium text-white mb-3">
            T&eacute;l&eacute;chargez notre guide complet
          </h3>
          <p className="cta-fade text-white/80 text-[16px] font-inter mb-8 leading-relaxed">
            Un PDF de 24 pages avec tout ce que vous devez savoir pour acheter
            au Maroc.
          </p>
          <div className="cta-fade flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto mb-4">
            <input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-[48px] px-4 rounded-lg bg-white font-inter text-[14px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={() => alert('Téléchargement bientôt disponible !')}
              className="h-[48px] px-6 bg-white text-terracotta font-inter text-[14px] font-semibold rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              T&eacute;l&eacute;charger
            </button>
          </div>
          <p className="cta-fade text-white/60 text-[12px] font-inter">
            En t&eacute;l&eacute;chargeant, vous acceptez de recevoir nos conseils
            immobiliers. D&eacute;sinscription &agrave; tout moment.
          </p>
        </div>
      </section>

      {/* ═══════ Related Articles ═══════ */}
      <section ref={relatedRef} className="bg-cream-warm py-16 px-6">
        <div className="max-w-[1100px] mx-auto">
          <h3 className="font-playfair text-[28px] font-medium text-midnight mb-8">
            Articles connexes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map((article) => (
              <Link
                key={article.title}
                to="/conseils-immobiliers"
                className="related-card group bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={getImageUrl(article.image, { width: 600, height: 375, resize: 'cover' })}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <span className="bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded mb-3 inline-block uppercase">
                    {article.category}
                  </span>
                  <h4 className="font-playfair text-[16px] font-medium text-text-primary mb-2 line-clamp-2 group-hover:text-terracotta transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-text-secondary text-[13px] font-inter">
                    {article.date}
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
