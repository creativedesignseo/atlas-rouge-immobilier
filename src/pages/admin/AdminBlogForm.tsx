import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ChevronLeft, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  getPostBySlug,
  upsertPost,
  slugify,
  estimateReadTime,
  type BlogCategory,
  type BlogStatus,
  type BlogPost,
} from '@/services/blog.service'
import RichTextEditor from '@/components/blog/RichTextEditor'
import { getImageUrl } from '@/lib/storage'
import type { SupportedLanguage } from '@/i18n'

const CATEGORIES: BlogCategory[] = [
  'buying',
  'investment',
  'neighborhoods',
  'taxation',
  'decoration',
  'market',
]
const CATEGORY_LABELS: Record<BlogCategory, string> = {
  buying: 'Compra',
  investment: 'Inversión',
  neighborhoods: 'Barrios',
  taxation: 'Fiscalidad',
  decoration: 'Decoración',
  market: 'Mercado',
}

const LOCALES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

interface AgentOption {
  id: string
  name: string | null
  role: string | null
}

interface TranslationDraft {
  title: string
  excerpt: string
  content: unknown | null
  plainText: string
  seoTitle: string
  seoDescription: string
}

/**
 * Formulario para crear o editar un artículo del blog.
 * Soporta multi-idioma con tabs (FR/ES/EN) y editor visual TipTap.
 *
 * Modos:
 *   - /admin/blog/new      → crea (sin :slug en params)
 *   - /admin/blog/:slug/edit → edita
 */
