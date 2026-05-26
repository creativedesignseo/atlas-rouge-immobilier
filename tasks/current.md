# tasks/current.md — Atlas Rouge active task queue

> Single page of what's being worked on **right now**. Keep it short.
> Older completed tasks live in `progress/`. Strategic plans live in
> `README.md`. Operational truth lives in `HANDOFF_REPORT.md`.

**Last updated:** 2026-05-26

---

## Current state

Site is **live in production** on Netlify (`atlasrouge.com`). The
360° pre-launch audit (5 parallel agents: Security, UI, i18n, SEO,
Admin) is complete and all 6 blockers (B1–B6) closed in commits up
through `e9842646`. `origin/main` is in sync. Next phase = client
hand-off: Khalid must complete several manual config tasks before
the public marketing push.

---

## P0 — blocking ship / public launch

These are **owner actions** (Khalid). Cannot be done by Claude / agents.

- [ ] **Supabase Site URL + Redirect URLs** — Dashboard → Auth → URL
      Configuration. Set Site URL to `https://atlasrouge.com`. Keep
      `http://localhost:3000/**` and `http://localhost:5173/**` for
      dev. Remove `https://immobilier.freecoche.com/**` in 2-3 weeks.
- [x] ~~**Rotate `DEEPSEEK_API_KEY`**~~ — DONE 2026-05-26. Old key
      `sk-d047f...8752` deleted on platform.deepseek.com. New key
      configured in Netlify env vars as `DEEPSEEK_API_KEY` 🔒
      (Specific scopes: Builds, Functions, Runtime · 4 deploy
      contexts). `VITE_DEEPSEEK_API_KEY` also removed from Netlify.
      Verified live: `POST /.netlify/functions/translate-property`
      → HTTP 200 with correct FR→EN+ES translation. Fallback
      `process.env.VITE_DEEPSEEK_API_KEY` removed from the function
      code.
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
