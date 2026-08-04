# 2026-08-05 — CRM pipeline in the admin leads centre

## Objective

Turn `/admin/contacts` into a real CRM: funnel by stage, kanban board with drag
& drop, detail drawer with notes, history, assignment and follow-up — using
`references/crm_prototipo_2026_v2.html` as the visual/functional reference but
the project's own brand system, components, data and permissions.

## Files inspected

- `src/pages/admin/AdminContacts.tsx`, `src/services/admin/contactAdmin.service.ts`
- `src/lib/adminRest.ts`, `src/hooks/useAuth.tsx`, `src/types/supabase.ts`
- `supabase/migrations/000`, `001`, `004`, `008`, `015`, `016`
- `tailwind.config.js` (brand tokens), `src/components/ui/` (shadcn inventory)
- `references/crm_prototipo_2026_v2.html` (read in full, both style layers)

## Files changed

- **New** `supabase/migrations/017_crm_pipeline.sql` — stage enum, pipeline
  columns, `lead_notes`, `lead_activity`, RLS for both.
- **New** `src/services/admin/crm.service.ts` — stage/priority/assignment/
  follow-up/lost mutations, notes, activity, assignable agents.
- **New** `src/components/admin/crm/{stages.ts,LeadCard,PipelineBoard,
  PipelineOverview,LeadDrawer,LeadStageSelector}`.
- **Rewritten** `src/pages/admin/AdminContacts.tsx` (orchestration only).
- `src/types/supabase.ts`, `src/services/admin/contactAdmin.service.ts`,
  `src/locales/{fr,es,en}/admin.json` (77 new keys, key sets asserted equal).
- **New** `docs/decisions/ADR-003-crm-pipeline-on-contact-submissions.md`.

## Commands run

- `npm run migrate -- supabase/migrations/017_crm_pipeline.sql` → applied.
  Two failures first, both real and both fixed in the migration:
  1. the destructive-guard tripped on the words "DROP TABLE" inside a comment;
  2. `is_admin_role()` does not exist — migration 008 unified it to `is_admin()`;
  3. the backfill `UPDATE` hit the pre-016 junk row, which no UPDATE can touch
     (NOT VALID constraint) — every backfill now skips rows with no contact
     channel.
- `bash scripts/verify.sh` → lint pass (6 pre-existing warnings, 0 errors),
  build pass.
- Backend probe inside `BEGIN … ROLLBACK`: moved a real lead to `qualified`,
  set priority/follow-up, inserted a note and an activity row, read the counts
  back (1/1/1), rolled back. Post-check confirmed `notes_after = 0`,
  `activity_after = 0`, `non_new = 0` — the schema accepts the whole flow and
  no production data changed.

## Verification result

Green on build and on the database contract. **Not verified under a logged-in
admin session** — there are no admin UI credentials in this environment. The
drag & drop, the drawer saves and the RLS refusal path have not been exercised
through the real client. That is the first thing to check in the browser.

## Open risks

- Follow-up dates are stored but nothing sends a reminder yet.
- Response-time metric was deliberately left out: nothing records when a lead
  was first contacted, so any number would be invented.
- Custom stages are prepared for (stable ids, single stage list) but there is no
  admin UI to add or reorder them.

## Next step

Owner opens `/admin/contacts` logged in, moves a card, reloads, and confirms the
lead stays in its new stage.
