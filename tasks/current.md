# tasks/current.md — Atlas Rouge active task queue

> Single page of what's being worked on **right now**. Keep it short.
> Older completed tasks live in `progress/`. Strategic plans live in
> `README.md`. Operational truth lives in `HANDOFF_REPORT.md`.

**Last updated:** 2026-06-01 (Codex: P0 translate-property 401 fix local, verify green, pending deploy)

---

## `translate-property` 401 con sesión admin fresca — 2026-06-01 🟡 FIX LOCAL, PENDIENTE DEPLOY

Síntoma actual reportado: `/.netlify/functions/translate-property` devuelve
401 `Active agent session required` incluso con login fresco en incógnito, y
bloquea crear inmuebles. Contexto completo en `CODEX_HANDOFF_401.md`.

Fix local implementado por Codex:
- `netlify/functions/translate-property.js`: auth de agente activo ya no es una
  caja negra; devuelve `reason`, loguea intentos sin tokens, usa timeout y
  mantiene sesión válida + fila `agents` activa vía RLS. Añadido fallback seguro
  para validar con el access token como `apikey` si el anon key runtime está
  desalineado.
- `src/services/translation.service.ts`: nunca llama la función sin Bearer
  (fallback a `localStorage` si `getSession()` no responde) y solo redirige a
  login cuando el 401 indica sesión muerta, no por fallos de verificación de
  agente/config.

Verificación: `npx tsc -b --noEmit` verde; `node --check
netlify/functions/translate-property.js` verde; `bash scripts/verify.sh`
verde (3 warnings Fast Refresh preexistentes, build OK).

Pendiente:
- [ ] Commit + push a `main` para que Netlify auto-deploye (NO `netlify deploy`
      manual sin OK explícito).
- [ ] Verificar producción con **agente de prueba dedicado**, nunca con
      `creativedesignseo@gmail.com`.
- [ ] Si persiste 401, revisar `reason` del body + logs Netlify de la función.

---

## Sesión zombi → 401 en traducir/subir — 2026-06-01 ✅ RESUELTO Y DESPLEGADO

El navegador guardaba un token en localStorage de una sesión ya borrada en
el servidor (revocada por un signOut global previo). `checkAuth` solo leía
localStorage → UI "logueada" pero 401 en cada llamada autenticada. Fix:
`validateSession()` pregunta al servidor (`getUser()`) al cargar y purga el
token zombi → login limpio. Verificado vía Management API (auth.sessions
vacío para el user). Desbloqueo del owner: cerrar sesión + entrar de nuevo.
Detalle: `HANDOFF_REPORT.md` (cierre 2026-06-01 noche 2ª parte).

⚠️ **REGLA:** verificar SIEMPRE con un AGENTE DE PRUEBA dedicado, NUNCA con
la cuenta del owner (un signOut global le deja sesión zombi). Pendiente:
crear ese agente de prueba.

---

## Crear inmueble — HTTP 400 — 2026-06-01 ✅ RESUELTO Y DESPLEGADO

El formulario de admin nunca pudo crear inmuebles: el `<select>` de Barrio
mandaba el **slug** pero `properties.neighborhood_id` es `uuid` (FK) →
`invalid input syntax for type uuid` → 400. Fix en 4 archivos (select usa
`n.id`, `''`→`null` en `toDbInsert`, tipo `Neighborhood.id`, mapper). Arregla
también la edición. Verificado vía Management API (insert con null y uuid →
OK, rollback). Detalle en `HANDOFF_REPORT.md` (cierre 2026-06-01 noche) y
`progress/2026-06-01-fix-property-create-400.md`.

---

## i18n panel admin + amenities — 2026-05-30 ✅ DESPLEGADO Y VERIFICADO

Commits `7a671e34` + `cbb235fa` en `main`. Detalle:
`progress/2026-05-30-i18n-admin-amenities.md`.

- [x] `PropertyForm` labels FR → i18n + auto-traducir al guardar (Parte B).
- [x] `AdminLogin` → claves `login.*`.
- [x] **Amenities** traducidas en TODA la web (admin + cards + filtros + ficha):
      `amenities.json` poblado (16 de BD), helper `src/lib/amenities.ts`.
- [x] Verificado en prod (Playwright): admin form y público 100% en ES,
      `stillFrench: []`.
