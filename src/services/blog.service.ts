import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

// ============================================================================
// Types — espejo del esquema de Supabase (003_blog.sql)
// ============================================================================

export type BlogCategory =
  | 'buying'
  | 'investment'
  | 'neighborhoods'
  | 'taxation'
  | 'decoration'
  | 'market'

export type BlogStatus = 'draft' | 'published'

export interface BlogTranslation {
  locale: SupportedLanguage
  title: string
  excerpt: string | null
  /** Output JSON del editor TipTap (estructura ProseMirror) */
  content: unknown | null
  seoTitle: string | null
  seoDescription: string | null
}

export interface BlogAuthor {
  id: string
  name: string | null
  photoUrl: string | null
  role: string | null
  bio: string | null
}

export interface BlogPost {
  id: string
  slug: string
  status: BlogStatus
  coverImage: string | null
  category: BlogCategory
  readTimeMin: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string

  /** Autor (agent registrado) o invitado (texto libre) */
  author: BlogAuthor | null
  guestAuthor: string | null

  /** Traducción resuelta para el idioma actual (con fallback a francés) */
  title: string
  excerpt: string
  content: unknown | null
  seoTitle: string | null
  seoDescription: string | null

  /** Todas las traducciones disponibles (útil para admin) */
  translations: BlogTranslation[]
}

// ============================================================================
// Helpers
// ============================================================================

function getCurrentLanguage(): SupportedLanguage {
  const lang = i18n.language?.slice(0, 2) as SupportedLanguage
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'fr'
}

/**
 * Resuelve el campo de una traducción con fallback al francés.
 * Si la traducción del idioma actual está vacía, usa la francesa.
 * Si tampoco existe, devuelve el valor por defecto.
 */
function resolveTranslation<T extends string | null | unknown>(
  translations: BlogTranslation[],
  field: keyof BlogTranslation,
  lang: SupportedLanguage,
  fallback: T,
): T {
  const current = translations.find((t) => t.locale === lang)
  const french = translations.find((t) => t.locale === 'fr')
  const currentVal = current?.[field]
  if (currentVal && (typeof currentVal !== 'string' || currentVal.trim())) {
    return currentVal as T
  }
  const frenchVal = french?.[field]
  if (frenchVal && (typeof frenchVal !== 'string' || frenchVal.trim())) {
    return frenchVal as T
  }
  return fallback
}

interface DbBlogPostRow {
  id: string
  slug: string
  status: BlogStatus
  cover_image: string | null
  category: BlogCategory
  read_time_min: number
  author_id: string | null
  guest_author: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  agent?: {
    id: string
    name: string | null
    photo_url: string | null
    role: string | null
    bio: string | null
  } | null
  translations?: Array<{
    locale: SupportedLanguage
    title: string
    excerpt: string | null
    content: unknown | null
    seo_title: string | null
    seo_description: string | null
  }>
}

function mapDbToPost(row: DbBlogPostRow, lang = getCurrentLanguage()): BlogPost {
  const translations: BlogTranslation[] = (row.translations || []).map((t) => ({
    locale: t.locale,
    title: t.title,
    excerpt: t.excerpt,
    content: t.content,
    seoTitle: t.seo_title,
    seoDescription: t.seo_description,
  }))

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    coverImage: row.cover_image,
    category: row.category,
    readTimeMin: row.read_time_min,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: row.agent
      ? {
          id: row.agent.id,
          name: row.agent.name,
          photoUrl: row.agent.photo_url,
          role: row.agent.role,
          bio: row.agent.bio,
        }
      : null,
    guestAuthor: row.guest_author,
    title: resolveTranslation(translations, 'title', lang, '(sin título)'),
    excerpt: resolveTranslation(translations, 'excerpt', lang, '') || '',
    content: resolveTranslation(translations, 'content', lang, null),
    seoTitle: resolveTranslation(translations, 'seoTitle', lang, null),
    seoDescription: resolveTranslation(translations, 'seoDescription', lang, null),
    translations,
  }
}

