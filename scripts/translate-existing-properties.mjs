#!/usr/bin/env node
/**
 * One-shot batch translator for existing properties.
 *
 * Older listings were created in French only, so their `title_es/en`,
 * `description_es/en` and `highlights_es/en` columns are empty and the public
 * site falls back to French. This script fills the missing ES/EN translations
 * by calling the production Netlify function `translate-property` (which holds
 * the DeepSeek key server-side and uses the same prompt as the admin
 * "Auto-translate" button), so no DeepSeek key is needed locally.
 *
 * It is idempotent: only listings missing a translation are processed, so it
 * can be re-run safely. Amenities are intentionally NOT translated here — they
 * are stored in French and localized in the UI via the i18n `amenities`
 * namespace.
 *
 * Run (Node 20+ loads .env.local via --env-file):
 *   npm run translate:properties
 *
 * Required env (.env.local): SUPABASE_URL, and either a service-role key
 * (SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY) OR
 * SUPABASE_ANON_KEY + ADMIN_EMAIL + ADMIN_PASSWORD (an active admin agent —
 * the "Admin can manage all properties" RLS policy authorizes the writes).
 * Optional: TRANSLATE_ENDPOINT (defaults to the production function URL).
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const TRANSLATE_URL =
  process.env.TRANSLATE_ENDPOINT ||
  'https://atlasrouge.com/.netlify/functions/translate-property'

const SOURCE_LANG = 'fr'
const ALL_TARGETS = ['es', 'en']

function abort(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

if (!SUPABASE_URL) abort('Missing SUPABASE_URL (or VITE_SUPABASE_URL).')

// Two ways to authorize the writes:
//  (1) a service-role key (bypasses RLS), or
//  (2) an anon key + admin agent credentials — the script signs in and the
//      "Admin can manage all properties" RLS policy allows the updates.
const useServiceRole = Boolean(SERVICE_KEY)
if (!useServiceRole && !(ANON_KEY && ADMIN_EMAIL && ADMIN_PASSWORD)) {
  abort(
    'Need either SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY + ADMIN_EMAIL + ADMIN_PASSWORD in .env.local.',
  )
}

const supabase = createClient(SUPABASE_URL, useServiceRole ? SERVICE_KEY : ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let adminToken = null

async function authorize() {
  if (useServiceRole) {
    console.log('→ Auth: service-role key.')
    return
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })
  if (error) abort(`Admin sign-in failed: ${error.message}`)
  adminToken = data.session?.access_token || null
  console.log(`→ Auth: signed in as ${ADMIN_EMAIL} (admin).`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const nonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0
const nonEmptyArr = (v) => Array.isArray(v) && v.length > 0

/** Call the production translate-property function. Returns { es:{…}, en:{…} }. */
async function translate(content) {
  const headers = { 'Content-Type': 'application/json' }
  if (adminToken) headers.Authorization = `Bearer ${adminToken}`
  const res = await fetch(TRANSLATE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sourceLang: SOURCE_LANG, content }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`translate API ${res.status} ${body.slice(0, 140)}`)
  }
  return res.json()
}

/** Which target langs still need a translation for this row. */
function missingTargets(row) {
  return ALL_TARGETS.filter(
    (l) => !nonEmptyStr(row[`title_${l}`]) || !nonEmptyStr(row[`description_${l}`]),
  )
}

async function main() {
  await authorize()
  console.log('→ Fetching properties…')
  const { data: rows, error } = await supabase
    .from('properties')
    .select('*, neighborhoods(name)')
  if (error) abort(`Supabase read failed: ${error.message}`)

  const pending = (rows || []).filter((r) => missingTargets(r).length > 0)
  console.log(`Total properties: ${rows?.length ?? 0} · need translation: ${pending.length}`)
  if (pending.length === 0) {
    console.log('✓ Nothing to do — all listings already translated.')
    return
  }

  let ok = 0
  let failed = 0
  for (const row of pending) {
    const targets = missingTargets(row)
    const label = `[${row.slug || row.id}]`
    const content = {
      title: nonEmptyStr(row.title_fr) ? row.title_fr : row.title,
      description: nonEmptyStr(row.description_fr) ? row.description_fr : row.description,
      highlights: nonEmptyArr(row.highlights_fr) ? row.highlights_fr : row.highlights || [],
      amenities: row.amenities || [],
      transaction: row.transaction,
      type: row.type,
      city: row.city || 'Marrakech',
      neighborhood: row.neighborhoods?.name || '',
      priceEUR: row.price_eur,
      priceMAD: row.price_mad,
      surface: row.surface,
      landSurface: row.land_surface,
      rooms: row.rooms,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
    }

    if (!nonEmptyStr(content.title) || !nonEmptyStr(content.description)) {
      console.warn(`${label} ⚠ skipped: no French title/description to translate from.`)
      failed++
      continue
    }

    try {
      console.log(`${label} translating → ${targets.join(', ')}…`)
      const result = await translate(content)

      const update = {}
      // Seed the FR columns from the base fields if they were empty.
      if (!nonEmptyStr(row.title_fr)) update.title_fr = content.title
      if (!nonEmptyStr(row.description_fr)) update.description_fr = content.description
      if (!nonEmptyArr(row.highlights_fr)) update.highlights_fr = content.highlights

      for (const l of targets) {
        const t = result[l]
        if (!t || !nonEmptyStr(t.title) || !nonEmptyStr(t.description)) {
          throw new Error(`no ${l} content returned`)
        }
        update[`title_${l}`] = t.title
        update[`description_${l}`] = t.description
        update[`highlights_${l}`] = Array.isArray(t.highlights) ? t.highlights : []
      }

      const { data: updated, error: upErr } = await supabase
        .from('properties')
        .update(update)
        .eq('id', row.id)
        .select('id')
      if (upErr) throw new Error(`update failed: ${upErr.message}`)
      if (!updated || updated.length === 0) {
        throw new Error('update affected 0 rows (blocked by RLS — use a service-role key)')
      }

      console.log(`${label} ✓ saved (${targets.join(', ')})`)
      ok++
    } catch (e) {
      console.error(`${label} ✖ ${e instanceof Error ? e.message : e}`)
      failed++
    }

    await sleep(800) // gentle pacing
  }

  console.log(`\nDone. Translated: ${ok} · failed/skipped: ${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((e) => abort(e instanceof Error ? e.message : String(e)))
