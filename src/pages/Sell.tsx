import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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

/* ── FAQ data ── */
const faqItems = [
  {
    question: 'Combien co\u00FBte une estimation ?',
    answer: 'L\u2019estimation de votre bien est enti\u00E8rement gratuite et sans engagement. Nos experts analysent votre propri\u00E9t\u00E9 en fonction du march\u00E9 local, des caract\u00E9ristiques du bien et des tendances r\u00E9centes du quartier.',
  },
  {
    question: 'Combien de temps pour vendre ?',
    answer: 'Le d\u00E9lai moyen de vente \u00E0 Marrakech est de 3 \u00E0 6 mois selon le quartier et le type de bien. Les villas haut de gamme peuvent prendre un peu plus de temps, tandis que les appartements bien situ\u00E9s se vendent plus rapidement.',
  },
  {
    question: 'Quels documents sont n\u00E9cessaires ?',
    answer: 'Titre foncier, plan de lotissement, acte de propri\u00E9t\u00E9, et attestations fiscales. Notre \u00E9quipe vous accompagne dans la constitution de votre dossier.',
  },
  {
    question: 'Puis-je vendre depuis la France ?',
    answer: 'Oui, un mandat sign\u00E9 chez un notaire fran\u00E7ais suffit pour repr\u00E9senter votre vente. Nous g\u00E9rons l\u2019int\u00E9gralit\u00E9 de la transaction \u00E0 distance.',
  },
  {
    question: 'Quels sont les frais d\u2019agence ?',
    answer: 'Les honoraires d\u2019agence sont g\u00E9n\u00E9ralement de 5% TTC pour la vente, \u00E0 la charge de l\u2019acheteur. Ce taux peut varier selon le mandat et le type de bien.',
  },
  {
    question: 'Comment se passe la signature ?',
    answer: 'La signature a lieu chez le notaire ou l\u2019Adoul, avec traducteur si n\u00E9cessaire. Nous organisons tous les rendez-vous et vous accompagnons \u00E0 chaque \u00E9tape.',
  },
]

/* ── Agent mock data ── */
const agents = [
  {
    name: 'Immobili\u00E8re Palmeraie',
    stats: '47 biens \u00B7 4.8/5',
    rating: 4.8,
    properties: 47,
    specialties: ['Vente', 'Villa', 'Prestige'],
    location: 'Palmeraie, Marrakech',
    initials: 'IP',
  },
  {
    name: 'M\u00E9dina Immobilier',
    stats: '32 biens \u00B7 4.7/5',
    rating: 4.7,
    properties: 32,
    specialties: ['Vente', 'Riad', 'Location'],
    location: 'M\u00E9dina, Marrakech',
    initials: 'MI',
  },
  {
    name: 'Gueliz Properties',
    stats: '65 biens \u00B7 4.6/5',
    rating: 4.6,
    properties: 65,
    specialties: ['Vente', 'Appartement', 'Neuf'],
    location: 'Gueliz, Marrakech',
    initials: 'GP',
  },
  {
    name: 'Hivernage Prestige',
    stats: '28 biens \u00B7 4.9/5',
    rating: 4.9,
    properties: 28,
    specialties: ['Vente', 'Prestige', 'Location'],
    location: 'Hivernage, Marrakech',
    initials: 'HP',
  },
  {
    name: 'Atlas Golf Immobilier',
    stats: '41 biens \u00B7 4.7/5',
    rating: 4.7,
    properties: 41,
    specialties: ['Vente', 'Villa', 'Location'],
    location: 'Amelkis, Marrakech',
    initials: 'AG',
  },
  {
    name: 'Ourika Valley Homes',
    stats: '19 biens \u00B7 4.5/5',
    rating: 4.5,
    properties: 19,
    specialties: ['Vente', 'Terrain', 'Villa'],
    location: 'Route de l\u2019Ourika, Marrakech',
    initials: 'OV',
  },
]

