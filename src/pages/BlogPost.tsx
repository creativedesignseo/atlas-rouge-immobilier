import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, ChevronLeft, MessageCircle } from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { getImageUrl } from '@/lib/storage'
import { buildWhatsAppLink } from '@/lib/contact'
import {
  getPostBySlug,
  getRelatedPosts,
  type BlogPost as BlogPostType,
} from '@/services/blog.service'
import RichTextRenderer from '@/components/blog/RichTextRenderer'

/**
 * Página de un artículo individual.
 * URL: /<lang>/<blog-slug>/<post-slug>
 *
 * Estructura:
 *   1. Hero con cover image, breadcrumb, categoría, título, meta (fecha/lectura), autor
 *   2. Cuerpo (TipTap → RichTextRenderer) con prosa editorial
 *   3. Bloque "Sobre el autor" si el autor es un agent registrado
 *   4. Artículos relacionados (misma categoría)
 *   5. CTA final: contacto / WhatsApp
 */
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { path, lang } = useLang()
  const { t } = useTranslation('blog')
  const { t: tCommon } = useTranslation('common')
  const { t: tNav } = useTranslation('nav')

  const [post, setPost] = useState<BlogPostType | null>(null)
  const [related, setRelated] = useState<BlogPostType[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    getPostBySlug(slug)
      .then((p) => {
        if (cancelled) return
        if (!p || p.status !== 'published') {
          setNotFound(true)
          return
        }
        setPost(p)
        // Cargar related en paralelo
        return getRelatedPosts(p.id, p.category, 3).then((rel) => {
          if (!cancelled) setRelated(rel)
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, lang])

  // SEO meta — actualiza el title del documento mientras estamos en la página
  useEffect(() => {
    if (!post) return
    const prev = document.title
    document.title = `${post.seoTitle || post.title} | Atlas Rouge Immobilier`
    return () => {
      document.title = prev
    }
  }, [post])

  if (notFound) return <Navigate to={path('/blog')} replace />

  if (loading || !post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const localeMap = { fr: 'fr-FR', es: 'es-ES', en: 'en-US' } as const
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(localeMap[lang] || 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const authorName = post.author?.name || post.guestAuthor || 'Atlas Rouge'

  return (
    <article className="bg-white">
      {/* ═══════ Hero ═══════ */}
      <header className="bg-cream-warm pt-8 pb-10 px-5 sm:pt-12 sm:pb-16 sm:px-6">
        <div className="max-w-[900px] mx-auto">
          {/* Breadcrumb — oculta el primer eslabón en mobile para no romper */}
          <nav className="text-text-secondary text-[12px] sm:text-[13px] font-inter mb-6 sm:mb-8 flex items-center gap-1.5 sm:gap-2 overflow-hidden">
            <Link
              to={path('/')}
              className="hover:text-terracotta transition-colors hidden sm:inline"
            >
              {t('breadcrumb.home')}
            </Link>
            <span className="hidden sm:inline">&gt;</span>
            <Link to={path('/blog')} className="hover:text-terracotta transition-colors shrink-0">
              {t('breadcrumb.blog')}
            </Link>
            <span className="shrink-0">&gt;</span>
            <span className="truncate min-w-0">{post.title}</span>
          </nav>

          {/* Categoría */}
          <span className="inline-block bg-palm text-white text-[10.5px] sm:text-[11px] font-semibold px-2 py-1 rounded uppercase tracking-wide mb-4 sm:mb-5">
            {t(`categories.${post.category}`)}
          </span>

          {/* Título — escala progresiva para evitar reflow agresivo */}
          <h1 className="font-display text-[26px] sm:text-[34px] md:text-[44px] lg:text-[52px] font-medium text-ink leading-[1.12] tracking-tight mb-4 sm:mb-6">
            {post.title}
          </h1>

          {/* Excerpt como subtítulo */}
          {post.excerpt && (
            <p className="font-serif italic text-stone text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed mb-6 sm:mb-8 max-w-[700px]">
              {post.excerpt}
            </p>
          )}

          {/* Meta — bloque autor + fecha + lectura en filas claras */}
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-3 text-text-secondary text-[13px] sm:text-[14px] font-inter">
            {(post.author?.photoUrl || authorName) && (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {post.author?.photoUrl ? (
                  <img
                    src={post.author.photoUrl}
                    alt={authorName}
                    className="w-10 h-10 sm:w-9 sm:h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-terracotta/15 flex items-center justify-center text-terracotta font-semibold text-[14px] shrink-0">
                    {authorName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-text-primary text-[14px] font-medium truncate">{authorName}</p>
                  {post.author?.role && (
                    <p className="text-stone/70 text-[10.5px] sm:text-[11px] uppercase tracking-wider">
                      {post.author.role === 'admin' ? 'Director' : 'Agente'}
                    </p>
                  )}
                </div>
              </div>
            )}
            {formattedDate && <span>{formattedDate}</span>}
            <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {post.readTimeMin} min {t('readTimeSuffix')}
            </span>
          </div>
        </div>
      </header>

      {/* ═══════ Cover image — aspecto 4:3 en mobile, 16:9 desktop ═══════ */}
      {post.coverImage && (
        <div className="max-w-[1100px] mx-auto px-5 sm:px-6 -mt-6 sm:-mt-8 md:-mt-12">
          <div className="aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-card shadow-card">
            <img
              src={getImageUrl(post.coverImage, { width: 1400, height: 800, resize: 'cover' })}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* ═══════ Body ═══════ */}
      <section className="py-10 sm:py-14 md:py-20 px-5 sm:px-6">
        <div className="max-w-[720px] mx-auto">
          {post.content ? (
            <RichTextRenderer content={post.content} />
          ) : (
            <p className="font-serif italic text-stone/70">
              {t('emptyContent', 'Contenido en preparación.')}
            </p>
          )}
        </div>
      </section>

      {/* ═══════ Autor bio (solo si es agent registrado con bio) ═══════ */}
      {post.author?.bio && (
        <section className="bg-cream-warm py-10 sm:py-12 md:py-16 px-5 sm:px-6">
          <div className="max-w-[720px] mx-auto">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
              {post.author.photoUrl && (
                <img
                  src={post.author.photoUrl}
                  alt={post.author.name || authorName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shrink-0"
                />
              )}
              <div className="flex-1">
                <p className="text-stone text-[10.5px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.2em] mb-1 font-inter">
                  {t('aboutAuthor', 'Sobre el autor')}
                </p>
                <h3 className="font-display text-[20px] sm:text-[22px] font-medium text-ink mb-2">
                  {post.author.name}
                </h3>
                <p className="font-serif text-stone text-[15px] sm:text-[16px] leading-relaxed">
                  {post.author.bio}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ Artículos relacionados ═══════ */}
      {related.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 px-5 sm:px-6 border-t border-border-subtle">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="font-display text-[22px] sm:text-[24px] md:text-[28px] font-medium text-ink mb-6 sm:mb-8">
              {t('related', 'Artículos relacionados')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={path(`/blog/${r.slug}`)}
                  className="group bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover active:shadow-card transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={getImageUrl(r.coverImage || 'blog-pricing.jpg', {
                        width: 600,
                        height: 375,
                        resize: 'cover',
                      })}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 sm:p-5">
                    <span className="text-[10px] uppercase font-semibold tracking-wide text-stone">
                      {t(`categories.${r.category}`)}
                    </span>
                    <h3 className="font-display text-[16px] font-medium text-ink mt-2 line-clamp-2 group-hover:text-terracotta transition-colors leading-snug">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ CTA final ═══════ */}
      <section className="bg-ink text-cream-warm py-12 sm:py-16 md:py-20 px-5 sm:px-6">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="font-display text-[22px] sm:text-[24px] md:text-[32px] font-medium leading-tight mb-3 sm:mb-4">
            {t('cta.title', '¿Tiene un proyecto inmobiliario en Marrakech?')}
          </h2>
          <p className="font-serif italic text-cream-warm/80 text-[15px] sm:text-[16px] md:text-[18px] mb-7 sm:mb-8 leading-relaxed">
            {t('cta.subtitle', 'Hablemos. Le acompañamos en cada etapa del proceso.')}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-[420px] sm:max-w-none mx-auto">
            <Link
              to={path('/contact')}
              className="inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta/90 active:bg-terracotta/80 text-white min-h-[48px] px-6 py-3 rounded-pill font-inter text-[14px] font-semibold transition-colors"
            >
              {tCommon('contactUs', 'Contáctenos')}
            </Link>
            <a
              href={buildWhatsAppLink(tNav('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] active:bg-[#178a44] text-white min-h-[48px] px-6 py-3 rounded-pill font-inter text-[14px] font-semibold transition-colors"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Volver al listado */}
      <div className="bg-white py-8 sm:py-10 px-5 sm:px-6 border-t border-border-subtle">
        <div className="max-w-[900px] mx-auto">
          <Link
            to={path('/blog')}
            className="inline-flex items-center gap-2 min-h-[44px] text-stone hover:text-terracotta font-inter text-[14px] transition-colors"
          >
            <ChevronLeft size={16} />
            {t('backToBlog', 'Volver al blog')}
          </Link>
        </div>
      </div>
    </article>
  )
}