// ============================================================================
// Public API
// ============================================================================

export interface ListPostsOptions {
  /** Solo published (default). En admin pásalo a false. */
  publishedOnly?: boolean
  category?: BlogCategory
  limit?: number
  /**
   * Por defecto NO se trae el campo `content` (ProseMirror JSON puede
   * pesar 10-50 KB por traducción). El listado solo necesita meta + excerpt.
   * Pasa `true` solo si necesitas el cuerpo completo (admin, p.ej.).
   */
  includeContent?: boolean
}

/** Listado de posts (public-facing por defecto). */
export async function listPosts(options: ListPostsOptions = {}): Promise<BlogPost[]> {
  const { publishedOnly = true, category, limit, includeContent = false } = options
  if (!isSupabaseConfigured) return []

  // El listado público NO necesita el `content` (cuerpo del artículo).
  // Excluirlo reduce el payload en ~10-50 KB por post — clave en móvil.
  const translationFields = includeContent
    ? 'locale, title, excerpt, content, seo_title, seo_description'
    : 'locale, title, excerpt, seo_title, seo_description'

  let query = supabase
    .from('blog_posts')
    .select(
      `
      id, slug, status, cover_image, category, read_time_min,
      author_id, guest_author, published_at, created_at, updated_at,
      agent:agents!blog_posts_author_id_fkey ( id, name, photo_url, role, bio ),
      translations:blog_post_translations ( ${translationFields} )
    `,
    )
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (publishedOnly) query = query.eq('status', 'published')
  if (category) query = query.eq('category', category)
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) {
    console.error('[blog.service] listPosts:', error)
    return []
  }
  return ((data as unknown as DbBlogPostRow[]) || []).map((row) => mapDbToPost(row))
}

/** Un post por slug (incluye todas las traducciones — útil en admin). */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      `
      id, slug, status, cover_image, category, read_time_min,
      author_id, guest_author, published_at, created_at, updated_at,
      agent:agents!blog_posts_author_id_fkey ( id, name, photo_url, role, bio ),
      translations:blog_post_translations ( locale, title, excerpt, content, seo_title, seo_description )
    `,
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[blog.service] getPostBySlug:', error)
    return null
  }
  return data ? mapDbToPost(data as unknown as DbBlogPostRow) : null
}

/** Posts relacionados (misma categoría, excluyendo el actual). Sin `content`. */
export async function getRelatedPosts(
  postId: string,
  category: BlogCategory,
  limit = 3,
): Promise<BlogPost[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      `
      id, slug, status, cover_image, category, read_time_min,
      author_id, guest_author, published_at, created_at, updated_at,
      agent:agents!blog_posts_author_id_fkey ( id, name, photo_url, role, bio ),
      translations:blog_post_translations ( locale, title, excerpt, seo_title, seo_description )
    `,
    )
    .eq('status', 'published')
    .eq('category', category)
    .neq('id', postId)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('[blog.service] getRelatedPosts:', error)
    return []
  }
  return ((data as unknown as DbBlogPostRow[]) || []).map((row) => mapDbToPost(row))
}

// ============================================================================
// Admin mutations
// ============================================================================

export interface UpsertPostInput {
  id?: string
  slug: string
  status: BlogStatus
  coverImage?: string | null
  category: BlogCategory
  readTimeMin?: number
  authorId?: string | null
  guestAuthor?: string | null
  publishedAt?: string | null
  translations: Array<{
    locale: SupportedLanguage
    title: string
    excerpt?: string | null
    content?: unknown | null
    seoTitle?: string | null
    seoDescription?: string | null
  }>
}

/**
 * Crea o actualiza un post completo (incluyendo todas sus traducciones).
 * Si no existe, lo crea; si existe, lo actualiza y reemplaza sus traducciones.
 */
