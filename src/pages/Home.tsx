import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import { getImageUrl } from '@/lib/storage'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Home as HomeIcon,
  Building,
  Landmark,
  Star,
  TreePine,
  Maximize,
  KeyRound,
  Tag,
  FileText,
  Calculator,
  ShieldCheck,
  Users,
  ArrowRight,
} from 'lucide-react'
import { getFeaturedProperties } from '@/services/property.service'
import { getNeighborhoods } from '@/services/neighborhood.service'
import { listPosts, type BlogPost } from '@/services/blog.service'
import type { Property } from '@/data/properties'
import type { Neighborhood } from '@/data/neighborhoods'
import PropertyCard from '@/components/PropertyCard'
import NeighborhoodCard from '@/components/NeighborhoodCard'
import ServiceCard from '@/components/ServiceCard'
import HeroSearch from '@/components/HeroSearch'

gsap.registerPlugin(ScrollTrigger)


const categories = [
  { icon: <HomeIcon size={32} />, labelKey: 'villas', typeParam: 'villa' },
  { icon: <Building size={32} />, labelKey: 'apartments', typeParam: 'appartement' },
  { icon: <Landmark size={32} />, labelKey: 'riads', typeParam: 'riad' },
  { icon: <Star size={32} />, labelKey: 'prestige', typeParam: 'prestige' },
  { icon: <TreePine size={32} />, labelKey: 'land', typeParam: 'terrain' },
  { icon: <Maximize size={32} />, labelKey: 'rooftops', typeParam: 'rooftop' },
]

const serviceKeys = ['buy', 'sell', 'rent', 'estimate', 'management', 'support'] as const


const serviceIcons: Record<string, React.ReactNode> = {
  buy: <KeyRound size={40} />,
  sell: <Tag size={40} />,
  rent: <FileText size={40} />,
  estimate: <Calculator size={40} />,
  management: <ShieldCheck size={40} />,
  support: <Users size={40} />,
}

