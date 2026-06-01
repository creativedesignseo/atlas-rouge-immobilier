// netlify/edge-functions/og-rewrite.ts
// ----------------------------------------------------------------------------
// Reescribe los meta tags Open Graph del HTML cuando la URL es de un artículo
// de blog o de una propiedad. Crítico para previews en WhatsApp / Facebook /
// Twitter / Telegram / LinkedIn, que NO ejecutan JS y leen el HTML estático.
//
// Antes: todos los links compartidos mostraban og-image.jpg genérico.
// Ahora: cada artículo / propiedad muestra su propia foto + título + excerpt.
//
// Activado sobre 2 patrones (ver netlify.toml):
//   /:lang/:blog-segment/:post-slug   (artículos)
//   /:lang/:prop-segment/:slug         (propiedades)
//
// Ejecuta una consulta ligera a Supabase (~50-200 ms) sin auth (RLS público
// permite SELECT en posts publicados y properties).
// ----------------------------------------------------------------------------

import type { Config, Context } from '@netlify/edge-functions'

const SUPABASE_URL = 'https://slxlkbrqcjabsfuhlwdf.supabase.co'
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseGxrYnJxY2phYnNmdWhsd2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODE2NzksImV4cCI6MjA5MjU1NzY3OX0.3KP6ljy0JwZXuMQ25RWIeRYipqxRo28fL-W-n7vSpmc'
const STORAGE_VERSION = '2026-05-15-route-amizmiz'

// Segmentos de URL traducidos → tipo lógico
const BLOG_SEGMENTS = new Set([
  'conseils-immobiliers', // fr
  'consejos-inmobiliarios', // es
  'real-estate-tips', // en
])

const PROPERTY_SEGMENTS = new Set([
  'property', // fr/en
  'propiedad', // es
  'propriete', // fr alt
])

// ----------------------------------------------------------------------------
// Localized route map — kept in sync with src/lib/routes.ts. The edge runtime
// is Deno and cannot import the app's `@/` aliased module, so the slug table is
// duplicated here. If you change ROUTES in src/lib/routes.ts, mirror it here
// (and in scripts/generate-sitemap.mjs).
// ----------------------------------------------------------------------------
const SUPPORTED_LANGS = ['fr', 'es', 'en'] as const
type Lang = (typeof SUPPORTED_LANGS)[number]

const ROUTES: Record<string, Record<Lang, string>> = {
  buy: { fr: 'acheter', es: 'comprar', en: 'buy' },
  rent: { fr: 'louer', es: 'alquilar', en: 'rent' },
  sell: { fr: 'vendre', es: 'vender', en: 'sell' },
  propertyDetail: { fr: 'property', es: 'propiedad', en: 'property' },
  buyerGuide: { fr: 'guide-achat-maroc', es: 'guia-compra-marruecos', en: 'buying-guide-morocco' },
  blog: { fr: 'conseils-immobiliers', es: 'consejos-inmobiliarios', en: 'real-estate-tips' },
  about: { fr: 'a-propos', es: 'sobre-nosotros', en: 'about' },
  contact: { fr: 'contact', es: 'contacto', en: 'contact' },
  favorites: { fr: 'favoris', es: 'favoritos', en: 'favorites' },
  valuation: { fr: 'estimation', es: 'valoracion', en: 'valuation' },
  propertyManagement: { fr: 'gestion-locative', es: 'gestion-alquileres', en: 'property-management' },
  valuationStart: { fr: 'estimer', es: 'valorar', en: 'value' },
}

const SLUG_TO_KEY: Record<string, string> = {}
for (const [key, langMap] of Object.entries(ROUTES)) {
  for (const slug of Object.values(langMap)) SLUG_TO_KEY[slug] = key
}

// Re-translate a pathname into another language. Known slugs are swapped;
// unknown segments (property/post slugs) are preserved — correct, since a
// resource keeps the same slug across languages.
function translatePath(pathname: string, targetLang: Lang): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return `/${targetLang}/`
  if (SUPPORTED_LANGS.includes(segments[0] as Lang)) segments.shift()
  const translated = segments.map((seg) => {
    const key = SLUG_TO_KEY[seg]
    return key ? ROUTES[key][targetLang] : seg
  })
  return translated.length ? `/${targetLang}/${translated.join('/')}` : `/${targetLang}/`
}

