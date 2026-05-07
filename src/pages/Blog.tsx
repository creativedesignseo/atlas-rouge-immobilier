import { useRef, useState } from 'react'
import { getImageUrl } from '@/lib/storage'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/* ── Stable category keys (labels resolved via i18n) ── */
const CATEGORY_KEYS = ['all', 'buying', 'investment', 'neighborhoods', 'taxation', 'decoration'] as const
type CategoryKey = typeof CATEGORY_KEYS[number]

/* ── Article keys + their image (content resolved via t() at render) ──
   Each entry pairs a stable i18n key with the asset filename used by the
   image. The order here is the publication order shown on the page.
*/
const ARTICLE_ENTRIES = [
  { key: 'pricing-trends', image: 'blog-pricing.jpg' },
  { key: 'gueliz-vs-hivernage', image: 'blog-neighborhood.jpg' },
  { key: 'foreigner-guide', image: 'guide-buyer.jpg' },
  { key: 'riad-vs-villa', image: 'property-01.jpg' },
  { key: 'rental-yields', image: 'property-02.jpg' },
  { key: 'palmeraie-luxury', image: 'neighborhood-palmeraie.jpg' },
  { key: 'moroccan-decor', image: 'neighborhood-medina.jpg' },
  { key: 'palmeraie-vs-hivernage', image: 'neighborhood-ourika.jpg' },
  { key: 'eco-houses', image: 'neighborhood-amelkis.jpg' },
] as const

const FEATURED_IMAGE = 'blog-pricing.jpg'

