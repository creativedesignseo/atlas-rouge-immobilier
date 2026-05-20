import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, ChevronLeft, MessageCircle, ArrowRight } from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { getImageUrl } from '@/lib/storage'
import { buildWhatsAppLink } from '@/lib/contact'
import {
  getPostBySlug,
  getRelatedPosts,
  type BlogPost as BlogPostType,
} from '@/services/blog.service'
import RichTextRenderer from '@/components/blog/RichTextRenderer'
import TableOfContents from '@/components/blog/TableOfContents'

/**
 * Página de un artículo individual — layout estilo Shopify Enterprise Blog.
 *
 * Estructura:
 *   - Hero centrado : breadcrumb + categoría + título + excerpt + meta + cover image
 *   - Body en grid 3 columnas (desktop) / 1 columna (mobile):
 *       [TOC sticky] [Contenido] [Autor + Related + WhatsApp sticky]
 *   - CTA inline cada 3er H2 inyectado por RichTextRenderer
 *   - Sección final : artículos relacionados + CTA contacto
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

  // SEO meta + JSON-LD
  useEffect(() => {
    if (!post) return
    const prev = document.title
    document.title = `${post.seoTitle || post.title} | Atlas Rouge Immobilier`

    const desc = (post.seoDescription || post.excerpt || '').slice(0, 200)
    let metaDesc = document.querySelector('meta[name="description"]')
    const prevDesc = metaDesc?.getAttribute('content') || ''
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    if (desc) metaDesc.setAttribute('content', desc)

    return () => {
      document.title = prev
      if (prevDesc) metaDesc?.setAttribute('content', prevDesc)
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
      {/* ═══════ HERO — estilo Shopify Enterprise, centrado ═══════ */}
      <header className="bg-cream-warm pt-10 sm:pt-14 md:pt-20 pb-10 sm:pb-14 px-5 sm:px-6">
        <div className="max-w-[820px] mx-auto text-center">
          {/* Breadcrumb minimal — BLOG | CATEGORIA */}
          <nav className="flex items-center justify-center gap-2 mb-6 sm:mb-8 text-[11px] sm:text-[12px] font-inter font-semibold uppercase tracking-[0.18em]">
            <Link
              to={path('/blog')}
              className="text-text-secondary hover:text-terracotta transition-colors"
            >
              {t('breadcrumb.blog')}
            </Link>
            <span className="text-text-secondary/40">|</span>
            <span className="text-terracotta">{t(`categories.${post.category}`)}</span>
          </nav>

          {/* Título */}
          <h1 className="font-display text-[28px] sm:text-[40px] md:text-[52px] lg:text-[60px] font-medium text-ink leading-[1.08] tracking-tight mb-5 sm:mb-6">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-text-secondary text-[16px] sm:text-[18px] md:text-[19px] font-inter leading-relaxed max-w-[680px] mx-auto mb-7 sm:mb-9">
              {post.excerpt}
            </p>
          )}

          {/* Meta — autor + fecha + lectura */}
          <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 text-text-secondary text-[13px] sm:text-[14px] font-inter">
            <span>
              {t('by', 'Por')}{' '}
              <span className="text-text-primary font-medium">{authorName}</span>
            </span>
            {formattedDate && (
              <>
                <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
                <span>{formattedDate}</span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {post.readTimeMin} min {t('readTimeSuffix')}
            </span>
          </div>
        </div>
      </header>

      {/* ═══════ COVER IMAGE — full-width contenida ═══════ */}
      {post.coverImage && (
        <div className="max-w-[1100px] mx-auto px-5 sm:px-6 -mt-6 sm:-mt-10 md:-mt-14 mb-10 sm:mb-14">
          <div className="aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-card shadow-card">
            <img
              src={getImageUrl(post.coverImage, { width: 1400, height: 800, resize: 'cover' })}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      )}

      {/* ═══════ BODY — grid 3 columnas ═══════ */}
      <section className="px-5 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-[1200px] mx-auto lg:grid lg:grid-cols-[220px_minmax(0,1fr)_260px] lg:gap-12">
          {/* ─── Sidebar izq : TOC ─── */}
          <aside className="lg:py-4">
            <TableOfContents content={post.content} />
          </aside>

          {/* ─── Columna central : contenido ─── */}
          <div className="max-w-[680px] mx-auto w-full lg:mx-0">
            {post.content ? (
              <RichTextRenderer content={post.content} />
            ) : (
              <p className="font-serif italic text-stone/70">
                {t('emptyContent', 'Contenido en preparación.')}
              </p>
            )}
          </div>

          {/* ─── Sidebar der : autor + related + WhatsApp ─── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              {/* Autor card */}
              {(post.author?.bio || post.author?.name) && (
                <div className="bg-cream-warm/50 border border-border-warm rounded-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {post.author.photoUrl ? (
                      <img
                        src={post.author.photoUrl}
                        alt={post.author.name || authorName}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-terracotta/15 flex items-center justify-center text-terracotta font-display text-[16px] font-semibold shrink-0">
                        {authorName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-inter text-[14px] font-semibold text-ink truncate">
                        {post.author.name}
                      </p>
                      {post.author.role && (
                        <p className="font-inter text-[11px] text-stone uppercase tracking-wider truncate">
                          {post.author.role === 'admin' ? 'Director' : 'Agente'}
                        </p>
                      )}
                    </div>
                  </div>
                  {post.author.bio && (
                    <p className="font-serif text-stone text-[13px] leading-relaxed line-clamp-4">
                      {post.author.bio}
                    </p>
                  )}
                </div>
              )}

              {/* Related compacto — solo 3 enlaces */}
              {related.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-inter font-semibold text-terracotta uppercase tracking-[0.18em] mb-4">
                    {t('related', 'Artículos relacionados')}
                  </p>
                  <ul className="space-y-4">
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link
                          to={path(`/blog/${r.slug}`)}
                          className="group block"
                        >
                          <p className="text-[10.5px] font-inter font-semibold text-stone uppercase tracking-wider mb-1">
                            {t(`categories.${r.category}`)}
                          </p>
                          <p className="font-display text-[15px] font-medium text-ink leading-snug group-hover:text-terracotta transition-colors line-clamp-3">
                            {r.title}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA WhatsApp */}
              <a
                href={buildWhatsAppLink(tNav('whatsappMessage'))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1da851] active:bg-[#178a44] text-white px-5 py-3 min-h-[48px] rounded-pill font-inter text-[13px] font-semibold transition-colors"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══════ AUTOR BIO completa (solo si tiene bio larga) — solo mobile ═══════ */}
      {post.author?.bio && (
        <section className="lg:hidden bg-cream-warm py-10 sm:py-12 px-5 sm:px-6">
          <div className="max-w-[680px] mx-auto">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {post.author.photoUrl && (
                <img
                  src={post.author.photoUrl}
                  alt={post.author.name || authorName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shrink-0"
                />
              )}
              <div className="flex-1">
                <p className="text-stone text-[10.5px] uppercase tracking-[0.18em] mb-1 font-inter">
                  {t('aboutAuthor', 'Sobre el autor')}
                </p>
                <h3 className="font-display text-[20px] font-medium text-ink mb-2">
                  {post.author.name}
                </h3>
                <p className="font-serif text-stone text-[15px] leading-relaxed">
                  {post.author.bio}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ ARTÍCULOS RELACIONADOS — grid grande para mobile + reforzar desktop ═══════ */}
      {related.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 px-5 sm:px-6 border-t border-border-subtle">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="font-display text-[22px] sm:text-[26px] md:text-[32px] font-medium text-ink mb-6 sm:mb-8 text-center">
              {t('related', 'Artículos relacionados')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={path(`/blog/${r.slug}`)}
                  className="group bg-white rounded-card border border-border-warm overflow-hidden shadow-card hover:shadow-card-hover transition-all"
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

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="bg-ink text-cream-warm py-12 sm:py-16 md:py-20 px-5 sm:px-6">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="font-display text-[22px] sm:text-[26px] md:text-[32px] font-medium leading-tight mb-3 sm:mb-4">
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
              <ArrowRight size={16} />
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
        <div className="max-w-[1100px] mx-auto">
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
