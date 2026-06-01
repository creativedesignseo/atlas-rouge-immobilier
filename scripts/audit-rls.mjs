#!/usr/bin/env node
// ============================================================================
// audit-rls.mjs — quick RLS health check for the Supabase project
// ============================================================================
// Usage: npm run audit:rls   (reads SUPABASE_ACCESS_TOKEN + SUPABASE_URL from .env.local)
//
// Flags, in red, the things that bite a real-estate lead-gen app:
//   🔴 sensitive tables readable by `anon` (PII leak)
//   🔴 tables with RLS disabled
//   🟡 tables with RLS on but NO policies (locked out)
// Run it before declaring "everything works" — it turns a generic claim into a
// real check. Read-only: only runs SELECTs via the Management API.
// ============================================================================

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const env = {}
  try {
    for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* fall back to process.env */ }
  return env
}

// Tables holding personal / sensitive data — must NEVER be readable by anon.
const SENSITIVE = new Set([
  'contact_submissions', 'estimation_requests', 'newsletter_subscribers',
  'agents', 'admins',
])

const env = { ...loadEnv() }
const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
const ref = (env.SUPABASE_URL || process.env.SUPABASE_URL || '').match(/https?:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
if (!token || !ref) {
  console.error('❌ Need SUPABASE_ACCESS_TOKEN + SUPABASE_URL in .env.local')
  process.exit(1)
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  if (!res.ok) throw new Error(`Management API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

const findings = []

// 1) RLS state per table + policy count
const tables = await query(`
  SELECT c.relname AS tbl, c.relrowsecurity AS rls,
         (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) AS policies
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname;`)

for (const t of tables) {
  if (!t.rls) findings.push(`🔴 ${t.tbl}: RLS DESACTIVADO (tabla abierta)`)
  else if (Number(t.policies) === 0) findings.push(`🟡 ${t.tbl}: RLS activo pero SIN políticas (nadie accede)`)
}

// 2) Sensitive tables exposed to anon for SELECT/ALL
const anonReads = await query(`
  SELECT tablename, policyname, cmd FROM pg_policies
  WHERE schemaname='public' AND cmd IN ('SELECT','ALL')
    AND roles::text LIKE '%anon%';`)

for (const p of anonReads) {
  if (SENSITIVE.has(p.tablename)) {
    findings.push(`🔴 ${p.tablename}: legible por ANÓNIMOS (${p.cmd} · ${p.policyname}) — posible fuga de PII`)
  }
}

console.log(`\nAuditoría RLS — proyecto ${ref}\n${'='.repeat(48)}`)
console.log(`Tablas revisadas: ${tables.length}`)
if (findings.length === 0) {
  console.log('✅ Sin hallazgos. Ninguna tabla sensible expuesta a anónimos; RLS OK.')
} else {
  console.log(`\n${findings.length} hallazgo(s):`)
  for (const f of findings) console.log('  ' + f)
  process.exitCode = 1
}
console.log('')
