-- ============================================================================
-- 016_contact_submissions_email_optional.sql
-- ============================================================================
-- WHY: silent lead loss in production, reproduced 2026-08-02.
--
-- Both campaign landing pages (public/proprietaires/index.html and
-- public/vendre/index.html) ask for name + phone as the REQUIRED fields and
-- offer email as OPTIONAL — the phone field even carries the explanation
-- "pour vous rappeler". When the visitor leaves the email blank the client
-- sends `email: null`, which the NOT NULL constraint on this column rejects:
--
--   POST /rest/v1/contact_submissions  ->  HTTP 400
--   {"code":"23502","message":"null value in column \"email\" of relation
--    \"contact_submissions\" violates not-null constraint"}
--
-- The landing's .catch() then shows a generic "Une erreur est survenue" alert.
-- The lead is NOT stored, notify-lead never fires, and the `generate_lead`
-- dataLayer push never happens — so the lead is invisible everywhere and
-- unrecoverable. With paid traffic about to be pointed at these pages, the
-- phone-only visitor is the MAJORITY case, not an edge case.
--
-- Sibling tables are already correct and are intentionally left untouched:
--   estimation_requests  -> phone NOT NULL, email nullable (matches its form)
--   newsletter_subscribers -> email NOT NULL (email IS the subscription)
--
-- This relaxes a constraint only; it does not drop or modify any data.
-- ============================================================================

ALTER TABLE public.contact_submissions
  ALTER COLUMN email DROP NOT NULL;

-- Keep the row meaningful: a lead is useless without at least one way to reach
-- back. Phone or email must be present (both may be, neither may not).
--
-- NOT VALID is deliberate. One legacy row (2026-07-31, subject 'buy') has an
-- empty-string email, no phone, no name and no message — a bot or test probe,
-- not a real lead. A plain CHECK aborts the whole migration on it (23514).
-- NOT VALID still enforces the rule on every future INSERT and UPDATE; it only
-- skips re-validating rows that already exist. No data is read, changed or
-- deleted. If that junk row is ever cleaned up, the constraint can be promoted
-- with: ALTER TABLE public.contact_submissions
--         VALIDATE CONSTRAINT contact_submissions_has_contact_channel;
ALTER TABLE public.contact_submissions
  DROP CONSTRAINT IF EXISTS contact_submissions_has_contact_channel;

ALTER TABLE public.contact_submissions
  ADD CONSTRAINT contact_submissions_has_contact_channel
  CHECK (
    (email IS NOT NULL AND btrim(email) <> '')
    OR (phone IS NOT NULL AND btrim(phone) <> '')
  ) NOT VALID;
