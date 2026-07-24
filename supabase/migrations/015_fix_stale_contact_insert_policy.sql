-- ============================================================================
-- Migration 015: Fix stale "Allow public insert" RLS policy on contact_submissions
-- ============================================================================
-- Apply with: npm run migrate -- supabase/migrations/015_fix_stale_contact_insert_policy.sql
-- Project: slxlkbrqcjabsfuhlwdf
--
-- CONTEXT (found 2026-07-24 while building a new "proprietaires" landing page):
--   pg_policies showed a correct-looking policy "Allow public insert on
--   contact_submissions" (PERMISSIVE, roles {anon,authenticated}, cmd INSERT,
--   with_check = true). Yet a real anon POST to /rest/v1/contact_submissions
--   was rejected with 42501 "new row violates row-level security policy",
--   reproduced 3x via direct HTTP and via SET ROLE anon in SQL — not a
--   transient issue. Verified as table owner (bypasses RLS): insert succeeds,
--   so the table/columns/constraints are fine; the policy itself is not being
--   honored for the anon/authenticated roles despite looking correct on paper.
--
--   Likely cause: the policy's role references went stale (e.g. after a
--   project pause/resume recreated the `anon`/`authenticated` roles) leaving
--   `polroles` pointing at OIDs that no longer match the live roles, even
--   though the ::regrole cast still displays the right names. DROP + CREATE
--   forces Postgres to re-resolve role names against the CURRENT roles.
--
-- IMPACT: this table backs every public lead form on the site (Contact,
-- Estimation, GestionLocative CTA, and the /epure static landing) — if this
-- was really broken, leads have been silently failing to reach Supabase.
-- ============================================================================

DROP POLICY IF EXISTS "Allow public insert on contact_submissions" ON contact_submissions;

CREATE POLICY "Allow public insert on contact_submissions"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION (run after applying):
--   A direct anon POST to /rest/v1/contact_submissions with a valid row
--   should now return 201, not 401/42501. Test row must be deleted after
--   (see the session's manual QA — do not leave TEST rows in production).
-- ============================================================================
