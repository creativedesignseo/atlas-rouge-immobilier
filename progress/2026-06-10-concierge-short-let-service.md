# Add short-let concierge (Airbnb) management service

**Date:** 2026-06-10 (started and completed)
**Status:** completed (live in production; commercial figures pending owner)
**Related:** tasks/current.md#nuevo-servicio-conciergerie, HANDOFF_REPORT.md
(cierre 2026-06-10), src/pages/GestionLocative.tsx

## Objective

Khalid asked to add a **conciergerie de location courte durée** offering:
the owner hands over their property, Atlas Rouge runs it as a short-let
(Airbnb/Booking) and charges a commission on rental income. This is a
high-demand, recurring-margin product in Marrakech and the natural
owner-acquisition product (same audience as the `/epure` landing and the
owner-acquisition Google Ads campaign). It is **distinct** from the
existing "Gestion locative" page, which is **long-term** management
(tenant search, annual lease, 8/10/12 % tiers).

Owner decision (Jonatan, via in-chat options): **fold it into the same
`GestionLocative` page** (do NOT touch the home 3×2 service grid) and ship
**the service only** now — the SEO blog cluster is a later phase.

## Files inspected

- `src/pages/Home.tsx` — how the 6-card service grid is rendered
  (`serviceKeys`/`serviceLinks`/`serviceIcons`); confirmed adding a 7th
  card would break the 3×2 grid → reinforced the "fold" decision.
- `src/pages/GestionLocative.tsx` — existing long-term page structure
  (hero / services / pricing tiers / cta) to append a section cleanly.
- `src/lib/routes.ts` — localized slugs: fr `gestion-locative`, es
  `gestion-alquileres`, en `property-management`.
- `src/locales/{fr,es,en}/services.json` + `home.json` — i18n shape and
  the existing `rental.*` namespace; `buyerGuide.json:221` already states
  the market commission range (15-25 %).

## Files changed

- `src/pages/GestionLocative.tsx` — new midnight **Conciergerie** section:
  6 deliverable cards (listing+photos / dynamic pricing / bookings+guests
  / check-in+out / cleaning+laundry / maintenance+reporting), a
  "how it works" block, and a **"Request a quote"** CTA → `/contact`.
  Added a "Long-term" badge above the existing section so the pair reads
  clearly. New lucide icons imported.
- `src/locales/{fr,es,en}/services.json` — `rental.services.badge` +
  `rental.concierge.*` (badge/heading/subheading/6 items/model/cta).
  Key parity verified identical across the three locales. Naming: FR
  `Conciergerie`, ES `alquiler turístico` (NOT "conserjería" — that is a
  building janitor in ES), EN `Concierge — short-let`.
- `src/locales/{fr,es,en}/home.json` — `management` card description now
  mentions both modalities (long-term + short-let concierge).
- `HANDOFF_REPORT.md`, `tasks/current.md` — closure entries.

## Commands run

```
bash scripts/verify.sh                 # green (lint + build)
node -e "...parity check..."            # concierge keys identical fr/es/en
npm run preview + Playwright            # render check fr/es/en (no raw keys)
git commit 4dedfc87 ; git push         # feature
git commit 137077e7 ; git push         # docs (verified reality)
netlify api listSiteDeploys            # deploy 137077e7 -> ready
Playwright on https://atlasrouge.com   # live verification, all 3 locales
```

## Verification

- `verify.sh` green (lint + build). The two skipped scripts
  (typecheck/test) are the known pre-existing gap, not introduced here.
- i18n key parity check: `rental.concierge` items/model/cta identical in
  fr/es/en; both `badge` keys present.
- **Live in production** (`atlasrouge.com`, deploy `137077e7` ready),
  verified with Playwright on the real site in FR/ES/EN: concierge
  heading present, 6 cards rendered, CTA + "tailored commission" note
  present, the long-term section (8/10/12 % tiers) still intact, and
  **zero raw i18n keys** in any locale.
- This is a static, i18n-driven content section — no data-loading/auth
  path touched, so the 3-persona matrix (anon/logged-in/slow-net) does
  not apply here.

## Open risks

- **Commercial copy is a placeholder by design.** No commission figure or
  plan was invented (rule: never invent data). Pricing renders as
  "request a quote"; the model line says "commission on income, no fixed
  fees". When Khalid confirms (1) his real commission (~20 %? tiers?),
  (2) exactly what is included, (3) single all-inclusive offer vs. tiers,
  the section should be updated and redeployed.
- The CTA points to the generic `/contact`; once the offering is final it
  may deserve a dedicated lead path / subject tag for owner enquiries.

## Next step

Wait for Khalid's real commission/inclusions/tiers, then update the
`rental.concierge` copy (and optionally add tier cards mirroring the
long-term `pricing` block). Phase 2: build the owner-acquisition SEO blog
cluster (e.g. "Combien rapporte un Airbnb à Marrakech") as the Ads /
`/epure` funnel destination.