export default function Blog() {
  const { path } = useLang()
  const { t } = useTranslation('blog')
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [email, setEmail] = useState('')

  const heroRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const newsletterRef = useRef<HTMLDivElement>(null)

  /* Filter articles by category — comparison is on the stable category KEY,
     not on the translated label, so it works in any language. */
  const filteredArticles =
    activeCategory === 'all'
      ? ARTICLE_ENTRIES
      : ARTICLE_ENTRIES.filter(
          (a) => t(`articles.${a.key}.category`) === activeCategory
        )

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
      })
        .from(
          heroRef.current!.querySelector('.hero-subtitle'),
          { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.45'
        )
        .from(
          heroRef.current!.querySelectorAll('.hero-chip'),
          {
            y: 15,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: 'power3.out',
          },
          '-=0.3'
        )
    },
    { scope: heroRef }
  )

  /* Featured article animation */
  useGSAP(
    () => {
      if (!featuredRef.current) return
      gsap.from(featuredRef.current!.querySelector('.featured-image'), {
        x: -30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: featuredRef.current,
          start: 'top 85%',
          once: true,
        },
      })
      gsap.from(
        featuredRef.current!.querySelector('.featured-content'),
        {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: {
            trigger: featuredRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      )
    },
    { scope: featuredRef }
  )

  /* Grid animation */
  useGSAP(
    () => {
      if (!gridRef.current) return
      gsap.from(gridRef.current!.querySelectorAll('.article-card'), {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: gridRef }
  )

  /* Newsletter animation */
  useGSAP(
    () => {
      if (!newsletterRef.current) return
      gsap.from(newsletterRef.current!.querySelectorAll('.nl-fade'), {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: newsletterRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: newsletterRef }
  )

  return (
    <div>
      {/* ═══════ Hero Section ═══════ */}
      <section ref={heroRef} className="bg-cream-warm pt-[80px] pb-12 px-6">
        <div className="max-w-[1100px] mx-auto text-center">
          {/* Breadcrumb */}
          <p className="text-text-secondary text-[13px] font-inter mb-6">
            <Link to={path('/')} className="hover:text-terracotta transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <span className="mx-2">&gt;</span>
            <span>{t('breadcrumb.blog')}</span>
          </p>

          <h1 className="hero-title font-playfair text-[38px] md:text-[44px] font-medium text-midnight leading-tight mb-4">
            {t('hero.title')}
          </h1>
          <p className="hero-subtitle text-text-secondary text-[16px] font-inter max-w-[600px] mx-auto mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Category chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORY_KEYS.map((catKey) => (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={cn(
                  'hero-chip px-4 py-2 rounded-pill text-[13px] font-inter font-medium transition-all duration-200',
                  activeCategory === catKey
                    ? 'bg-palm text-white'
                    : 'bg-sand/30 text-text-primary hover:bg-sand/50'
                )}
              >
                {t(`categories.${catKey}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Featured Article — only on 'all' (it's a market overview) ═══════ */}
      {activeCategory === 'all' && (
        <section className="bg-white py-12 px-6">
          <div ref={featuredRef} className="max-w-[1100px] mx-auto">
            <div className="bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-[55%_45%]">
                {/* Image */}
                <div className="featured-image aspect-video lg:aspect-auto overflow-hidden">
                  <img
                    src={getImageUrl(FEATURED_IMAGE, { width: 800, height: 500, resize: 'cover' })}
                    alt={t('featured.title')}
                    className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-400"
                  />
                </div>

                {/* Content */}
                <div className="featured-content p-6 md:p-10 flex flex-col justify-center">
                  <span className="bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded mb-4 inline-block self-start uppercase tracking-wide">
                    {t(`categories.${t('featured.category')}`)}
                  </span>
                  <h2 className="font-playfair text-[22px] md:text-[28px] font-medium text-midnight leading-snug mb-4">
                    {t('featured.title')}
                  </h2>
                  <p className="text-text-secondary text-[15px] md:text-[16px] font-inter leading-[1.7] mb-4 line-clamp-3">
                    {t('featured.excerpt')}
                  </p>
                  <p className="text-text-secondary text-[13px] font-inter mb-5">
                    {t('featured.date')} &middot; {t('featured.readTime')} {t('readTimeSuffix')}
                  </p>
                  <Link
                    to={path('/blog')}
                    className="text-terracotta text-[16px] font-inter font-medium hover:underline self-start"
                  >
                    {t('readMore')} &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ Article Grid ═══════ */}
      <section className="bg-white py-12 px-6">
        <div ref={gridRef} className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const categoryKey = t(`articles.${article.key}.category`)
              return (
                <Link
                  key={article.key}
                  to={path('/blog')}
                  className="article-card group bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                >
                  {/* Image */}
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={getImageUrl(article.image, { width: 600, height: 375, resize: 'cover' })}
                      alt={t(`articles.${article.key}.title`)}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Category badge */}
                    <span
                      className={cn(
                        'text-[11px] font-semibold px-2 py-1 rounded mb-3 inline-block uppercase tracking-wide',
                        categoryKey === 'buying' && 'bg-terracotta/10 text-terracotta',
                        categoryKey === 'investment' && 'bg-gold/20 text-midnight',
                        categoryKey === 'neighborhoods' && 'bg-palm/10 text-palm',
                        categoryKey === 'taxation' && 'bg-sand/50 text-text-primary',
                        categoryKey === 'decoration' && 'bg-sand/50 text-text-primary',
                        !['buying', 'investment', 'neighborhoods', 'taxation', 'decoration'].includes(categoryKey) && 'bg-sand/30 text-text-primary'
                      )}
                    >
                      {t(`categories.${categoryKey}`)}
                    </span>

                    <h3 className="font-playfair text-[16px] font-medium text-text-primary mb-2 line-clamp-2 group-hover:text-terracotta transition-colors leading-snug">
                      {t(`articles.${article.key}.title`)}
                    </h3>

                    <p className="text-text-secondary text-[14px] font-inter leading-relaxed mb-4 line-clamp-2">
                      {t(`articles.${article.key}.excerpt`)}
                    </p>

                    <div className="flex items-center gap-3 text-text-secondary text-[12px] font-inter">
                      <span>{t(`articles.${article.key}.date`)}</span>
                      <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {t(`articles.${article.key}.readTime`)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════ Newsletter CTA ═══════ */}
      <section ref={newsletterRef} className="bg-midnight py-16 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h3 className="nl-fade font-playfair text-[26px] md:text-[28px] font-medium text-white mb-3">
            {t('newsletter.title')}
          </h3>
          <p className="nl-fade text-white/75 text-[16px] font-inter mb-8 leading-relaxed">
            {t('newsletter.subtitle')}
          </p>
          <div className="nl-fade flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto mb-4">
            <input
              type="email"
              placeholder={t('newsletter.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-[48px] px-4 rounded-lg bg-white font-inter text-[14px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={() => alert(t('newsletter.alertSoon'))}
              className="h-[48px] px-6 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:bg-terracotta/90 transition-colors"
            >
              {t('newsletter.submit')}
            </button>
          </div>
          <p className="nl-fade text-white/50 text-[12px] font-inter">
            {t('newsletter.disclaimer')}
          </p>
        </div>
      </section>
    </div>
  )
}
