#!/usr/bin/env node
// ============================================================================
// apply-migration.mjs — apply a SQL migration to Supabase via the Management API
// ============================================================================
// Usage:
//   node scripts/apply-migration.mjs supabase/migrations/007_xxx.sql [--force]
//   npm run migrate -- supabase/migrations/007_xxx.sql
//
// Reads SUPABASE_ACCESS_TOKEN (a Supabase Personal Access Token, "sbp_...") and
// SUPABASE_URL from .env.local. The token is NEVER logged. The project ref is
// derived from SUPABASE_URL.
//
// Why this exists: the Supabase REST API (PostgREST) cannot run raw SQL/DDL, and
// the anon/service keys don't apply migrations. The Management API endpoint
// POST /v1/projects/{ref}/database/query runs arbitrary SQL with a PAT — this is
// how migrations get applied from the repo without pasting them into Studio.
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
  } catch { /* no .env.local — fall back to process.env */ }
  return env
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const file = args.find((a) => !a.startsWith('--'))

if (!file) {
  console.error('Usage: node scripts/apply-migration.mjs <path-to.sql> [--force]')
  process.exit(1)
}

const env = { ...loadEnv() }
const token = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
const url = env.SUPABASE_URL || process.env.SUPABASE_URL

if (!token) {
  console.error('❌ Missing SUPABASE_ACCESS_TOKEN in .env.local.')
  console.error('   Create a Personal Access Token at: supabase.com → Account → Access Tokens')
  process.exit(1)
}
const ref = (url || '').match(/https?:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
if (!ref) {
  console.error('❌ Could not derive the project ref from SUPABASE_URL:', url || '(missing)')
  process.exit(1)
}

const sql = readFileSync(resolve(ROOT, file), 'utf8')

// Safety net: refuse obviously destructive statements unless --force is passed
// (which should only happen after explicit owner approval in chat).
const destructive = /\b(drop\s+table|truncate\b|drop\s+schema|delete\s+from\s+\w+\s*;)/i
if (destructive.test(sql) && !force) {
  console.error('⚠️  This migration looks destructive (DROP TABLE / TRUNCATE / unscoped DELETE).')
  console.error('   Re-run with --force only after explicit owner approval.')
  process.exit(2)
}

const blocks = sql.split(/;\s*\n/).filter((s) => s.trim() && !s.trim().startsWith('--')).length
console.log(`Applying ${file} → project ${ref} (~${blocks} statement blocks)…`)

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})

const text = await res.text()
if (!res.ok) {
  console.error(`❌ Management API error: HTTP ${res.status}`)
  console.error(text.slice(0, 600))
  process.exit(1)
}
console.log('✅ Migration applied successfully.')
if (text.trim()) console.log('Response:', text.slice(0, 400))
