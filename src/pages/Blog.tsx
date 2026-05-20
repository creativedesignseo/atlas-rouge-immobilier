import { useEffect, useRef, useState } from 'react'
import { getImageUrl } from '@/lib/storage'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { listPosts, type BlogPost, type BlogCategory } from '@/services/blog.service'
import { subscribeNewsletter } from '@/services/leads.service'
import { toast } from 'sonner'

gsap.registerPlugin(ScrollTrigger)

/* Categorías disponibles (alineadas con el CHECK constraint de blog_posts.category) */
const CATEGORY_KEYS = ['all', 'buying', 'investment', 'neighborhoods', 'taxation', 'decoration', 'market'] as const
type CategoryFilter = typeof CATEGORY_KEYS[number]

/**
 * Listado de artículos del blog.
 * Trae los posts publicados desde Supabase (blog_posts + blog_post_translations).
 * Mientras no haya posts en Supabase, muestra un estado vacío honesto.
 */
export default function Blog() {
  const { path, lang } = useLang()
  const { t } = useTranslation('blog')
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [email, setEmail] = useState('')
  const [nlSubmitting, setNlSubmitting] = useState(false)
  const [nlSubscribed, setNlSubscribed] = useState(false)

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setNlSubmitting(true)
    const result = await subscribeNewsletter(email, lang, '/blog')
    setNlSubmitting(false)
    if (result.success) {
      setNlSubscribed(true)
      setEmail('')
      toast.success(t('newsletter.successToast', '¡Suscripción confirmada!'))
    } else {
      toast.error(
        result.error || t('newsletter.errorGeneric', 'No se pudo suscribir'),
      )
    }
  }
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const heroRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const newsletterRef = useRef<HTMLDivElement>(null)

  /* Cargar posts de Supabase (re-fetch cuando cambia el idioma para refrescar traducciones) */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listPosts({ publishedOnly: true })
      .then((rows) => {
        if (!cancelled) setPosts(rows)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [lang])

  /* Filtro por categoría usando la KEY estable (no la traducción) */
  const filteredPosts =
    activeCategory === 'all' ? posts : posts.filter((p) => p.category === activeCategory)

  /* Primer post como "featured" cuando estamos en 'all' y hay al menos 1 */
  const featuredPost = activeCategory === 'all' && filteredPosts.length > 0 ? filteredPosts[0] : null
  const gridPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts

  /* Hero animations — fromTo defensivo en cada paso de la timeline */
  useGSAP(
    () => {
      if (!heroRef.current) return
      const tl = gsap.timeline()
      const title = heroRef.current.querySelector('.hero-title')
      const subtitle = heroRef.current.querySelector('.hero-subtitle')
      const chips = heroRef.current.querySelectorAll('.hero-chip')
      if (title) {
        tl.fromTo(
          title,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
        )
      }
      if (subtitle) {
        tl.fromTo(
          subtitle,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.45',
        )
      }
      if (chips.length) {
        tl.fromTo(
          chips,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power3.out' },
          '-=0.3',
        )
      }
    },
    { scope: heroRef },
  )

  /* Newsletter animation */
  useGSAP(
    () => {
      if (!newsletterRef.current) return
      gsap.fromTo(
        newsletterRef.current!.querySelectorAll('.nl-fade'),
        { y: 30, opacity: 0 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: newsletterRef.current, start: 'top 85%', once: true } },
      )
    },
    { scope: newsletterRef },
  )

  /* Helper: link a artículo individual respetando idioma */
  const articleHref = (slug: string) => path(`/blog/${slug}`)

  /* Fecha localizada a partir de published_at */
  const formatDate = (iso: string | null) => {
    if (!iso) return ''
    try {
      const localeMap = { fr: 'fr-FR', es: 'es-ES', en: 'en-US' } as const
      return new Date(iso).toLocaleDateString(localeMap[lang] || 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div>
      {/* ═══════ Hero ═══════ */}
      <section ref={heroRef} className="bg-cream-warm pt-[80px] pb-12 px-6">
        <div className="max-w-[1100px] mx-auto text-center">
          <p className="text-text-secondary text-[13px] font-inter mb-6">
            <Link to={path('/')} className="hover:text-terracotta transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <span className="mx-2">&gt;</span>
            <span>{t('breadcrumb.blog')}</span>
          </p>

          <h1 className="hero-title font-display text-[38px] md:text-[44px] font-medium text-midnight leading-tight mb-4">
            {t('hero.title')}
          </h1>
          <p className="hero-subtitle text-text-secondary text-[16px] font-inter max-w-[600px] mx-auto mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORY_KEYS.map((catKey) => (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={cn(
                  'hero-chip px-4 py-2 rounded-pill text-[13px] font-inter font-medium transition-all duration-200',
                  activeCategory === catKey
                    ? 'bg-palm text-white'
                    : 'bg-sand/30 text-text-primary hover:bg-sand/50',
                )}
              >
                {t(`categories.${catKey}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Loading — skeleton editorial (no spinner aislado) ═══════ */}
      {loading && (
        <section className="bg-white py-10 sm:py-12 px-5 sm:px-6">
          <div className="max-w-[1100px] mx-auto space-y-8 animate-pulse">
            {/* Featured skeleton */}
            <div className="bg-cream-warm rounded-card overflow-hidden border border-border-warm">
              <div className="aspect-video sm:aspect-[16/8] bg-stone/10" />
              <div className="p-5 sm:p-7 space-y-3">
                <div className="h-3 w-16 bg-stone/15 rounded" />
                <div className="h-5 w-3/4 bg-stone/15 rounded" />
                <div className="h-3 w-full bg-stone/10 rounded" />
                <div className="h-3 w-2/3 bg-stone/10 rounded" />
              </div>
            </div>
            {/* Grid skeleton — 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-cream-warm rounded-card overflow-hidden border border-border-warm"
                >
                  <div className="aspect-[16/10] bg-stone/10" />
                  <div className="p-5 space-y-2.5">
                    <div className="h-2.5 w-12 bg-stone/15 rounded" />
                    <div className="h-4 w-5/6 bg-stone/15 rounded" />
                    <div className="h-4 w-2/3 bg-stone/15 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!loading && posts.length === 0 && (
        <section className="bg-white py-24 px-6">
          <div className="max-w-[600px] mx-auto text-center">
            <p className="font-serif italic text-stone text-[18px] mb-2">
              {t('emptyState.title', 'Aún no hay artículos publicados.')}
            </p>
            <p className="text-stone/70 text-[14px] font-inter">
              {t('emptyState.subtitle', 'Vuelve pronto — estamos preparando contenidos.')}
            </p>
          </div>
        </section>
      )}

      {!loading && filteredPosts.length === 0 && posts.length > 0 && (
        <section className="bg-white py-20 px-6">
          <div className="max-w-[600px] mx-auto text-center text-stone font-inter">
            {t('emptyState.noCategory', 'No hay artículos en esta categoría todavía.')}
          </div>
        </section>
      )}

      {/* ═══════ Featured ═══════ */}
      {!loading && featuredPost && (
        <section className="bg-white py-12 px-6">
          <div ref={featuredRef} className="max-w-[1100px] mx-auto">
            <Link
              to={articleHref(featuredPost.slug)}
              className="block bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[55%_45%]">
                <div className="featured-image aspect-video lg:aspect-auto overflow-hidden">
                  <img
                    src={getImageUrl(featuredPost.coverImage || 'blog-pricing.jpg', {
                      width: 800,
                      height: 500,
                      resize: 'cover',
                    })}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    // LCP candidate en /blog → prioridad alta, eager load
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>

                <div className="p-6 md:p-10 flex flex-col justify-center">
                  <span className="bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded mb-4 inline-block self-start uppercase tracking-wide">
                    {t(`categories.${featuredPost.category}`)}
                  </span>
                  <h2 className="font-display text-[22px] md:text-[28px] font-medium text-midnight leading-snug mb-4 group-hover:text-terracotta transition-colors">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt && (
                    <p className="text-text-secondary text-[15px] md:text-[16px] font-inter leading-[1.7] mb-4 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  )}
                  <p className="text-text-secondary text-[13px] font-inter mb-2 flex items-center gap-2">
                    <span>{formatDate(featuredPost.publishedAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {featuredPost.readTimeMin} min {t('readTimeSuffix')}
                    </span>
                  </p>
                  {(featuredPost.author?.name || featuredPost.guestAuthor) && (
                    <p className="text-stone/70 text-[12px] font-inter italic">
                      {t('by', 'Por')} {featuredPost.author?.name || featuredPost.guestAuthor}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ═══════ Grid ═══════ */}
      {!loading && gridPosts.length > 0 && (
        <section className="bg-white py-12 px-6">
          <div ref={gridRef} className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <ArticleCard key={post.id} post={post} href={articleHref(post.slug)} formatDate={formatDate} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ Newsletter — conectado a Supabase (newsletter_subscribers) ═══════ */}
      <section ref={newsletterRef} className="bg-midnight py-14 sm:py-16 px-5 sm:px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <h3 className="nl-fade font-display text-[24px] sm:text-[26px] md:text-[28px] font-medium text-white mb-3 leading-tight">
            {t('newsletter.title')}
          </h3>
          <p className="nl-fade text-white/75 text-[15px] sm:text-[16px] font-inter mb-7 sm:mb-8 leading-relaxed">
            {t('newsletter.subtitle')}
          </p>

          {nlSubscribed ? (
            <div className="nl-fade max-w-[480px] mx-auto bg-white/10 border border-white/20 rounded-lg p-5 text-white">
              <p className="font-inter text-[15px] font-medium mb-1">
                {t('newsletter.successTitle', '¡Bienvenido!')}
              </p>
              <p className="font-inter text-[13px] text-white/70">
                {t(
                  'newsletter.successText',
                  'Recibirás nuestros próximos artículos en tu correo.',
                )}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              className="nl-fade flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto mb-4"
            >
              <input
                type="email"
                required
                placeholder={t('newsletter.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-[48px] px-4 rounded-lg bg-white font-inter text-[14px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                disabled={nlSubmitting}
                className="h-[48px] min-h-[48px] px-6 bg-terracotta hover:bg-terracotta/90 active:bg-terracotta/80 text-white font-inter text-[14px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nlSubmitting
                  ? t('newsletter.submitting', 'Enviando…')
                  : t('newsletter.submit')}
              </button>
            </form>
          )}
          <p className="nl-fade text-white/50 text-[12px] font-inter">{t('newsletter.disclaimer')}</p>
        </div>
      </section>
    </div>
  )
}

/* ───── Tarjeta de artículo (separada para legibilidad) ───── */
function ArticleCard({
  post,
  href,
  formatDate,
}: {
  post: BlogPost
  href: string
  formatDate: (iso: string | null) => string
}) {
  const { t } = useTranslation('blog')
  const categoryClass: Record<BlogCategory, string> = {
    buying: 'bg-terracotta/10 text-terracotta',
    investment: 'bg-gold/20 text-midnight',
    neighborhoods: 'bg-palm/10 text-palm',
    taxation: 'bg-sand/50 text-text-primary',
    decoration: 'bg-sand/50 text-text-primary',
    market: 'bg-midnight/10 text-midnight',
  }

  return (
    <Link
      to={href}
      className="article-card group bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-all"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={getImageUrl(post.coverImage || 'blog-pricing.jpg', {
            width: 600,
            height: 375,
            resize: 'cover',
          })}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="p-5">
        <span
          className={cn(
            'text-[11px] font-semibold px-2 py-1 rounded mb-3 inline-block uppercase tracking-wide',
            categoryClass[post.category],
          )}
        >
          {t(`categories.${post.category}`)}
        </span>

        <h3 className="font-display text-[16px] font-medium text-text-primary mb-2 line-clamp-2 group-hover:text-terracotta transition-colors leading-snug">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-text-secondary text-[14px] font-inter leading-relaxed mb-4 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-3 text-text-secondary text-[12px] font-inter">
          <span>{formatDate(post.publishedAt)}</span>
          <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {post.readTimeMin} min
          </span>
        </div>
        {(post.author?.name || post.guestAuthor) && (
          <p className="text-stone/60 text-[11px] font-inter italic mt-2">
            {t('by', 'Por')} {post.author?.name || post.guestAuthor}
          </p>
        )}
      </div>
    </Link>
  )
}