- [x] **Conmutador de idioma FR|ES|EN** en el panel de Traducciones de
      `PropertyForm` (commit `28cc33cd`, desplegado): pestañas en vez de
      acordeones, editable, badge `fuente` + punto verde si rellenado.
      Verificado en prod (pestaña FR muestra el contenido francés).

### Pendiente relacionado
- [ ] **Batch de CONTENIDO** (títulos/descr/highlights de inmuebles) — sigue
      bloqueado esperando `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (RLS
      bloquea UPDATE con login admin). Script listo:
      `scripts/translate-existing-properties.mjs` (sin commitear aún, con
      `package.json` translate:properties). Owner pone la key → corro
      `npm run translate:properties`.

---

## Mapbox migration — 2026-05-30 ✅ DESPLEGADO Y VERIFICADO EN PROD

Map engine migrado MapLibre GL → **Mapbox GL JS v3** (estilo **Standard 2D
plano**) en `Search.tsx` (MapView) y `LocationMap.tsx`, vía `src/lib/mapbox.ts`.
Commit `70af4956`, desplegado en https://atlasrouge.com. Detalle:
`progress/2026-05-30-mapbox-migration.md`.

- [x] Código: `maplibre-gl` → `mapbox-gl@3.24`, `src/lib/mapbox.ts`,
      `src/vite-env.d.ts`, `.env.example`, guard `hasMapboxToken` + fallback,
      `canUseWebGL` exige WebGL2.
- [x] CSP en `netlify.toml`: `connect-src` + api/events.mapbox.com,
      `worker-src 'self' blob:`.
- [x] `VITE_MAPBOX_TOKEN` en Netlify (all contexts). Token restringido a
      atlasrouge.com (correcto). NO commiteado en el repo.
- [x] Deploy + verificación en vivo: tiles HTTP 200, 0 errores, basemap OK.
- [ ] (Opcional, solo dev local) owner añade `localhost` a las URLs del token o
      usa el Default public token + `VITE_MAPBOX_TOKEN` en `.env.local`.

---

## Current state

Site is **live in production** on Netlify (`atlasrouge.com`).
`origin/main` last commit `34af320b`. verify.sh green.

⚠️ **There is unmerged, uncommitted Phase 0 work in the working tree**
(2026-05-29). The code is written and verify.sh is green, but **the SQL
has NOT been applied in Supabase Studio and NOTHING has been deployed**.
These are fixes **implemented, pending SQL apply + deploy** — not yet
live in production. See the section below.

A **13-agent production-readiness audit** ran 2026-05-26 →
`AUDIT_REPORT.md` at repo root. **Score 22/100 🛑** (mechanically
harsh: 19.5 pts come from the N/A Payments area; the engineering
foundation is strong — TS strict, 0 npm vulns, real service layer).
**7 P0s** identified; 2 fixed 2026-05-26 (i18n), 3 engineering P0s
implemented 2026-05-29 (pending apply/deploy), 2 legal P0s still owner-
side. See the lists below and `AUDIT_REPORT.md` for the full roadmap.

---

## Phase 0 — implemented 2026-05-29 (pending SQL apply + deploy)

These are **code-complete and verify.sh-green**, but **not live**: the
SQL must be pasted by the owner in Supabase Studio and the branch must
be committed + pushed (Netlify auto-deploys `main`). Until then,
production still has the original holes.

- [x] **P0-1 · Privilege escalation (SEC-001/DB-001/ADM-001)** —
      **APPLIED IN PRODUCTION 2026-06-01.** Migration
      `supabase/migrations/006_fix_agent_update_rls.sql` applied via SQL
      Editor (project `slxlkbrqcjabsfuhlwdf`). ⚠️ Real policy name in prod
      is `agents_update_own` (NOT "Agent can update own row" — the prod DB
      wasn't built from these numbered migrations; names differ). Verified
      live with `pg_policies`: `agents_update_own` now has a `WITH CHECK`
      that freezes `role`/`is_active` via subquery (was NULL → escalation
      open). Hardening block sets `search_path` on all `public.is_*`
      helpers (tolerant DO block; the literal `ALTER FUNCTION public.is_agent()`
      failed because those exact names don't exist in prod). Client side:
      `updateAgent()` in `src/services/auth.service.ts` narrowed to
      `AgentSelfUpdate` (`Pick` name/phone/bio/photo_url) — still
      uncommitted in working tree.
- [~] **P0-4 · Canonical/hreflang dynamic** — implemented.
      `netlify/edge-functions/og-rewrite.ts` now rewrites canonical +
      hreflang per route on all pages (`config.path` widened to
      `/fr/*`, `/es/*`, `/en/*`). New `scripts/generate-sitemap.mjs` +
      `prebuild` in `package.json` generate a dynamic trilingual sitemap
      (posts/properties/neighborhoods, domain `atlasrouge.com`, fault-
      tolerant). `public/sitemap.xml` is now build output (gitignored,
      no longer tracked). Closes PERF-002 too. **⚠️ Not deployed.**
- [~] **P0-5 · Migration drift** — implemented. New
      `supabase/migrations/000_base_schema.sql` (idempotent
      `CREATE TABLE IF NOT EXISTS` for neighborhoods / properties /
      contact_submissions / favorites / site_settings). Rebuilding from
      `migrations/` no longer fails on 001. **Do not re-apply over prod.**
- [~] **Close open serverless functions (SEC-002/003, P1 pulled
      forward)** — implemented. `translate-property.js` now requires an
      active-agent session (JWT validated against `/auth/v1/user` +
      agents check) + CORS allowlist + best-effort rate-limit;
      `notify-lead.js` gets CORS + OPTIONS + origin check;
      `translation.service.ts` attaches the Bearer token. **⚠️ Not
      deployed; needs Netlify env vars (see owner boundaries).**
- [~] **Error Boundary (ARCH-002, P1 pulled forward)** — implemented.
      New `src/components/ErrorBoundary.tsx` mounted in `main.tsx`, i18n
      fallback (new keys in `src/locales/{fr,es,en}/errors.json`).

### Owner boundaries to close this Phase 0 (next steps)
- [ ] **Apply `supabase/migrations/006_fix_agent_update_rls.sql`** in
      Supabase Studio, then **verify a non-admin agent cannot self-
      promote** (`update({role:'admin'})` from DevTools must be rejected).
- [ ] **Verify Netlify env vars**: the build/sitemap needs
      `SUPABASE_URL` + `SUPABASE_ANON_KEY` (or service key); the
      functions need `SUPABASE_URL` + `SUPABASE_ANON_KEY` to validate
      the JWT. Without them the prebuild sitemap and the function auth
      degrade.
- [ ] **Approve commit + push** of the working-tree changes (Netlify
      auto-deploys `main`).

---

## P0 — still open (owner / legal — needs Khalid + lawyer)
- [ ] **P0-2 · Privacy Policy (RGPD)** — none exists. Lawyer.
- [ ] **P0-3 · Mentions Légales** — mandatory in France. Lawyer + RC/ICE.

### Already fixed 2026-05-26
- [x] ~~**UX-001/UX-002 — i18n of GestionLocative, BuyerGuide, About**~~
      DONE 2026-05-26 (commit `593e47ae`). 218 keys translated FR/ES/EN
      by 3 parallel subagents. Key parity verified, build green.

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

- [n/a] **DB-003 · Duplicate leads RLS policies** — **does NOT apply.**
      `004_leads.sql` already defines the leads policies cleanly; there
      is no duplicate set to drop. The earlier worry (from the audit)
      was based on a stale read. No migration needed for this.
- [x] ~~**i18n P0-6/P0-7 (GestionLocative/BuyerGuide/About in French)**~~
      Resolved in commit `593e47ae` (2026-05-26). Listed here for the
      record; it is the same as UX-001/UX-002 above.
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

**Close out Phase 0 (owner boundaries):** apply
`006_fix_agent_update_rls.sql` in Supabase Studio and verify a non-admin
agent cannot self-promote; confirm the Netlify env vars
(`SUPABASE_URL`/`SUPABASE_ANON_KEY`) so the prebuild sitemap and the
function JWT checks work; then approve the commit + push so Netlify
deploys the working-tree changes. Only after that are P0-1/P0-4/P0-5
actually closed in production. In parallel, Khalid + lawyer on the legal
P0s (P0-2/P0-3).

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