export async function upsertPost(input: UpsertPostInput): Promise<BlogPost | null> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado')
  }

  // 1. INSERT (nuevo) o UPDATE (existente).
  // Separamos los dos casos en vez de usar upsert mágico para evitar que
  // crear un new sin id intente INSERT y choque con un slug ya existente.
  const postPayload = {
    slug: input.slug,
    status: input.status,
    cover_image: input.coverImage ?? null,
    category: input.category,
    read_time_min: input.readTimeMin ?? 5,
    author_id: input.authorId ?? null,
    guest_author: input.guestAuthor ?? null,
    published_at:
      input.status === 'published'
        ? input.publishedAt ?? new Date().toISOString()
        : null,
  }

  let postId: string
  if (input.id) {
    // ── UPDATE de post existente ─────────────────────────────────────
    const { data, error } = await supabase
      .from('blog_posts')
      .update(postPayload)
      .eq('id', input.id)
      .select('id')
      .single()

    if (error || !data) {
      console.error('[blog.service] upsertPost (UPDATE):', error)
      if (error?.code === '23505' && /slug/i.test(error.message)) {
        throw new Error(
          `Ya existe otro artículo con el slug "${input.slug}". Cambia el slug en la barra lateral.`,
        )
      }
      throw new Error(error?.message || 'No se pudo actualizar el artículo')
    }
    postId = data.id
  } else {
    // ── INSERT de post nuevo ─────────────────────────────────────────
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(postPayload)
      .select('id')
      .single()

    if (error || !data) {
      console.error('[blog.service] upsertPost (INSERT):', error)
      if (error?.code === '23505' && /slug/i.test(error.message)) {
        throw new Error(
          `Ya existe un artículo con el slug "${input.slug}". Cámbialo en la barra lateral antes de guardar.`,
        )
      }
      throw new Error(error?.message || 'No se pudo crear el artículo')
    }
    postId = data.id
  }

  // 2. Upsert de cada traducción
  const translationErrors: string[] = []
  for (const tr of input.translations) {
    if (!tr.title?.trim()) continue // sin título no se guarda esa traducción

    const { error: trError } = await supabase
      .from('blog_post_translations')
      .upsert(
        {
          post_id: postId,
          locale: tr.locale,
          title: tr.title.trim(),
          excerpt: tr.excerpt?.trim() || null,
          content: tr.content ?? null,
          seo_title: tr.seoTitle?.trim() || null,
          seo_description: tr.seoDescription?.trim() || null,
        },
        { onConflict: 'post_id,locale' },
      )

    if (trError) {
      console.error(`[blog.service] upsertPost (translation ${tr.locale}):`, trError)
      translationErrors.push(`${tr.locale}: ${trError.message}`)
    }
  }

  // Si alguna traducción falló, propagar el error para que el usuario lo vea
  // (el post principal sí se guardó, pero al menos una traducción no)
  if (translationErrors.length > 0) {
    throw new Error(
      `El artículo se guardó pero falló alguna traducción: ${translationErrors.join('; ')}`,
    )
  }

  return getPostBySlug(input.slug)
}

export async function deletePost(id: string): Promise<void> {
  if (!isSupabaseConfigured) return
  // CASCADE en blog_post_translations.post_id se encarga de las traducciones
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) {
    console.error('[blog.service] deletePost:', error)
    throw new Error(error.message)
  }
}

export async function publishPost(id: string, publish = true): Promise<void> {
  if (!isSupabaseConfigured) return
  const { error } = await supabase
    .from('blog_posts')
    .update({
      status: publish ? 'published' : 'draft',
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq('id', id)
  if (error) {
    console.error('[blog.service] publishPost:', error)
    throw new Error(error.message)
  }
}

/** Genera un slug a partir del título (usado en formulario admin). */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Estima minutos de lectura: ~220 palabras/min. */
export function estimateReadTime(plainText: string): number {
  const words = (plainText || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
