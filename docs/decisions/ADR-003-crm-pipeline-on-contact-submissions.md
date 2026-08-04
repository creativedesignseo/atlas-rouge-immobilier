# ADR-003 — The CRM pipeline lives on `contact_submissions`, not a new table

**Status:** Accepted — 2026-08-05

## Context

`/admin/contacts` listed leads but could not record what happened to them. The
owner asked for a real CRM (funnel, kanban, detail panel, notes, history)
modelled on `references/crm_prototipo_2026_v2.html` and on Meta's leads centre.

Leads already arrive in `contact_submissions` from three independent writers:
the site contact form, the two landing pages, and the `notify-lead` Netlify
function. The table had `status` (`new | in_progress | closed`) and
`assigned_to_agent_id`, both unused by any UI.

Two options:

1. **Extend `contact_submissions`** — widen `status` into a stage enum, add the
   pipeline columns, put notes and history in satellite tables.
2. **A separate `leads` table** fed from `contact_submissions` — a clean CRM
   model, decoupled from the capture schema.

## Decision

Option 1. `contact_submissions.status` becomes the pipeline stage, with stable
string ids (`new`, `contacted`, `qualified`, `proposal`, `won`, `lost`) that the
UI never displays raw — labels come from the locales, so renaming a stage is a
translation edit, not a migration. Migration 017 adds `stage_changed_at`,
`next_follow_up_at`, `priority`, `lost_reason` and the `lead_notes` /
`lead_activity` tables.

The column keeps the name `status`; the application layer renames it to `stage`
once, in `contactAdmin.service.mapRow`.

## Alternatives considered

A separate `leads` table would have meant a sync path (trigger or job) between
capture and CRM, two sources of truth for "who is assigned to whom", and a
rewrite of the three insert paths plus the RLS that guards them. The cost is
real and the benefit — a tidier model — is not one the owner can see. Rejected.

Storing the visible label as the stage value was rejected outright: the site is
trilingual, so the same stage would be three different strings.

## Consequences

- `status` now carries CRM meaning. Any new writer to `contact_submissions`
  must leave it at the default `new`.
- Legacy values were mapped, not deleted: `in_progress -> contacted`,
  `closed -> won`.
- Notes and activity inherit lead visibility through a subquery on
  `contact_submissions`, so there is one rule for who sees what. `lead_activity`
  has no UPDATE or DELETE policy — history cannot be rewritten from the client.
- Adding a stage means: extend `LEAD_STAGES`, widen the CHECK in a new
  migration, add the entry in `components/admin/crm/stages.ts`, add labels to
  the three locales. Nothing else reads a hardcoded stage list.
- The pre-016 junk row (empty email AND phone) still cannot be updated; every
  backfill in 017 skips it, so `stage_changed_at` is nullable by design.
