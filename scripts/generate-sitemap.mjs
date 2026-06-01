#!/usr/bin/env node
// Generates public/sitemap.xml dynamically from Supabase data.
// Runs as `prebuild` so it is regenerated on every deploy.
//
// Env vars:
//   SITE_URL              — Production origin (default: https://atlasrouge.com)
//   SUPABASE_URL          — Supabase project URL
//   SUPABASE_SERVICE_KEY  — Service role key (preferred) OR SUPABASE_ANON_KEY
//   SUPABASE_ANON_KEY     — Public anon key fallback (also accepts VITE_SUPABASE_ANON_KEY)
//
// Failure policy: this script must NEVER break the build. If Supabase is
// unreachable it emits a sitemap with the static pages only and exits 0.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SITE_URL = (process.env.SITE_URL || 'https://atlasrouge.com').replace(/\/+$/, '')
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://slxlkbrqcjabsfuhlwdf.supabase.co').replace(/\/+$/, '')
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''

// Canonical → localized slug. Kept in sync with src/lib/routes.ts.
const ROUTES = {
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

const LANGS = ['fr', 'es', 'en']

// Per-page SEO metadata (priority + changefreq).
const STATIC_PAGES = [
  { key: 'home', priority: '1.0', changefreq: 'weekly' },
  { key: 'buy', priority: '0.9', changefreq: 'daily' },
  { key: 'rent', priority: '0.9', changefreq: 'daily' },
  { key: 'sell', priority: '0.8', changefreq: 'weekly' },
  { key: 'blog', priority: '0.8', changefreq: 'weekly' },
  { key: 'valuation', priority: '0.8', changefreq: 'weekly' },
  { key: 'propertyManagement', priority: '0.7', changefreq: 'weekly' },
  { key: 'buyerGuide', priority: '0.7', changefreq: 'monthly' },
  { key: 'about', priority: '0.6', changefreq: 'monthly' },
  { key: 'contact', priority: '0.6', changefreq: 'monthly' },
  { key: 'favorites', priority: '0.5', changefreq: 'weekly' },
]

async function fetchSupabase(path) {
  if (!SUPABASE_KEY) {
    console.warn(`[sitemap] No Supabase key available; skipping ${path}`)
    return []
  }
  try {
    const url = `${SUPABASE_URL}/rest/v1/${path}`
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })
    if (!res.ok) {
      console.warn(`[sitemap] Supabase ${path} → ${res.status} ${res.statusText}`)
      return []
    }
    return await res.json()
  } catch (err) {
    console.warn(`[sitemap] Supabase ${path} fetch failed:`, err.message)
    return []
  }
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function isoDate(d) {
  if (!d) return new Date().toISOString().slice(0, 10)
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return new Date().toISOString().slice(0, 10)
  return dt.toISOString().slice(0, 10)
}

// Build localized path for a given canonical key/dynamic resource.
function pathFor(lang, key, dynamicSlug) {
  if (key === 'home') return `/${lang}/`
  const segment = ROUTES[key]?.[lang]
  if (!segment) return null
  if (dynamicSlug) return `/${lang}/${segment}/${dynamicSlug}`
  return `/${lang}/${segment}`
}

// Emit a <url> entry with full hreflang alternates for all 3 langs.
function urlEntry({ key, dynamicSlug, lastmod, priority, changefreq }) {
  const langPaths = {}
  for (const lang of LANGS) {
    const p = pathFor(lang, key, dynamicSlug)
    if (p) langPaths[lang] = p
  }
  const blocks = []
  for (const lang of LANGS) {
    if (!langPaths[lang]) continue
    const loc = SITE_URL + langPaths[lang]
    const alternates = LANGS.filter((l) => langPaths[l])
      .map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(
            SITE_URL + langPaths[l]
          )}" />`
      )
      .join('\n')
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(
      SITE_URL + (langPaths.fr || langPaths.en || langPaths.es)
    )}" />`
    blocks.push(
      `  <url>\n` +
        `    <loc>${xmlEscape(loc)}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${changefreq}</changefreq>\n` +
        `    <priority>${priority}</priority>\n` +
        `${alternates}\n` +
        `${xDefault}\n` +
        `  </url>`
    )
  }
  return blocks.join('\n')
}

async function main() {
  console.log(`[sitemap] SITE_URL=${SITE_URL}`)
  console.log(`[sitemap] SUPABASE_URL=${SUPABASE_URL}`)
  console.log(`[sitemap] Auth key: ${SUPABASE_KEY ? 'present' : 'MISSING — dynamic URLs will be skipped'}`)

  const [posts, properties, neighborhoods] = await Promise.all([
    fetchSupabase('blog_posts?status=eq.published&select=slug,updated_at,published_at'),
    fetchSupabase('properties?select=slug,created_at'),
    fetchSupabase('neighborhoods?select=slug,created_at'),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const entries = []

  // Static pages × 3 langs
  for (const page of STATIC_PAGES) {
    entries.push(
      urlEntry({
        key: page.key,
        lastmod: today,
        priority: page.priority,
        changefreq: page.changefreq,
      })
    )
  }

  // Blog posts × 3 langs (routed under /{lang}/{blog-slug}/{post-slug})
  for (const post of posts) {
    if (!post.slug) continue
    entries.push(
      urlEntry({
        key: 'blog',
        dynamicSlug: post.slug,
        lastmod: isoDate(post.updated_at || post.published_at),
        priority: '0.7',
        changefreq: 'monthly',
      })
    )
  }

  // Properties × 3 langs (routed under /{lang}/{property-slug}/{slug})
  for (const prop of properties) {
    if (!prop.slug) continue
    entries.push(
      urlEntry({
        key: 'propertyDetail',
        dynamicSlug: prop.slug,
        lastmod: isoDate(prop.created_at),
        priority: '0.7',
        changefreq: 'monthly',
      })
    )
  }

  // Neighborhoods × 3 langs (routed under the buy listing as a filter).
  // We expose them under /{lang}/{buy}/{neighborhood-slug} so Googlebot can crawl
  // each neighborhood as a deep listing page.
  for (const n of neighborhoods) {
    if (!n.slug) continue
    entries.push(
      urlEntry({
        key: 'buy',
        dynamicSlug: n.slug,
        lastmod: isoDate(n.created_at),
        priority: '0.6',
        changefreq: 'weekly',
      })
    )
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    entries.join('\n') +
    `\n</urlset>\n`

  const outDir = resolve(ROOT, 'public')
  mkdirSync(outDir, { recursive: true })
  const outPath = resolve(outDir, 'sitemap.xml')
  writeFileSync(outPath, xml, 'utf8')

  const totalUrls = (xml.match(/<url>/g) || []).length
  console.log(
    `Generated sitemap.xml with ${totalUrls} URLs (${posts.length} posts, ${properties.length} properties, ${neighborhoods.length} neighborhoods)`
  )
}

main().catch((err) => {
  // Never break the build over a sitemap hiccup — log and continue.
  console.error('[sitemap] Generation failed (continuing build):', err)
  process.exitCode = 0
})
