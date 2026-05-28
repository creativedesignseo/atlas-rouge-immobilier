# tasks/current.md — Atlas Rouge active task queue

> Single page of what's being worked on **right now**. Keep it short.
> Older completed tasks live in `progress/`. Strategic plans live in
> `README.md`. Operational truth lives in `HANDOFF_REPORT.md`.

**Last updated:** 2026-05-26 (late — full saas-audit + i18n migration)

---

## Current state

Site is **live in production** on Netlify (`atlasrouge.com`).
`origin/main` in sync (last commit `8987f624`). verify.sh green.

A **13-agent production-readiness audit** ran 2026-05-26 →
`AUDIT_REPORT.md` at repo root. **Score 22/100 🛑** (mechanically
harsh: 19.5 pts come from the N/A Payments area; the engineering
foundation is strong — TS strict, 0 npm vulns, real service layer).
**7 P0s** identified; 2 already fixed today (i18n). See the P0 list
below and `AUDIT_REPORT.md` for the full P0-P3 + phased roadmap.

---

## P0 — from the audit, blocking a clean public launch

### Already fixed today
- [x] ~~**UX-001/UX-002 — i18n of GestionLocative, BuyerGuide, About**~~
      DONE 2026-05-26 (commit `593e47ae`). 218 keys translated FR/ES/EN
      by 3 parallel subagents. Key parity verified, build green.

### Still open (engineering — Claude can do)
- [ ] **P0-1 · Privilege escalation (SEC-001/DB-001/ADM-001)** —
      RLS policy `"Agent can update own row"` lacks `WITH CHECK`; any
      agent can `update({role:'admin'})` from DevTools. SQL fix ready
      in `AUDIT_REPORT.md` § P0-1. ~30 min via Supabase Studio.
      **Highest-priority real security hole.**
- [ ] **P0-4 · Canonical/hreflang static** — every interior page
      declares the homepage canonical → SEO collapse risk. Needs
      per-route head management (react-helmet-async or extend
      og-rewrite edge fn).
- [ ] **P0-5 · Migration drift** — base tables only in `schema.sql`,
      not in numbered migrations → DB not reproducible. Create
      `000_base_schema.sql`.
- [ ] **Close open serverless functions** (SEC-002/003) —
      `notify-lead` + `translate-property` have no auth, CORS `*`.
      translate-property burns DeepSeek quota. Add JWT + CORS lockdown.

### Still open (owner / legal — needs Khalid + lawyer)
- [ ] **P0-2 · Privacy Policy (RGPD)** — none exists. Lawyer.
- [ ] **P0-3 · Mentions Légales** — mandatory in France. Lawyer + RC/ICE.

---

## P0 — owner config (Khalid) — pre-launch

- [x] ~~**Rotate `DEEPSEEK_API_KEY`**~~ — DONE 2026-05-26. Old key
      `sk-d047f...8752` deleted on platform.deepseek.com. New key
      configured in Netlify env vars as `DEEPSEEK_API_KEY` 🔒
      (Specific scopes: Builds, Functions, Runtime · 4 deploy
      contexts). `VITE_DEEPSEEK_API_KEY` also removed from Netlify.
      Verified live: `POST /.netlify/functions/translate-property`
      → HTTP 200 with correct FR→EN+ES translation. Fallback
      `process.env.VITE_DEEPSEEK_API_KEY` removed from the function
      code.

- [x] ~~**Supabase Site URL + Redirect URLs**~~ — DONE 2026-05-26.
      Site URL set to `https://atlasrouge.com`. Redirect URLs
      whitelist contains atlasrouge.com, www.atlasrouge.com,
      localhost:3000, localhost:5173, atlasrouge.com/auth/callback.
      `freecoche.com` removed.

- [x] ~~**Apply migration `005_agents_auto_provisioning.sql`**~~ —
      DONE 2026-05-26. Trigger `on_auth_user_created` applied and
      verified end-to-end: created test user via Admin API → trigger
      auto-inserted agents row (role='agent', is_active=false) →
      DELETE cascaded correctly. Orphan-user gap permanently closed.
      Hotfix during apply: initial migration used role='viewer' which
      violated the CHECK constraint defined in migration 001; patched
      to 'agent' (commit `f40cedff`).

- [x] ~~**Leads pipeline (`estimation_requests` + `newsletter_subscribers`)**~~
      — DONE 2026-05-26. Tables already existed from migration 004
      (applied previously). Missing RLS policies added: anon can
      INSERT, only active agents can SELECT/UPDATE. Verified
      end-to-end via curl with the anon key:
        POST /rest/v1/estimation_requests → HTTP 201 ✅
        POST /rest/v1/newsletter_subscribers → HTTP 201 ✅
      Frontend code (`leads.service.ts`) uses `.insert()` without
      `.select()` so it does not trigger the RETURNING/SELECT
      policy check that would fail for anon users. Form submissions
      now reach the DB.
- [ ] **Apply migration `004_leads.sql`** in Supabase Studio.
- [ ] **Update `site_settings`** with real phone, WhatsApp, email,
      physical address.
- [ ] **Configure custom SMTP** for transactional email branding
      (currently using Supabase default).
- [ ] **Upload Sofia's professional photo + bio** (`agents` table,
      id `08f2006c-0d47-464b-9fd4-518b214c1a6b`).
- [ ] **Contract Supabase Pro (~€25/mo)** + Netlify Pro (~€20/mo)
      before traffic ramp.

---

## P1 — important, not blocking

- [ ] **Add `typecheck` and `test` scripts to `package.json`** so
      `scripts/verify.sh` actually validates types and tests, not
      just lint+build.
- [ ] **Bundle split for `maplibre` and `AdminBlogForm`** (>500 kB
      chunks). Both already lazy-loaded; manualChunks would polish.
- [ ] **Rename `HANDOFF_REPORT.md` → `HANDOFF.md`** to align with
      the harness convention. Or keep both with a symlink.

---

## Blocked

*(none right now — all blockers are owner-side P0 items above)*

---

## Next recommended action

Wait for Khalid to complete the P0 checklist (especially Supabase
URL config + DEEPSEEK rotation). On the dev side: add `typecheck`
script to `package.json` so verify.sh covers TS errors.

---

## Known pre-existing failures (not blockers, but on the floor)

- `npm run lint`: 3 `react-refresh/only-export-components` warnings
  (RichTextRenderer.tsx, useFavorites.tsx). Not errors. Triggered by
  exporting helper constants/types alongside the component. Cosmetic
  — fixable by splitting into separate files but no functional
  impact.
- Build warns "chunks larger than 500 kB" for `maplibre` (1 MB) and
  `AdminBlogForm` (404 kB). Both are lazy-loaded; not on the main
  bundle path.

---

## Out of scope right now

- **Sofia AI agent backend** — already shipped (dynamic from DB);
  no changes planned this sprint.
- **B2B / wholesale features** — not in scope for Atlas Rouge; that
  pattern lives in the Piro project.
- **Server-side rendering** — Vite SPA is the chosen stack
  (decision lives in commit history).
