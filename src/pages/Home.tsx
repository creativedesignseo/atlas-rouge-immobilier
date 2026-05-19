import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import { getImageUrl } from '@/lib/storage'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { getFeaturedProperties } from '@/services/property.service'
import { getNeighborhoods } from '@/services/neighborhood.service'
import type { Property } from '@/data/properties'
import type { Neighborhood } from '@/data/neighborhoods'
import PropertyCard from '@/components/PropertyCard'
import NeighborhoodCard from '@/components/NeighborhoodCard'
import HeroSearch from '@/components/HeroSearch'

gsap.registerPlugin(ScrollTrigger)

/**
 * Editorial home — radical redesign inspired by chrifiahills.com.
 *
 * Hierarchy of moves (what makes this "wow"):
 *   1. Hero is 100vh, full-bleed image, MASSIVE editorial headline
 *      (clamp ~64px mobile → ~180px desktop). No search bar on top of it.
 *   2. Paleta restringida — solo ink (#0F1419) + cream-warm + terracotta como
 *      acento puntual. Adios palm/gold/midnight/sand combos.
 *   3. Espaciado masivo (py-32 / py-40) entre secciones.
 *   4. Una sección oscura mitad-página (bg-ink) que rompe el blanco — el
 *      "contraste editorial" que dan los sitios premium.
 *   5. Grids asimétricos en vez de 3-col simétrico.
 *   6. Sin categorías chunky icons — reemplazadas por una lista editorial.
 */

const blogArticles = [
  {
    image: 'blog-pricing.jpg',
    category: 'Marché',
    title: "Prix de l'immobilier à Marrakech : tendances 2024",
    date: '15 Jan 2024',
  },
  {
    image: 'blog-neighborhood.jpg',
    category: 'Quartiers',
    title: 'Choisir son quartier : Guéliz vs Hivernage',
    date: '8 Jan 2024',
  },
  {
    image: 'guide-buyer.jpg',
    category: 'Achat',
    title: 'Notaire ou Adoul : qui choisir pour votre acte ?',
    date: '2 Jan 2024',
  },
]

function AnimatedCounter({ target, suffix = '', duration = 1.5 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [hasTriggered, setHasTriggered] = useState(false)

  useGSAP(
    () => {
      if (!ref.current || hasTriggered) return
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          setHasTriggered(true)
          const obj = { val: 0 }
          gsap.to(obj, {
            val: target,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
              if (ref.current) {
                ref.current.textContent = Math.round(obj.val).toLocaleString('fr-FR') + suffix
              }
            },
          })
        },
      })
    },
    { scope: ref }
  )

  return <span ref={ref}>0{suffix}</span>
}

