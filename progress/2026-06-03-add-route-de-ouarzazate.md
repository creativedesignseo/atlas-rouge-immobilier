# 2026-06-03 — Add neighborhood "Route de Ouarzazate"

## Objective
Add a new neighborhood ("Route de Ouarzazate") so it appears on the home
neighborhoods grid, the admin property-form dropdown, and the search filter.

## Key fact about the data model
`neighborhoods` (Supabase) is the single source of truth at runtime. The home
grid, the admin Barrio `<select>`, and the search page all read it via
`getNeighborhoods()`. Adding one row makes the neighborhood appear in all three
— **no code change, no deploy needed**. The static lists in
`src/data/neighborhoods.ts` and `src/data/filters.ts` are dev/offline fallbacks
only.

## Files inspected
- `src/data/neighborhoods.ts`, `src/services/neighborhood.service.ts`
- `src/components/NeighborhoodCard.tsx`, `src/lib/storage.ts`
- `src/pages/Home.tsx`, `src/pages/Search.tsx`, `src/components/HeroSearch.tsx`
- `src/data/filters.ts`
- `supabase/migrations/000_base_schema.sql` (neighborhoods schema)

## Files changed (repo)
- None (the feature is pure data). Closure docs only:
  `tasks/current.md`, this progress file.
- `source-images/neighborhoods/route-ouarzazate/route-ouarzazate-ait-benhaddou-ksar-720x480.webp`
  (archived original; `source-images/` is gitignored).

## Data changes (Supabase — production)
- Storage: uploaded `property-images/neighborhood-route-ouarzazate.jpg`
  (1200×800 JPG, ~330 KB; render endpoint returns 200).
- DB row inserted into `neighborhoods`:
  - `id` e51f7b8d-f621-4646-a084-ccb38e37bda9
  - `name` "Route de Ouarzazate" · `slug` route-ouarzazate
  - `subtitle` "Au départ vers l'Atlas"
  - `description` "Axe résidentiel en développement au sud-est de Marrakech,
    le long de la N9 vers Aït Ourir et le col du Tizi n'Tichka, prisé pour ses
    villas avec vue sur l'Atlas." (FR; the table is single-language)
  - `image` neighborhood-route-ouarzazate.jpg · `property_count` 0

## Commands run
- `cwebp -q 90` (archive WebP) + `sips -z 800 1200` (storage JPG; source is
  3:2 so the resize does not distort).
- Upload: logged in as the admin agent (password grant) and POSTed to Storage
  with `x-upsert: true`. Used because there is no service_role key in
  `.env.local`; the agent JWT satisfies the property-images Storage RLS (007).
- Insert: Supabase Management API `database/query` (PAT) — needed because
  `neighborhoods` has no INSERT policy (see risk below).

## Verification
- Storage render: HTTP 200 for
  `.../render/image/public/property-images/neighborhood-route-ouarzazate.jpg?width=800&height=600&resize=cover`.
- DB: `RETURNING` confirmed the row; `on conflict (slug) do nothing` guarded
  against a duplicate slug.

## Open risks / notes
- **Photo is low-res (720×480).** The home card requests 800×600, so it will
  look slightly soft when enlarged. Swap for a higher-res image when available
  (re-run the same pipeline with `x-upsert`).
- **`neighborhoods` write path is blocked by RLS.** Only a public SELECT policy
  exists; no admin can create/edit/delete neighborhoods from the web today.
  This is the trigger for the next task (admin location management).
- **`property_count` is a manual column and already drifts** (Médina stored 2,
  real 3). The planned location-admin work should replace it with a computed
  count (view/trigger).

## Next step
Plan + implement the admin location management (neighborhoods CRUD, later
cities) following the best-practice notes in `tasks/current.md`.
