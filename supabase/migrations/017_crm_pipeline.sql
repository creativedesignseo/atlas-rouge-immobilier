-- ============================================================================
-- 017_crm_pipeline.sql — turn contact_submissions into a real CRM pipeline
-- ============================================================================
-- Context: /admin/contacts listed leads but had nowhere to record what happened
-- to them. Every row sat at status='new' forever because the only states were
-- new/in_progress/closed and no UI wrote them. This migration gives the table
-- the columns a pipeline needs and adds the two satellite tables (notes and
-- activity) the drawer writes to.
--
-- Stage ids are stable strings, never the visible label — the UI translates
-- them (FR/ES/EN), so renaming a stage in the interface must not touch data.
--
-- Idempotent: safe to re-run. Nothing is dropped or erased — only added and
-- widened. The legacy status values are mapped, not discarded
-- (in_progress -> contacted, closed -> won).
-- ============================================================================

-- ── 1. contact_submissions: pipeline columns ────────────────────────────────

ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS stage_changed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority          TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS lost_reason       TEXT;

-- The old CHECK only allowed new/in_progress/closed. Drop it, migrate the
-- values, then install the wider one. Order matters: the UPDATE must run while
-- no constraint is in force, otherwise it fails on the intermediate state.
ALTER TABLE contact_submissions DROP CONSTRAINT IF EXISTS contact_submissions_status_check;

-- A junk row from before migration 016 (empty email AND empty phone) is kept
-- alive by a NOT VALID constraint: any UPDATE that touches it is rejected
-- (23514). Every backfill below therefore skips rows that fail the contact
-- channel rule. Readers must treat stage_changed_at as nullable and fall back
-- to created_at.
UPDATE contact_submissions SET status = 'contacted'
 WHERE status = 'in_progress'
   AND (btrim(coalesce(email, '')) <> '' OR btrim(coalesce(phone, '')) <> '');
UPDATE contact_submissions SET status = 'won'
 WHERE status = 'closed'
   AND (btrim(coalesce(email, '')) <> '' OR btrim(coalesce(phone, '')) <> '');

ALTER TABLE contact_submissions
  ADD CONSTRAINT contact_submissions_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'));

ALTER TABLE contact_submissions DROP CONSTRAINT IF EXISTS contact_submissions_priority_check;
ALTER TABLE contact_submissions
  ADD CONSTRAINT contact_submissions_priority_check
  CHECK (priority IN ('low', 'normal', 'high'));

-- Backfill so "time in stage" is never null for existing rows.
UPDATE contact_submissions SET stage_changed_at = created_at
 WHERE stage_changed_at IS NULL
   AND (btrim(coalesce(email, '')) <> '' OR btrim(coalesce(phone, '')) <> '');

CREATE INDEX IF NOT EXISTS contact_submissions_follow_up_idx
  ON contact_submissions(next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL;

-- ── 2. lead_notes ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  agent_id   UUID REFERENCES agents(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_notes_contact_idx ON lead_notes(contact_id, created_at DESC);

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Visibility mirrors the parent lead: admins see everything, an agent sees the
-- notes of the leads assigned to them. Written as a subquery on
-- contact_submissions so there is a single source of truth for who sees what.
-- is_admin() is the unified helper from migration 008 (is_admin_role() is gone).
DROP POLICY IF EXISTS "Agents read notes of visible leads" ON lead_notes;
CREATE POLICY "Agents read notes of visible leads"
  ON lead_notes FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR contact_id IN (
      SELECT id FROM contact_submissions
      WHERE assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Agents write notes on visible leads" ON lead_notes;
CREATE POLICY "Agents write notes on visible leads"
  ON lead_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR contact_id IN (
      SELECT id FROM contact_submissions
      WHERE assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    )
  );

-- A note is a record of what was said; only its author (or an admin) may remove
-- it. No UPDATE policy at all — notes are append-only on purpose.
DROP POLICY IF EXISTS "Authors and admins delete notes" ON lead_notes;
CREATE POLICY "Authors and admins delete notes"
  ON lead_notes FOR DELETE
  TO authenticated
  USING (
    is_admin()
    OR agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- ── 3. lead_activity ────────────────────────────────────────────────────────
-- Append-only audit trail: who moved whom, when, and from where. No UPDATE and
-- no DELETE policy — history must not be rewritten from the client.

CREATE TABLE IF NOT EXISTS lead_activity (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  agent_id   UUID REFERENCES agents(id) ON DELETE SET NULL,
  agent_name TEXT,                     -- denormalised so history survives agent deletion
  type       TEXT NOT NULL,            -- 'stage_change' | 'assignment' | 'note' | 'follow_up' | 'contact'
  from_stage TEXT,
  to_stage   TEXT,
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_activity_contact_idx ON lead_activity(contact_id, created_at DESC);

ALTER TABLE lead_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents read activity of visible leads" ON lead_activity;
CREATE POLICY "Agents read activity of visible leads"
  ON lead_activity FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR contact_id IN (
      SELECT id FROM contact_submissions
      WHERE assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Agents write activity on visible leads" ON lead_activity;
CREATE POLICY "Agents write activity on visible leads"
  ON lead_activity FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR contact_id IN (
      SELECT id FROM contact_submissions
      WHERE assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    )
  );

-- ── 4. Agents must be listable for the assignment picker ────────────────────
-- 001 only lets an admin read all agents; an agent reads its own row. That is
-- exactly the rule the CRM needs (only admins reassign leads), so nothing
-- changes here. Documented so the next reader does not "fix" it.