export default function AdminBlogForm() {
  const navigate = useNavigate()
  const { slug: routeSlug } = useParams<{ slug?: string }>()
  const { agent } = useAuth()
  const isEdit = Boolean(routeSlug)

  // Estado del post (campos no traducibles)
  // editingId: id del post existente en modo edit. Crítico para que el upsert
  // resuelva el conflicto por id (en lugar de fallar por slug único).
  const [editingId, setEditingId] = useState<string | undefined>(undefined)
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState<BlogStatus>('draft')
  const [coverImage, setCoverImage] = useState('')
  const [category, setCategory] = useState<BlogCategory>('market')
  const [readTimeMin, setReadTimeMin] = useState(5)
  const [authorMode, setAuthorMode] = useState<'agent' | 'guest'>('agent')
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [guestAuthor, setGuestAuthor] = useState('')

  // Traducciones
  const [activeLocale, setActiveLocale] = useState<SupportedLanguage>('fr')
  const [translations, setTranslations] = useState<Record<SupportedLanguage, TranslationDraft>>({
    fr: emptyTranslation(),
    es: emptyTranslation(),
    en: emptyTranslation(),
  })

  // UI
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  // Cargar lista de agents (para selector de autor)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('agents')
      .select('id, name, role, is_active')
      .eq('is_active', true)
      .then(({ data }) => {
        const list = ((data || []) as AgentOption[]).filter((a) => a.name?.trim())
        setAgents(list)
        // Por defecto, el agent logueado
        if (!isEdit && agent && !authorId) {
          setAuthorId(agent.id)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, isEdit])

  // Cargar post existente (modo edit)
  useEffect(() => {
    if (!isEdit || !routeSlug) return
    let cancelled = false
    setLoading(true)
    getPostBySlug(routeSlug)
      .then((post) => {
        if (cancelled || !post) return
        hydrateFromPost(post)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, routeSlug])

  function hydrateFromPost(post: BlogPost) {
    setEditingId(post.id)
    setSlug(post.slug)
    setSlugTouched(true)
    setStatus(post.status)
    setCoverImage(post.coverImage || '')
    setCategory(post.category)
    setReadTimeMin(post.readTimeMin)
    if (post.author?.id) {
      setAuthorMode('agent')
      setAuthorId(post.author.id)
    } else if (post.guestAuthor) {
      setAuthorMode('guest')
      setGuestAuthor(post.guestAuthor)
    }
    const next: Record<SupportedLanguage, TranslationDraft> = {
      fr: emptyTranslation(),
      es: emptyTranslation(),
      en: emptyTranslation(),
    }
    for (const tr of post.translations) {
      next[tr.locale] = {
        title: tr.title,
        excerpt: tr.excerpt || '',
        content: tr.content,
        plainText: '',
        seoTitle: tr.seoTitle || '',
        seoDescription: tr.seoDescription || '',
      }
    }
    setTranslations(next)
  }

  // Auto-generar slug del título FR si no se ha tocado manualmente
  useEffect(() => {
    if (!slugTouched && translations.fr.title) {
      setSlug(slugify(translations.fr.title))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translations.fr.title])

  // Recalcular read time al editar el cuerpo FR
  useEffect(() => {
    if (translations.fr.plainText) {
      setReadTimeMin(estimateReadTime(translations.fr.plainText))
    }
  }, [translations.fr.plainText])

  function updateTranslation(locale: SupportedLanguage, patch: Partial<TranslationDraft>) {
    setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }))
  }

  // Validación + save
  async function handleSave(asStatus?: BlogStatus) {
    const finalStatus = asStatus || status

    if (!slug.trim()) {
      toast.error('Falta el slug (URL del artículo)')
      return
    }
    if (!translations.fr.title.trim()) {
      toast.error('El título en francés es obligatorio (idioma base del proyecto)')
      setActiveLocale('fr')
      return
    }
    if (finalStatus === 'published' && !translations.fr.content) {
      toast.error('No puedes publicar un artículo sin contenido en francés')
      setActiveLocale('fr')
      return
    }
    if (authorMode === 'guest' && !guestAuthor.trim()) {
      toast.error('Indica el nombre del autor invitado o cambia a agente')
      return
    }

    setSaving(true)
    try {
      await upsertPost({
        id: editingId, // crítico: sin esto, el upsert intenta INSERT y choca con slug único
        slug: slug.trim(),
        status: finalStatus,
        coverImage: coverImage.trim() || null,
        category,
        readTimeMin,
        authorId: authorMode === 'agent' ? authorId : null,
        guestAuthor: authorMode === 'guest' ? guestAuthor.trim() : null,
        translations: LOCALES.map(({ code }) => {
          const t = translations[code]
          return {
            locale: code,
            title: t.title.trim(),
            excerpt: t.excerpt.trim() || null,
            content: t.content,
            seoTitle: t.seoTitle.trim() || null,
            seoDescription: t.seoDescription.trim() || null,
          }
        }).filter((t) => t.title), // descartar idiomas sin título
      })
      toast.success(finalStatus === 'published' ? 'Artículo publicado' : 'Artículo guardado')
      navigate('/admin/blog')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tr = translations[activeLocale]

  return (
    <div className="p-6 md:p-10 max-w-[1100px] mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('/admin/blog')}
            className="inline-flex items-center gap-1.5 text-stone hover:text-ink font-inter text-[13px] mb-2 transition-colors"
          >
            <ChevronLeft size={14} />
            Volver al blog
          </button>
          <h1 className="font-display text-[28px] md:text-[32px] font-medium text-ink">
            {isEdit ? 'Editar artículo' : 'Nuevo artículo'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2.5 border border-border-warm rounded-lg font-inter text-[14px] font-medium text-ink hover:bg-cream-warm transition-colors disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg font-inter text-[14px] font-semibold hover:bg-terracotta/90 transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            {status === 'published' ? 'Guardar' : 'Publicar'}
          </button>
        </div>
      </div>

      {/* Layout: 2 columnas en desktop (contenido + sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* ─────── Columna principal: contenido + traducciones ─────── */}
        <div className="space-y-6">
          {/* Locale tabs */}
          <div className="flex items-center gap-1 bg-cream-warm/60 rounded-lg p-1 w-fit">
            {LOCALES.map(({ code, label, flag }) => {
              const hasTitle = Boolean(translations[code].title.trim())
              return (
                <button
                  key={code}
                  onClick={() => setActiveLocale(code)}
                  className={`px-4 h-9 rounded-md text-[13px] font-inter font-medium transition-colors flex items-center gap-2 ${
                    activeLocale === code
                      ? 'bg-white shadow-sm text-ink'
                      : 'text-stone hover:text-ink'
                  }`}
                >
                  <span>{flag}</span>
                  <span>{label}</span>
                  {!hasTitle && code !== 'fr' && (
                    <span className="text-stone/40 text-[10px]">·</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-1.5">
              Título {activeLocale === 'fr' && <span className="text-terracotta">*</span>}
            </label>
            <input
              value={tr.title}
              onChange={(e) => updateTranslation(activeLocale, { title: e.target.value })}
              placeholder={`Título en ${LOCALES.find((l) => l.code === activeLocale)?.label}`}
              className="w-full px-4 py-3 bg-white border border-border-warm rounded-lg font-display text-[22px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-1.5">
              Resumen (excerpt)
            </label>
            <textarea
              value={tr.excerpt}
              onChange={(e) => updateTranslation(activeLocale, { excerpt: e.target.value })}
              placeholder="2-3 líneas que aparecerán en el listado del blog…"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-border-warm rounded-lg font-serif text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
            />
          </div>

          {/* Content (TipTap) */}
          <div>
            <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-1.5">
              Contenido
            </label>
            <RichTextEditor
              key={activeLocale} /* fuerza remount al cambiar de idioma */
              value={tr.content}
              onChange={(json, plainText) =>
                updateTranslation(activeLocale, { content: json, plainText })
              }
              placeholder={`Escribe el cuerpo del artículo en ${LOCALES.find((l) => l.code === activeLocale)?.label}…`}
            />
          </div>

          {/* SEO (collapsible) */}
          <details className="bg-cream-warm/40 border border-border-warm rounded-lg p-4">
            <summary className="cursor-pointer text-[13px] font-inter font-medium text-ink">
              SEO (opcional)
            </summary>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-1">
                  SEO title
                </label>
                <input
                  value={tr.seoTitle}
                  onChange={(e) => updateTranslation(activeLocale, { seoTitle: e.target.value })}
                  placeholder={tr.title || 'Por defecto = título'}
                  className="w-full px-3 py-2 bg-white border border-border-warm rounded-md font-inter text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-1">
                  SEO description
                </label>
                <textarea
                  value={tr.seoDescription}
                  onChange={(e) =>
                    updateTranslation(activeLocale, { seoDescription: e.target.value })
                  }
                  placeholder={tr.excerpt || 'Por defecto = resumen'}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-border-warm rounded-md font-inter text-[13px] resize-none"
                />
              </div>
            </div>
          </details>
        </div>

        {/* ─────── Sidebar derecha: metadata ─────── */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {/* Status */}
          <div className="bg-white border border-border-warm rounded-card p-4">
            <p className="text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-2">
              Estado
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-inter font-medium ${
                  status === 'published' ? 'bg-palm/15 text-palm' : 'bg-stone/10 text-stone'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'published' ? 'bg-palm' : 'bg-stone'
                  }`}
                />
                {status === 'published' ? 'Publicado' : 'Borrador'}
              </span>
            </div>
          </div>

          {/* Slug */}
          <div className="bg-white border border-border-warm rounded-card p-4">
            <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-2">
              URL (slug)
            </label>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value))
                setSlugTouched(true)
              }}
              placeholder="mi-articulo-genial"
              className="w-full px-3 py-2 bg-cream-warm/40 border border-border-warm rounded-md font-mono text-[13px]"
            />
            <p className="text-stone/70 text-[11px] font-inter mt-2">
              /blog/<span className="font-mono">{slug || '...'}</span>
            </p>
          </div>

          {/* Categoría */}
          <div className="bg-white border border-border-warm rounded-card p-4">
            <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-2">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BlogCategory)}
              className="w-full px-3 py-2 bg-white border border-border-warm rounded-md font-inter text-[13px]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Cover image */}
          <div className="bg-white border border-border-warm rounded-card p-4">
            <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-2">
              Imagen de portada
            </label>
            <div className="flex gap-2">
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="blog-pricing.jpg"
                className="flex-1 px-3 py-2 bg-white border border-border-warm rounded-md font-inter text-[13px]"
              />
              {coverImage && (
                <button
                  onClick={() => setCoverImage('')}
                  className="p-2 text-stone hover:text-red-600 transition-colors"
                  title="Quitar"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {coverImage ? (
              <div className="mt-3 aspect-video bg-cream-warm rounded-md overflow-hidden">
                <img
                  src={getImageUrl(coverImage, { width: 400, height: 225, resize: 'cover' })}
                  alt="cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="mt-3 aspect-video bg-cream-warm/40 border-2 border-dashed border-border-warm rounded-md flex items-center justify-center text-stone/40">
                <ImageIcon size={20} />
              </div>
            )}
            <p className="text-stone/70 text-[11px] font-inter mt-2">
              Nombre de archivo en el bucket de Supabase.
            </p>
          </div>

          {/* Autor */}
          <div className="bg-white border border-border-warm rounded-card p-4">
            <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-2">
              Autor
            </label>
            <div className="flex gap-1 bg-cream-warm rounded-md p-0.5 mb-3">
              <button
                onClick={() => setAuthorMode('agent')}
                className={`flex-1 px-2 py-1.5 rounded text-[12px] font-inter font-medium transition-colors ${
                  authorMode === 'agent' ? 'bg-white text-ink shadow-sm' : 'text-stone'
                }`}
              >
                Agente
              </button>
              <button
                onClick={() => setAuthorMode('guest')}
                className={`flex-1 px-2 py-1.5 rounded text-[12px] font-inter font-medium transition-colors ${
                  authorMode === 'guest' ? 'bg-white text-ink shadow-sm' : 'text-stone'
                }`}
              >
                Invitado
              </button>
            </div>
            {authorMode === 'agent' ? (
              <select
                value={authorId || ''}
                onChange={(e) => setAuthorId(e.target.value || null)}
                className="w-full px-3 py-2 bg-white border border-border-warm rounded-md font-inter text-[13px]"
              >
                <option value="">— Sin asignar —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.role ? ` (${a.role})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={guestAuthor}
                onChange={(e) => setGuestAuthor(e.target.value)}
                placeholder='Ej. "Equipo Atlas Rouge"'
                className="w-full px-3 py-2 bg-white border border-border-warm rounded-md font-inter text-[13px]"
              />
            )}
          </div>

          {/* Read time */}
          <div className="bg-white border border-border-warm rounded-card p-4">
            <label className="block text-[11px] uppercase font-inter font-semibold tracking-wider text-stone mb-2">
              Minutos de lectura
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={readTimeMin}
              onChange={(e) => setReadTimeMin(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-white border border-border-warm rounded-md font-inter text-[13px]"
            />
            <p className="text-stone/70 text-[11px] font-inter mt-2">
              Calculado automáticamente al escribir.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function emptyTranslation(): TranslationDraft {
  return {
    title: '',
    excerpt: '',
    content: null,
    plainText: '',
    seoTitle: '',
    seoDescription: '',
  }
}
