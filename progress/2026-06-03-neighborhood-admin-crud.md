# 2026-06-03 — Neighborhood admin CRUD (Phase 1)

## Objective
Let admins create / edit / soft-delete / delete neighborhoods from the admin
panel (WordPress-style taxonomy management), done the professional way. This
is Phase 1 of the location-management work; Phase 2 (cities entity + cascade)
is planned separately.

## Best-practice decisions applied
- **Write RLS for admins only** (`is_admin()`), where before `neighborhoods`
  had only a public SELECT policy and no write path at all.
- **Soft delete** (`is_active`) instead of silent orphaning; public site shows
  active only; hard delete blocked in the UI when properties are linked.
- **Derived `property_count`** via trigger on `properties` (replaces the manual
  integer that already drifted: Médina stored 2, real 3). Backfill resyncs all.

## Files changed
- NEW `supabase/migrations/011_neighborhood_admin.sql` — is_active, RLS
  (select active/admin; insert/update/delete admin), recompute trigger +
  backfill.
- NEW `src/lib/adminRest.ts` — shared authenticated PostgREST helper (mirrors
  the pattern in propertyAdmin.service; supabase-js avoided — it hangs in admin).
- NEW `src/lib/imageCompress.ts` — `compressToWebp` (extracted logic from
  ImageUploader for single-image forms).
- NEW `src/services/admin/neighborhoodAdmin.service.ts` — list/create/update/
  setActive/delete + `slugify`.
- NEW `src/components/admin/NeighborhoodForm.tsx` — create/edit form, single
  photo upload (WebP), auto-slug.
- NEW `src/pages/admin/AdminNeighborhoods.tsx` — list + activate/deactivate +
  edit + delete (guarded), modal form. Admin-gated.
- EDIT `src/App.tsx` — lazy import + `/admin/neighborhoods` route.
- EDIT `src/components/admin/AdminSidebar.tsx` — admin-only "Barrios" nav item.
- EDIT `src/services/neighborhood.service.ts` — map `is_active`, filter public
  reads to active.
- EDIT `src/data/neighborhoods.ts` — `isActive?` on the interface.
- EDIT `src/types/supabase.ts` — `is_active` on `NeighborhoodRow`.
- EDIT `src/locales/{fr,es,en}/admin.json` — `sidebar.neighborhoods` +
  `neighborhoods.*` block (key parity across the 3 langs).

## Verification
- `npx tsc -b --noEmit` → green.
- `bash scripts/verify.sh` → green (lint + build; `AdminNeighborhoods` chunk
  emitted). Pre-existing warnings only (Fast Refresh, >500 kB mapbox/blog
  chunks).

## Status / blockers
- **Migration 011 NOT applied to production** — the prod-DB-write guard denied
  the automated apply; needs explicit owner approval (run `npm run migrate --
  supabase/migrations/011_neighborhood_admin.sql` or paste in Studio).
- **Push held.** Deploying the code before 011 is applied would break the live
  home: `neighborhood.service.ts` filters `is_active`, which doesn't exist yet,
  so the query errors and the home falls back to the 6 mock neighborhoods.
  Apply 011 first, then push.

## Next step
1. Owner approves applying migration 011.
2. Verify a non-admin agent cannot write neighborhoods; verify counts resynced
   (Médina → 3).
3. Push to main (Netlify auto-deploys). Then smoke-test the admin UI.
4. Phase 2 (cities entity + cascade) when scope confirmed.
