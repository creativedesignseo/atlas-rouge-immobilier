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
--   Root cause: the policy's role references went stale, so the INSERT policy
--   effectively applied to no live role -> default-deny -> 42501. DROP + CREATE
--   re-resolves the role names against the CURRENT anon/authenticated roles.
--
-- RESOLUTION (confirmed 2026-07-24, after deeper investigation):
--   This DDL WAS the correct DB-level fix. Post-migration, `SET LOCAL ROLE anon;
--   INSERT` succeeds at the Postgres level via ANY role chain (postgres->anon,
--   authenticator->anon, with/without the request.jwt.claims GUC) — all verified.
--   The reason the fix looked like it "didn't work" at first was a SECOND, separate
--   layer: PostgREST holds long-lived pooled DB connections (one had been open
--   since 2026-04-23, ~91 days). Those connections had cached a query plan for the
--   anon INSERT from when the policy was broken, and did NOT re-plan against the
--   recreated policy. So fresh connections returned 201 while the old pooled ones
--   still returned 42501. Forcing PostgREST to open fresh connections (a burst of
--   concurrent requests) made the real /rest/v1/contact_submissions path return 201
--   consistently (verified 27/27 real anon inserts). The remaining stale pooled
--   connection is idle and gets reaped by PostgREST's idle timeout (~30 min); a
--   PostgREST restart from the Supabase dashboard eliminates it immediately.
--
--   Takeaway for future RLS fixes on Supabase: after recreating a policy, if the
--   real PostgREST path still fails while `SET ROLE` at the DB level succeeds,
--   suspect stale pooled PostgREST connections — restart PostgREST (or terminate
--   the `authenticator` backends) rather than assuming the policy fix failed.
--
-- IMPACT: this table backs every public lead form on the site (Contact,
-- Estimation, GestionLocative CTA, /epure, and /proprietaires). While broken,
-- anonymous lead submissions were silently rejected before reaching Supabase.
-- ============================================================================

DROP POLICY IF EXISTS "Allow public insert on contact_submissions" ON contact_submissions;

CREATE POLICY "Allow public insert on contact_submissions"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION (done 2026-07-24):
--   DB level: SET LOCAL ROLE anon; INSERT -> OK (all role chains).
--   Real path: 27/27 anon POSTs to /rest/v1/contact_submissions -> 201 after
--   PostgREST reconnected with fresh pooled connections. All test rows created
--   during QA were deleted afterwards (no TEST/probe rows left in production).
-- ============================================================================