export default function Home() {
  const { t } = useTranslation('home')
  const { path } = useLang()
  const heroRef = useRef<HTMLDivElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null)

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [neighborhoodsList, setNeighborhoodsList] = useState<Neighborhood[]>([])

  useEffect(() => {
    getFeaturedProperties(3)
      .then(setFeaturedProperties)
      .catch((err) => console.error('Failed to load featured properties:', err))
    getNeighborhoods()
      .then(setNeighborhoodsList)
      .catch((err) => console.error('Failed to load neighborhoods:', err))
  }, [])

  // Hero — staggered editorial entrance. Letters that fade up.
  useGSAP(
    () => {
      if (!heroTitleRef.current) return
      gsap.from(heroTitleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.2,
      })
      gsap.from(heroSubtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.6,
      })
    },
    { scope: heroRef }
  )

  // Scroll-triggered reveals for sections
  useGSAP(() => {
    gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
    })
  }, [])

  return (
    <div className="bg-cream-warm">
      {/* ═══════════════════ HERO — 100vh, full-bleed ═══════════════════ */}
      <section
        ref={heroRef}
        className="relative h-[100dvh] min-h-[640px] flex items-end overflow-hidden"
      >
        {/* Background image with slow Ken Burns */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{
              backgroundImage: `url(${getImageUrl('marraketch-banner-1.jpg', { width: 2400, height: 1600, resize: 'cover' })})`,
            }}
          />
          {/* Editorial gradient — calm at top, deep at bottom for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/10 to-ink/75" />
        </div>

        {/* Hero content — bottom-aligned, like an editorial cover */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-12 pb-20 md:pb-28">
          {/* Eyebrow */}
          <p
            className="text-white/70 text-[11px] md:text-[12px] uppercase font-inter font-medium mb-6 md:mb-8"
            style={{ letterSpacing: '0.32em' }}
          >
            Marrakech · Atlas Mountains
          </p>

          {/* MASSIVE headline — clamp scales from 56px mobile to 180px desktop */}
          <h1
            ref={heroTitleRef}
            className="font-display font-medium text-white leading-[0.92] tracking-[-0.03em] max-w-[1200px]"
            style={{ fontSize: 'clamp(3.5rem, 11vw, 11rem)' }}
          >
            {t('hero.title')}
          </h1>

          {/* Subtitle — set in serif italic for the editorial contrast */}
          <p
            ref={heroSubtitleRef}
            className="font-serif italic text-white/85 text-[18px] md:text-[22px] lg:text-[26px] mt-8 md:mt-10 max-w-[560px] leading-snug"
          >
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Scroll cue — bottom right, refined */}
        <div className="absolute bottom-8 right-8 lg:right-12 z-10 hidden md:flex items-center gap-3 text-white/60">
          <span
            className="text-[10px] uppercase font-inter font-medium"
            style={{ letterSpacing: '0.3em' }}
          >
            Découvrir
          </span>
          <ArrowDown size={14} strokeWidth={1.5} className="animate-bounce-soft" />
        </div>
      </section>

      {/* ═══════════════════ SEARCH BAR — own section, calm ═══════════════════ */}
      <section className="relative z-20 -mt-12 px-6 lg:px-12 pb-20 md:pb-28">
        <HeroSearch />
      </section>

      {/* ═══════════════════ MANIFESTO — quiet editorial intro ═══════════════════ */}
      <section className="py-32 md:py-48 px-6 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-12 gap-x-8 gap-y-12">
            <div className="col-span-12 md:col-span-3">
              <p
                className="text-stone text-[11px] uppercase font-inter font-medium reveal"
                style={{ letterSpacing: '0.3em' }}
              >
                · 01 ·  Notre approche
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <p
                className="font-display text-ink leading-[1.05] tracking-[-0.02em] reveal"
                style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}
              >
                {t('trust.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ QUARTIERS — asymmetric editorial grid ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          {/* Section opening — left eyebrow + right huge title */}
          <div className="grid grid-cols-12 gap-x-8 mb-16 md:mb-24">
            <div className="col-span-12 md:col-span-4">
              <p
                className="text-stone text-[11px] uppercase font-inter font-medium mb-2 reveal"
                style={{ letterSpacing: '0.3em' }}
              >
                · 02 · {t('neighborhoods.tagline')}
              </p>
            </div>
            <div className="col-span-12 md:col-span-8">
              <h2
                className="font-display text-ink leading-[0.95] tracking-[-0.025em] reveal"
                style={{ fontSize: 'clamp(2.5rem, 7vw, 6.5rem)' }}
              >
                {t('neighborhoods.title')}
              </h2>
              <p className="font-serif italic text-stone text-[18px] md:text-[22px] mt-6 max-w-[560px] reveal">
                {t('neighborhoods.subtitle')}
              </p>
            </div>
          </div>

          {/* Asymmetric grid: first row 2 large, second row 3 medium, etc.
              Simpler: regular 3-col but with looser gaps and no card chrome. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {neighborhoodsList.map((n) => (
              <div key={n.slug} className="reveal">
                <NeighborhoodCard neighborhood={n} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ DARK SECTION — editorial contrast ═══════════════════ */}
      <section className="bg-ink text-cream-warm py-32 md:py-48 px-6 lg:px-12 my-12 md:my-24">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-12 gap-x-8 gap-y-16">
            {/* Big quote-style heading */}
            <div className="col-span-12 md:col-span-7 md:col-start-2">
              <p
                className="text-cream-warm/55 text-[11px] uppercase font-inter font-medium mb-8 reveal"
                style={{ letterSpacing: '0.3em' }}
              >
                · 03 · {t('trust.tagline')}
              </p>
              <h2
                className="font-display font-light leading-[0.98] tracking-[-0.025em] reveal"
                style={{ fontSize: 'clamp(2.5rem, 6.5vw, 6rem)' }}
              >
                {t('trust.title')}
              </h2>
              <p className="font-serif italic text-cream-warm/75 text-[20px] md:text-[26px] leading-snug mt-10 max-w-[640px] reveal">
                {t('cta.subtitle')}
              </p>
            </div>

            {/* Stats — set in a thin column, tabular nums, no decorations */}
            <div className="col-span-12 md:col-span-3 md:col-start-10 flex flex-col gap-12 md:pt-8">
              <div className="reveal">
                <span className="block font-display text-[64px] font-light leading-none tabular-nums text-cream-warm">
                  <AnimatedCounter target={13} />
                </span>
                <p
                  className="text-cream-warm/55 text-[10px] uppercase font-inter font-medium mt-3"
                  style={{ letterSpacing: '0.28em' }}
                >
                  {t('stats.neighborhoods')}
                </p>
              </div>
              <div className="reveal">
                <span className="block font-display text-[64px] font-light leading-none tabular-nums text-cream-warm">
                  <AnimatedCounter target={12} suffix="+" />
                </span>
                <p
                  className="text-cream-warm/55 text-[10px] uppercase font-inter font-medium mt-3"
                  style={{ letterSpacing: '0.28em' }}
                >
                  {t('stats.years')}
                </p>
              </div>
              <div className="reveal">
                <span className="block font-display text-[64px] font-light leading-none tabular-nums text-cream-warm">
                  <AnimatedCounter target={3} />
                </span>
                <p
                  className="text-cream-warm/55 text-[10px] uppercase font-inter font-medium mt-3"
                  style={{ letterSpacing: '0.28em' }}
                >
                  {t('stats.languages')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SÉLECTION — featured properties ═══════════════════ */}
      <section className="py-32 md:py-40 px-6 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-12 gap-x-8 mb-16 md:mb-20">
            <div className="col-span-12 md:col-span-4">
              <p
                className="text-stone text-[11px] uppercase font-inter font-medium mb-2 reveal"
                style={{ letterSpacing: '0.3em' }}
              >
                · 04 · {t('featured.tagline')}
              </p>
            </div>
            <div className="col-span-12 md:col-span-8">
              <h2
                className="font-display text-ink leading-[0.95] tracking-[-0.025em] reveal"
                style={{ fontSize: 'clamp(2.5rem, 7vw, 6.5rem)' }}
              >
                {t('featured.title')}
              </h2>
              <p className="font-serif italic text-stone text-[18px] md:text-[22px] mt-6 max-w-[560px] reveal">
                {t('featured.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {featuredProperties.map((p) => (
              <div key={p.id} className="reveal">
                <PropertyCard property={p} />
              </div>
            ))}
          </div>

          {/* Single editorial CTA — text link, not a button */}
          <div className="mt-20 text-center reveal">
            <Link
              to={path('/buy')}
              className="group inline-flex items-center gap-3 text-ink hover:text-terracotta transition-colors duration-500 ease-premium"
            >
              <span
                className="font-inter text-[11px] uppercase font-medium"
                style={{ letterSpacing: '0.3em' }}
              >
                {t('featured.seeAll')}
              </span>
              <span className="w-12 h-px bg-ink group-hover:bg-terracotta group-hover:w-20 transition-all duration-500 ease-premium" />
              <ArrowRight size={16} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform duration-500 ease-premium" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ JOURNAL — blog teaser ═══════════════════ */}
      <section className="py-32 md:py-40 px-6 lg:px-12 border-t border-border-subtle">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 md:mb-20 gap-6">
            <div>
              <p
                className="text-stone text-[11px] uppercase font-inter font-medium mb-2 reveal"
                style={{ letterSpacing: '0.3em' }}
              >
                · 05 · {t('blog.title')}
              </p>
              <h2
                className="font-display text-ink leading-[0.95] tracking-[-0.025em] reveal"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
              >
                {t('blog.subtitle')}
              </h2>
            </div>
            <Link
              to={path('/blog')}
              className="group hidden md:inline-flex items-center gap-3 text-ink hover:text-terracotta transition-colors duration-500 ease-premium reveal"
            >
              <span
                className="font-inter text-[11px] uppercase font-medium"
                style={{ letterSpacing: '0.3em' }}
              >
                Le Journal
              </span>
              <span className="w-12 h-px bg-ink group-hover:bg-terracotta group-hover:w-20 transition-all duration-500 ease-premium" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-12">
            {blogArticles.map((article, idx) => (
              <Link
                key={idx}
                to={path('/blog')}
                className="group block reveal"
              >
                <div className="aspect-[4/5] overflow-hidden bg-cream rounded-sm mb-5">
                  <img
                    src={getImageUrl(article.image, { width: 800, height: 1000, resize: 'cover' })}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[1200ms] ease-premium"
                    loading="lazy"
                  />
                </div>
                <p
                  className="text-stone text-[10px] uppercase font-inter font-medium mb-3"
                  style={{ letterSpacing: '0.28em' }}
                >
                  {article.category} · {article.date}
                </p>
                <h3 className="font-display text-[22px] md:text-[26px] text-ink leading-tight tracking-tight group-hover:text-terracotta transition-colors duration-500 ease-premium">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA — minimal ═══════════════════ */}
      <section className="py-32 md:py-48 px-6 lg:px-12 border-t border-border-subtle">
        <div className="max-w-[900px] mx-auto text-center">
          <p
            className="text-stone text-[11px] uppercase font-inter font-medium mb-8 reveal"
            style={{ letterSpacing: '0.3em' }}
          >
            · 06 · Contact
          </p>
          <h2
            className="font-display text-ink leading-[0.95] tracking-[-0.03em] reveal"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}
          >
            {t('cta.title')}
          </h2>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 reveal">
            <Link
              to={path('/contact')}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-ink text-cream-warm hover:bg-terracotta transition-colors duration-500 ease-premium rounded-full"
            >
              <span
                className="font-inter text-[11px] uppercase font-medium"
                style={{ letterSpacing: '0.22em' }}
              >
                {t('cta.startSearch')}
              </span>
              <ArrowRight size={14} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform duration-500 ease-premium" />
            </Link>
            <Link
              to={path('/valuation')}
              className="group inline-flex items-center gap-3 text-ink hover:text-terracotta transition-colors duration-500 ease-premium"
            >
              <span
                className="font-inter text-[11px] uppercase font-medium"
                style={{ letterSpacing: '0.22em' }}
              >
                {t('cta.createAlert')}
              </span>
              <span className="w-10 h-px bg-ink group-hover:bg-terracotta group-hover:w-16 transition-all duration-500 ease-premium" />
            </Link>
          </div>
        </div>
      </section>

      {/* Animation keyframes */}
      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        .animate-ken-burns {
          animation: ken-burns 24s ease-in-out infinite alternate;
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(4px); opacity: 1; }
        }
        .animate-bounce-soft {
          animation: bounce-soft 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
