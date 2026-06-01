# Implement Phase 0 stop-the-bleed (security + SEO)

**Date:** 2026-05-29 (started)
**Status:** in-progress (code complete + verify.sh green; pending SQL apply in Studio + commit + deploy)
**Related:** AUDIT_REPORT.md §Phase 0, tasks/current.md#phase-0, HANDOFF.md §1/§4/§5, ADR-001 (auth↔agents coupling)

## Objective

Close the Phase 0 ("stop the bleed") engineering items from the
13-agent audit before promoting the site: privilege escalation (P0-1),
static canonical/hreflang (P0-4), migration drift (P0-5), open
serverless functions (SEC-002/003), and the missing Error Boundary.
Code-only this session; the SQL apply and deploy are owner boundaries.

## Files inspected

- `AUDIT_REPORT.md` — the 7 P0s + High findings with ready fixes.
- `tasks/current.md`, `HANDOFF.md`, `HANDOFF_REPORT.md` — prior state.
- `supabase/migrations/001_agents.sql`, `004_leads.sql` — RLS baseline;
  confirmed 004 already defines leads policies cleanly (DB-003 N/A).
- `src/services/auth.service.ts` — `updateAgent()` accepted `role`/`is_active`.

## Files changed

- `supabase/migrations/006_fix_agent_update_rls.sql` (new) — `WITH CHECK`
  subquery freezing `role`/`is_active` + `SET search_path` on
  `is_agent`/`is_admin_role`/`is_active_agent` (covers DB-005).
- `supabase/migrations/000_base_schema.sql` (new) — idempotent
  `CREATE TABLE IF NOT EXISTS` for neighborhoods/properties/
  contact_submissions/favorites/site_settings.
- `src/services/auth.service.ts` — `updateAgent()` narrowed to
  `AgentSelfUpdate` (`Pick` name/phone/bio/photo_url).
- `netlify/edge-functions/og-rewrite.ts` — per-route canonical+hreflang;
  `config.path` widened to `/fr/* /es/* /en/*`.
- `scripts/generate-sitemap.mjs` (new) + `package.json` `prebuild` —
  dynamic trilingual sitemap (posts/properties/neighborhoods, domain
  atlasrouge.com, fault-tolerant). `public/sitemap.xml` now build output.
- `.gitignore` — untracks `public/sitemap.xml`.
- `netlify/functions/translate-property.js` — active-agent JWT check +
  CORS allowlist + best-effort rate-limit.
- `netlify/functions/notify-lead.js` — CORS + OPTIONS + origin check.
- `src/services/translation.service.ts` — attaches Bearer token.
- `src/components/ErrorBoundary.tsx` (new) + `src/main.tsx` — global
  boundary; `src/locales/{fr,es,en}/errors.json` — fallback i18n keys.

## Commands run

- `bash scripts/verify.sh` (lint + build) → green.

## Verification

`scripts/verify.sh` passes (lint + build). SQL not executed (the REST
API cannot run raw SQL; migrations are applied by hand in Studio). No
deploy performed. Privilege-escalation fix is NOT yet verifiable in
production because migration 006 has not been applied.

## Open risks

- **Production still vulnerable** to the P0-1 escalation until the owner
  applies `006_fix_agent_update_rls.sql` in Supabase Studio and verifies
  a non-admin agent cannot self-promote.
- **SEO/sitemap/function-auth fixes are inert** until commit + push
  (Netlify auto-deploys `main`).
- **Build/sitemap and function JWT validation depend on Netlify env
  vars** (`SUPABASE_URL` + `SUPABASE_ANON_KEY`, or service key for the
  build). If missing, the prebuild sitemap degrades and the function
  auth cannot validate tokens.
- Legal P0s (P0-2/P0-3) remain fully owner + lawyer side.

## Next step

Owner: apply migration 006 in Studio + verify no self-promotion; confirm
Netlify env vars; then approve commit + push to deploy. Only then are
P0-1/P0-4/P0-5 closed in production.