/* ── How it works steps ── */
const steps = [
  {
    number: '01',
    title: 'Estimation',
    description: '\u00C9valuation gratuite et r\u00E9aliste de votre bien par nos experts.',
  },
  {
    number: '02',
    title: 'Mise en valeur',
    description: 'Photos professionnelles, visite virtuelle et description optimis\u00E9e.',
  },
  {
    number: '03',
    title: 'Diffusion',
    description: 'Votre annonce est diffus\u00E9e aupr\u00E8s de notre r\u00E9seau d\u2019acheteurs qualifi\u00E9s.',
  },
  {
    number: '04',
    title: 'Vente',
    description: 'Accompagnement jusqu\u2019\u00E0 la signature chez le notaire.',
  },
]

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

  /* Filtered agents */
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
            <Link to="/" className="hover:text-terracotta transition-colors">
              Accueil
            </Link>
            <span className="mx-2">&gt;</span>
            <span>Vendre</span>
          </p>

          <h1 className="hero-title font-playfair text-[42px] md:text-[48px] font-medium text-midnight leading-tight max-w-[700px] mx-auto mb-6">
            Vendez ou louez votre bien &agrave; Marrakech
          </h1>
          <p className="hero-subtitle text-text-secondary text-[17px] md:text-[18px] font-inter max-w-[560px] mx-auto mb-8 leading-relaxed">
            Estimation gratuite, mise en valeur professionnelle, et diffusion
            aupr&egrave;s de milliers d&rsquo;acheteurs fran&ccedil;ais.
          </p>
          <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/estimation"
              className="bg-terracotta text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
            >
              Estimer mon bien
            </Link>
            <Link
              to="#depot"
              className="bg-white text-text-primary font-inter text-[14px] font-semibold px-6 py-3 rounded-lg border border-border-warm hover:scale-[1.02] transition-transform"
            >
              D&eacute;poser une annonce
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
          {/* Card 1 */}
          <div
            id="depot"
            className="feature-card bg-white rounded-card border border-border-warm p-8 md:p-12 shadow-card"
          >
            <div className="w-12 h-12 text-terracotta mb-4">
              <Upload size={48} strokeWidth={1.5} />
            </div>
            <h3 className="font-playfair text-[28px] font-medium text-text-primary mb-4">
              D&eacute;poser une annonce
            </h3>
            <p className="text-text-secondary text-[16px] font-inter leading-[1.7] mb-6">
              Publiez votre annonce gratuitement et touchez directement les
              acheteurs. Photos illimit&eacute;es, description d&eacute;taill&eacute;e, et
              visibilit&eacute; imm&eacute;diate.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Annonce gratuite',
                'Photos illimit&eacute;es',
                'Visibilit&eacute; aupr&egrave;s de 50 000+ visiteurs mensuels',
                'Gestion depuis votre espace personnel',
              ].map((item) => (
                <li
                  key={item}
                  className="feature-check flex items-center gap-3 text-text-primary text-[14px] font-inter"
                >
                  <Check
                    size={18}
                    className="text-palm shrink-0"
                    strokeWidth={2.5}
                  />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="/vendre#depot"
                className="bg-terracotta text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
              >
                D&eacute;poser mon annonce
              </Link>
              <Link
                to="#"
                className="text-terracotta font-inter text-[14px] font-medium hover:underline"
              >
                En savoir plus
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card bg-white rounded-card border border-border-warm p-8 md:p-12 shadow-card">
            <div className="w-12 h-12 text-palm mb-4">
              <Users size={48} strokeWidth={1.5} />
            </div>
            <h3 className="font-playfair text-[28px] font-medium text-text-primary mb-4">
              Mandater une agence immobili&egrave;re
            </h3>
            <p className="text-text-secondary text-[16px] font-inter leading-[1.7] mb-6">
              Confiez la vente de votre bien &agrave; un professionnel de votre quartier.
              Expertise locale, n&eacute;gociation, et accompagnement jusqu&rsquo;&agrave; la
              signature.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Estimation professionnelle',
                'Photos et visite virtuelle',
                'Diffusion sur notre r&eacute;seau partenaire',
                'Accompagnement administratif complet',
              ].map((item) => (
                <li
                  key={item}
                  className="feature-check flex items-center gap-3 text-text-primary text-[14px] font-inter"
                >
                  <Check
                    size={18}
                    className="text-palm shrink-0"
                    strokeWidth={2.5}
                  />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="#agents"
                className="bg-palm text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
              >
                Trouver une agence
              </Link>
              <Link
                to="#comment"
                className="text-palm font-inter text-[14px] font-medium hover:underline"
              >
                Comment &ccedil;a marche ?
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
            Comment &ccedil;a marche
          </p>
          <h2 className="hiw-title font-playfair text-[36px] md:text-[40px] font-medium text-midnight text-center mb-16">
            Vendre votre bien en 4 &eacute;tapes
          </h2>

          {/* Steps */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Dashed connector line - desktop */}
            <div className="hidden lg:block absolute top-[30px] left-[12%] right-[12%] border-t border-dashed border-sand" />

            {steps.map((step) => (
              <div key={step.number} className="hiw-step relative text-center">
                <span className="font-playfair text-[48px] font-semibold text-terracotta/30 block mb-3">
                  {step.number}
                </span>
                <h4 className="font-playfair text-[20px] font-semibold text-midnight mb-2">
                  {step.title}
                </h4>
                <p className="text-text-secondary text-[14px] font-inter leading-relaxed">
                  {step.description}
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
            Trouvez une agence immobili&egrave;re &agrave; Marrakech
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
                placeholder="Quartier ou ville"
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
              <option value="">Sp&eacute;cialit&eacute;</option>
              <option value="Vente">Vente</option>
              <option value="Location">Location</option>
              <option value="Neuf">Neuf</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-[44px] px-4 border border-border-warm rounded-lg bg-white font-inter text-[14px] text-text-primary focus:outline-none focus:border-terracotta"
            >
              <option value="">Type de bien</option>
              <option value="Villa">Villa</option>
              <option value="Appartement">Appartement</option>
              <option value="Riad">Riad</option>
              <option value="Prestige">Prestige</option>
            </select>
          </div>

          {/* Agent cards grid */}
          <div className="agent-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
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
                        {agent.properties} biens &middot; {agent.rating}/5
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
                      {s}
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
                  Voir le profil
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ Accordion ═══════ */}
      <section ref={faqRef} className="bg-cream-warm py-16 md:py-24 px-6">
        <div className="max-w-[720px] mx-auto">
          <h2 className="faq-title font-playfair text-[36px] md:text-[40px] font-medium text-midnight text-center mb-12">
            Questions fr&eacute;quemment pos&eacute;es
          </h2>
          <div>
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <FaqItem
                  question={item.question}
                  answer={item.answer}
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