// Destino de cada service card. Las rutas se traducen automáticamente
// vía path() según el idioma activo (canonical keys de src/lib/routes.ts).
const serviceLinks: Record<string, string> = {
  buy: '/buy',
  sell: '/sell',
  rent: '/rent',
  estimate: '/valuation',
  management: '/propertyManagement',
  support: '/contact',
}

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
  const { t, i18n } = useTranslation('home')
  const { t: tBlog } = useTranslation('blog')
  const { path } = useLang()
  const heroRef = useRef<HTMLDivElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null)
  const heroSearchRef = useRef<HTMLDivElement>(null)
  const exploreRef = useRef<HTMLElement>(null)
  const featuredRef = useRef<HTMLElement>(null)
  const categoriesRef = useRef<HTMLElement>(null)
  const servicesRef = useRef<HTMLElement>(null)
  const trustRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const blogRef = useRef<HTMLElement>(null)

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [neighborhoodsList, setNeighborhoodsList] = useState<Neighborhood[]>([])
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    getFeaturedProperties(3)
      .then(setFeaturedProperties)
      .catch((err) => console.error('Failed to load featured properties:', err))
    getNeighborhoods()
      .then(setNeighborhoodsList)
      .catch((err) => console.error('Failed to load neighborhoods:', err))
    listPosts({ publishedOnly: true, limit: 3 })
      .then(setLatestPosts)
      .catch((err) => console.error('Failed to load blog posts:', err))
  }, [i18n.language])

  // Hero entrance animations
  useGSAP(
    () => {
      if (!heroTitleRef.current) return
      gsap.from(heroTitleRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.2,
      })
      gsap.from(heroSubtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.4,
      })
      gsap.from(heroSearchRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.6,
      })
    },
    { scope: heroRef }
  )

  // Section reveal animations
  useGSAP(
    () => {
      const sections = [
        exploreRef.current,
        featuredRef.current,
        categoriesRef.current,
        servicesRef.current,
        trustRef.current,
        ctaRef.current,
        blogRef.current,
      ]
      sections.forEach((section) => {
        if (!section) return
        const header = section.querySelector('.section-header')
        const content = section.querySelector('.section-content')
        if (header) {
          gsap.from(header.children, {
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
        }
        if (content) {
          gsap.from(content.children, {
            y: 40,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.12,
            scrollTrigger: {
              trigger: content,
              start: 'top 85%',
              once: true,
            },
          })
        }
      })
    },
    { scope: heroRef }
  )

  // Trust section image
  useGSAP(
    () => {
      if (!trustRef.current) return
      const img = trustRef.current.querySelector('.trust-image')
      if (img) {
        gsap.from(img, {
          x: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: trustRef.current,
            start: 'top 85%',
            once: true,
          },
        })
      }
    },
    { scope: trustRef }
  )

  return (
    <div>
      {/* ====== HERO ====== */}
      <section
        ref={heroRef}
        className="relative z-30 min-h-[560px] md:min-h-[640px] lg:min-h-[680px] flex items-center justify-center"
      >
        {/* Background with Ken Burns — overflow-hidden is contained HERE
            (not on the section) so the Ken Burns scaling animation is
            clipped, but the hero search dropdowns can extend beyond the
            section boundary on top of the next section below. */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{ backgroundImage: `url(${getImageUrl('marraketch-banner-1.jpg', { width: 1920, height: 800, resize: 'cover' })})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(23,32,51,0.55)] to-[rgba(23,32,51,0.75)]" />
        </div>

        {/* Content — paddings tightened so the search bar is visible
            without scrolling on most viewports. Title block stays narrow
            (max-w-800); search bar wrapper is wider. */}
        <div className="relative z-10 text-center px-6 pt-16 pb-8 md:pt-20 md:pb-12 w-full">
          <div className="max-w-[800px] mx-auto">
            <h1
              ref={heroTitleRef}
              className="font-display text-[32px] md:text-[48px] lg:text-[52px] font-medium text-white leading-[1.1] tracking-[-0.5px] mb-4 md:mb-5"
            >
              {t('hero.title')}
            </h1>
            <p
              ref={heroSubtitleRef}
              className="text-white/85 text-[15px] md:text-[17px] font-inter font-normal mb-6 md:mb-8"
            >
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Search bar — own container that respects HeroSearch's own
              max-w. Wider than the title block so tabs + type + search +
              Buscar all fit on a single row without cropping. */}
          <div ref={heroSearchRef} className="max-w-[1140px] mx-auto">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ====== EXPLORE MARRAKECH ====== */}
      <section ref={exploreRef} className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="section-header text-center mb-12">
            <span className="text-terracotta text-[12px] font-inter font-medium uppercase tracking-[2px]">
              {t('neighborhoods.tagline')}
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] font-medium text-midnight mt-3 mb-4">
              {t('neighborhoods.title')}
            </h2>
            <p className="text-text-secondary text-[16px] font-inter max-w-[600px] mx-auto">
              {t('neighborhoods.subtitle')}
            </p>
          </div>
          <div className="section-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighborhoodsList.map((n) => (
              <NeighborhoodCard key={n.slug} neighborhood={n} />
            ))}
          </div>
        </div>
      </section>

      {/* ====== FEATURED PROPERTIES ====== */}
      <section ref={featuredRef} className="bg-cream-warm py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="section-header text-center mb-12">
            <span className="text-palm text-[12px] font-inter font-medium uppercase tracking-[2px]">
              {t('featured.tagline')}
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] font-medium text-midnight mt-3 mb-4">
              {t('featured.title')}
            </h2>
            <p className="text-text-secondary text-[16px] font-inter max-w-[600px] mx-auto">
              {t('featured.subtitle')}
            </p>
          </div>
          <div className="section-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to={path('/acheter')}
              className="inline-flex items-center gap-2 text-terracotta text-[16px] font-inter font-medium hover:underline"
            >
              {t('featured.seeAll')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== PROPERTY CATEGORIES ====== */}
      <section ref={categoriesRef} className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="section-header text-center mb-10">
            <h2 className="font-display text-[32px] md:text-[40px] font-medium text-midnight">
              {t('categories.subtitle')}
            </h2>
          </div>
          <div className="section-content flex gap-4 overflow-x-auto pb-4 justify-start md:justify-center">
            {categories.map((cat) => (
              <Link
                key={cat.labelKey}
                to={path(`/acheter?type=${cat.typeParam}`)}
                className="flex flex-col items-center justify-center w-[160px] min-w-[160px] h-[120px] bg-cream-warm rounded-xl hover:bg-[rgba(216,195,165,0.4)] transition-colors group"
              >
                <span className="text-text-secondary group-hover:text-terracotta transition-colors mb-2">
                  {cat.icon}
                </span>
                <span className="text-text-primary text-[14px] font-inter font-medium text-center px-2">
                  {t(`categories.${cat.labelKey}`)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== SERVICES ====== */}
      <section ref={servicesRef} className="bg-cream-warm py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="section-header text-center mb-12">
            <span className="text-terracotta text-[12px] font-inter font-medium uppercase tracking-[2px]">
              {t('services.title')}
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] font-medium text-midnight mt-3 mb-4">
              {t('services.subtitle')}
            </h2>
          </div>
          <div className="section-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceKeys.map((key) => (
              <ServiceCard
                key={key}
                icon={serviceIcons[key]}
                title={t(`services.${key}.title`)}
                description={t(`services.${key}.description`)}
                to={path(serviceLinks[key])}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====== TRUST ====== */}
      <section ref={trustRef} className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Left content */}
            <div className="lg:col-span-3 section-header">
              <span className="text-palm text-[12px] font-inter font-medium uppercase tracking-[2px]">
                {t('trust.tagline')}
              </span>
              <h2 className="font-display text-[32px] md:text-[40px] font-medium text-midnight mt-3 mb-6">
                {t('trust.title')}
              </h2>
              <p className="text-text-primary text-[16px] font-inter leading-[1.7] mb-8">
                {t('trust.description')}
              </p>

              {/* Stats — claims verificables, no marketing inflado */}
              <div className="flex flex-wrap gap-8 md:gap-12">
                <div>
                  <span className="font-display text-[32px] font-medium text-terracotta">
                    <AnimatedCounter target={13} />
                  </span>
                  <p className="text-text-secondary text-[14px] font-inter mt-1">
                    {t('stats.neighborhoods')}
                  </p>
                </div>
                <div>
                  <span className="font-display text-[32px] font-medium text-terracotta">
                    <AnimatedCounter target={12} suffix="+" />
                  </span>
                  <p className="text-text-secondary text-[14px] font-inter mt-1">
                    {t('stats.years')}
                  </p>
                </div>
                <div>
                  <span className="font-display text-[32px] font-medium text-terracotta">
                    <AnimatedCounter target={3} />
                  </span>
                  <p className="text-text-secondary text-[14px] font-inter mt-1">
                    {t('stats.languages')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right image */}
            <div className="lg:col-span-2">
              <div className="trust-image rounded-card overflow-hidden shadow-card">
                <img
                  src={getImageUrl('property-01.jpg', { width: 800, height: 600, resize: 'cover' })}
                  alt={t('trust.title')}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA BANNER ====== */}
      <section
        ref={ctaRef}
        className="bg-midnight py-16 md:py-24 flex items-center justify-center"
      >
        <div className="max-w-[700px] mx-auto px-6 text-center section-header">
          <h2 className="font-display text-[32px] md:text-[40px] font-medium text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-white/75 text-[16px] font-inter mb-8">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={path('/acheter')}
              className="bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
            >
              {t('cta.startSearch')}
            </Link>
            <Link
              to={path('/contact')}
              className="border border-terracotta text-terracotta font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:bg-terracotta/10 transition-colors"
            >
              {t('cta.createAlert')}
            </Link>
          </div>
        </div>
      </section>

      {/* ====== BLOG TEASER ====== */}
      {latestPosts.length > 0 && (
        <section ref={blogRef} className="bg-cream-warm py-14 sm:py-16 md:py-24">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-12">
            <div className="section-header text-center mb-10 sm:mb-12">
              <span className="text-terracotta text-[11.5px] sm:text-[12px] font-inter font-medium uppercase tracking-[2px]">
                {t('blog.title')}
              </span>
              <h2 className="font-display text-[26px] sm:text-[32px] md:text-[40px] font-medium text-midnight mt-3 mb-4 leading-tight">
                {t('blog.subtitle')}
              </h2>
            </div>
            <div className="section-content grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {latestPosts.map((post) => {
                const localeMap = { fr: 'fr-FR', es: 'es-ES', en: 'en-US' } as const
                const lang2 = (i18n.language?.slice(0, 2) || 'fr') as keyof typeof localeMap
                const fmtDate = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString(localeMap[lang2] || 'fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''
                return (
                  <Link
                    key={post.id}
                    to={path(`/blog/${post.slug}`)}
                    className="bg-white rounded-card overflow-hidden shadow-card hover:shadow-card-hover active:shadow-card transition-all duration-250 group"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getImageUrl(post.coverImage || 'blog-pricing.jpg', {
                          width: 600,
                          height: 400,
                          resize: 'cover',
                        })}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 sm:p-5">
                      <span className="text-terracotta text-[10.5px] sm:text-[11px] font-inter font-medium uppercase tracking-wide">
                        {tBlog(`categories.${post.category}`, post.category)}
                      </span>
                      <h3 className="font-display text-[17px] sm:text-[18px] font-medium text-text-primary mt-2 mb-2 line-clamp-2 group-hover:text-terracotta transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-text-secondary text-[12px] font-inter">{fmtDate}</p>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Link a todo el blog */}
            <div className="text-center mt-8 sm:mt-10">
              <Link
                to={path('/blog')}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 text-text-primary hover:text-terracotta font-inter text-[14px] font-medium transition-colors"
              >
                {t('blog.seeAll', 'Ver todos los artículos')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Ken Burns animation style */}
      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .animate-ken-burns {
          animation: ken-burns 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  )
}
