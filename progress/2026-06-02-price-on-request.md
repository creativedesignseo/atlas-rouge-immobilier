# Price on request ("Prix Nous Consulter") — 2026-06-02

## Objective
Let an agent publish a property **without showing its price** publicly. The
price is still entered and stored (agents see it in the admin); a per-property
toggle hides the number on the public site and shows a localized
"contact us for price" label instead.

Requested by the owner (Khalid) with a reference screenshot (a listing card
showing "Prix Nous Consulter" in place of the number).

## Decisions
- Boolean flag `price_on_request`, mirroring the existing `is_featured` /
  `is_exclusive` pattern end-to-end.
- Public label: FR `Prix Nous Consulter` · ES `Precio a consultar` ·
  EN `Price on request` (confirmed with owner).
- Admin control: a **Switch** (perilla) next to the EUR price field.
- Price formatting centralized in a new hook `usePropertyPrice()` instead of
  repeating the conditional at all 6 render sites.

## Files changed
- `supabase/migrations/010_price_on_request.sql` (new) — `ALTER TABLE
  properties ADD COLUMN IF NOT EXISTS price_on_request BOOLEAN NOT NULL
  DEFAULT FALSE`.
- `src/hooks/usePropertyPrice.ts` (new) — `(property) => string`; returns the
  localized label when `priceOnRequest`, else `formatPrice(priceEUR)`.
- `src/data/properties.ts` — `priceOnRequest?: boolean` on `Property`.
- `src/types/supabase.ts` — `price_on_request: boolean` on `PropertyRow`
  (propagates to `PropertyInsert`/`PropertyUpdate`).
- `src/services/property.service.ts` — map `price_on_request` → `priceOnRequest`.
- `src/services/admin/propertyAdmin.service.ts` — `PropertyFormData` +
  `toDbInsert()` + `getPropertyForEdit()`.
- `src/components/admin/PropertyForm.tsx` — Zod field, default, Switch control
  under the EUR input.
- `src/pages/PropertyDetail.tsx` — main price via hook; hide €/m² when
  `priceOnRequest`. (NOTE: this file also carries the unrelated, still-uncommitted
  specs-table redesign — split into two commits when committing.)
- `src/components/PropertyCard.tsx`, `src/pages/Search.tsx` (4 render modes
  incl. map popup + a short label on the map pin).
- `src/locales/{fr,es,en}/property.json` (`priceOnRequest`) and
  `admin.json` (`propertyForm.priceOnRequest`).

## Commands run
- `npm run migrate -- supabase/migrations/010_price_on_request.sql` →
  `✅ Migration applied successfully` (Supabase Management API).
- `bash scripts/verify.sh` → green (tsc -b + eslint + vite build).

## Verification status
- ✅ Type-check + lint + build green.
- ✅ Migration applied via Management API (no error; idempotent ADD COLUMN).
- ⚠️ NOT yet verified end-to-end in a running app: admin → toggle on → save →
  see "Prix Nous Consulter" on home/search/detail while the agent still sees
  the number in the admin. Column existence not confirmed by a direct query
  (Supabase MCP returned "no permission"; relying on the migrator's success).
- Committed `16dae844` and pushed to `main` (Netlify auto-deploy triggered).

## Open risks / next step
- Run the real end-to-end check (login admin, edit a property, toggle, save).
- When committing: separate the PropertyDetail specs-redesign from this feature.
- Price-range search filters intentionally untouched (listing keeps its real
  internal price, so it still falls in range; only display changes).