function buildHreflangBlock(pathname: string, origin: string): string {
  const links = SUPPORTED_LANGS.map(
    (lang) =>
      `<link rel="alternate" hreflang="${lang}" href="${origin}${translatePath(pathname, lang)}" />`,
  )
  links.push(
    `<link rel="alternate" hreflang="x-default" href="${origin}${translatePath(pathname, 'fr')}" />`,
  )
  return links.join('\n    ')
}

// Rewrite the canonical link to the current URL and replace the static hreflang
// block (from index.html) with per-route alternates. Runs on every localized
// page, independent of whether there's dynamic OG data.
function rewriteCanonicalAndHreflang(html: string, canonicalUrl: string, hreflangBlock: string): string {
  // Drop the existing hreflang links (4 static ones from index.html).
  let out = html.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>/g, '')
  // Replace canonical and append the fresh hreflang block right after it.
  out = out.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonicalUrl}" />\n    ${hreflangBlock}`,
  )
  return out
}

interface OgData {
  title: string
  description: string
  image: string
  type: 'article' | 'website'
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function localeFromLang(lang: string): string {
  return { fr: 'fr_FR', es: 'es_ES', en: 'en_US' }[lang] || 'fr_FR'
}

function imageUrl(filename: string | null, origin: string): string {
  if (!filename) return `${origin}/og-image.jpg`
  if (filename.startsWith('http')) return filename
  return `${origin}/img/${filename}?width=1200&height=630&resize=cover&v=${STORAGE_VERSION}`
}

async function fetchBlogPost(slug: string, lang: string): Promise<OgData | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=cover_image,translations:blog_post_translations(locale,title,excerpt,seo_title,seo_description)`
    const res = await fetch(url, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    })
    if (!res.ok) return null
    const rows = (await res.json()) as Array<{
      cover_image: string | null
      translations: Array<{
        locale: string
        title: string
        excerpt: string | null
        seo_title: string | null
        seo_description: string | null
      }>
    }>
    const post = rows[0]
    if (!post) return null
    const tr =
      post.translations.find((t) => t.locale === lang) ||
      post.translations.find((t) => t.locale === 'fr') ||
      post.translations[0]
    if (!tr) return null
    return {
      title: (tr.seo_title || tr.title) + ' | Atlas Rouge Immobilier',
      description: (tr.seo_description || tr.excerpt || '').slice(0, 300),
      image: '',  // se rellena con imageUrl debajo
      type: 'article',
    }
  } catch (err) {
    console.error('[og-rewrite] blog fetch failed:', err)
    return null
  }
}

async function fetchProperty(slug: string, lang: string, origin: string): Promise<OgData | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/properties?slug=eq.${encodeURIComponent(slug)}&select=title,title_fr,title_es,title_en,description,description_fr,description_es,description_en,images,price_eur,city`
    const res = await fetch(url, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    })
    if (!res.ok) return null
    const rows = (await res.json()) as Array<{
      title: string
      title_fr: string | null
      title_es: string | null
      title_en: string | null
      description: string | null
      description_fr: string | null
      description_es: string | null
      description_en: string | null
      images: string[] | null
      price_eur: number | null
      city: string | null
    }>
    const p = rows[0]
    if (!p) return null

    const title =
      (lang === 'fr' && p.title_fr) ||
      (lang === 'es' && p.title_es) ||
      (lang === 'en' && p.title_en) ||
      p.title

    const desc =
      (lang === 'fr' && p.description_fr) ||
      (lang === 'es' && p.description_es) ||
      (lang === 'en' && p.description_en) ||
      p.description ||
      ''

    const firstImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null
    return {
      title: `${title} | Atlas Rouge Immobilier`,
      description: desc.slice(0, 300),
      image: imageUrl(firstImage, origin),
      type: 'website',
    }
  } catch (err) {
    console.error('[og-rewrite] property fetch failed:', err)
    return null
  }
}

async function resolveOgData(pathname: string, origin: string): Promise<OgData | null> {
  // Patrón esperado: /<lang>/<segment>/<slug>
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < 3) return null
  const [lang, segment, ...rest] = parts
  if (!['fr', 'es', 'en'].includes(lang)) return null
  const slug = rest.join('/').split('?')[0].split('#')[0]
  if (!slug) return null

  if (BLOG_SEGMENTS.has(segment)) {
    const data = await fetchBlogPost(slug, lang)
    if (!data) return null
    // Para blog, buscar cover_image específica del post
    try {
      const url = `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&select=cover_image`
      const res = await fetch(url, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      })
      if (res.ok) {
        const r = (await res.json()) as Array<{ cover_image: string | null }>
        data.image = imageUrl(r[0]?.cover_image || null, origin)
      } else {
        data.image = `${origin}/og-image.jpg`
      }
    } catch {
      data.image = `${origin}/og-image.jpg`
    }
    return data
  }

  if (PROPERTY_SEGMENTS.has(segment)) {
    return await fetchProperty(slug, lang, origin)
  }

  return null
}

function rewriteMetaTags(html: string, og: OgData, canonicalUrl: string, lang: string): string {
  const t = escapeHtml(og.title)
  const d = escapeHtml(og.description)
  const i = og.image
  const locale = localeFromLang(lang)

  // Patrones a sustituir
  const replacements: Array<[RegExp, string]> = [
    // <title>...</title>
    [/<title>[^<]*<\/title>/, `<title>${t}</title>`],
    // <meta name="description" ...>
    [/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${d}" />`],
    // <link rel="canonical" ...>
    [/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}" />`],
    // og:title
    [/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${t}" />`],
    // og:description
    [/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${d}" />`],
    // og:image
    [/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${i}" />`],
    // og:url
    [/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}" />`],
    // og:type — article vs website
    [/<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${og.type}" />`],
    // og:locale
    [/<meta property="og:locale" content="[^"]*"\s*\/?>/, `<meta property="og:locale" content="${locale}" />`],
    // twitter:title
    [/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${t}" />`],
    // twitter:description
    [/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${d}" />`],
    // twitter:image
    [/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${i}" />`],
    // twitter:url
    [/<meta name="twitter:url" content="[^"]*"\s*\/?>/, `<meta name="twitter:url" content="${canonicalUrl}" />`],
  ]

  let out = html
  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement)
  }
  return out
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const lang = pathname.split('/')[1] || 'fr'
  const isLangPath = SUPPORTED_LANGS.includes(lang as Lang)

  // Pedir el HTML del origen primero
  const response = await context.next()
  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('text/html')) {
    return response
  }

  const canonicalUrl = `${url.origin}${pathname}`
  let html = await response.text()

  // 1. SIEMPRE (para cualquier ruta con prefijo de idioma): canonical de la
  //    ruta actual + hreflang por ruta. Esto arregla el P0-4 en TODAS las
  //    páginas, no solo blog/propiedades.
  if (isLangPath) {
    html = rewriteCanonicalAndHreflang(html, canonicalUrl, buildHreflangBlock(pathname, url.origin))
  }

  // 2. CONDICIONAL: title/description/OG/Twitter para artículos y propiedades
  //    (requiere datos de Supabase). Las páginas estáticas conservan los OG
  //    genéricos de index.html (title/desc por-página = P1).
  const og = await resolveOgData(pathname, url.origin)
  if (og) {
    html = rewriteMetaTags(html, og, canonicalUrl, lang)
  }

  const out = new Response(html, { status: response.status, headers: response.headers })
  out.headers.set('x-og-rewrite', og ? 'dynamic' : 'static')
  // Solo forzar no-cache cuando inyectamos datos dinámicos de Supabase; las
  // páginas estáticas pueden cachearse con normalidad.
  if (og) {
    out.headers.set('cache-control', 'public, max-age=0, must-revalidate')
  }
  return out
}

export const config: Config = {
  // Corre en todas las páginas con prefijo de idioma para reescribir
  // canonical + hreflang por ruta. El fetch a Supabase solo ocurre en rutas
  // de blog/propiedad (resolveOgData devuelve null para el resto, sin red).
  path: ['/fr/*', '/es/*', '/en/*'],
}
