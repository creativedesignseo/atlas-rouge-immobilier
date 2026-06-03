-- ============================================================================
-- Migration 011: Neighborhood admin management (CRUD from the admin panel)
-- ============================================================================
-- Goal: let admins create / edit / soft-delete neighborhoods from the web,
-- following best practice:
--
--   1. WRITE RLS for admins only (is_admin(), unified in migration 008).
--      Until now `neighborhoods` had a single public SELECT policy and no
--      write policy at all, so nobody could create/edit/delete a neighborhood
--      from the app (rows had to be inserted via the Management API / PAT).
--   2. Soft delete via `is_active` — deactivating hides a neighborhood from the
--      public site without destroying it or orphaning its properties.
--   3. `property_count` becomes a DERIVED value maintained by a trigger on
--      `properties`, replacing the hand-maintained integer that already drifted
--      (e.g. Médina stored 2 while it had 3 properties). One-time backfill at
--      the end resyncs every row.
--
-- This migration is ADDITIVE and idempotent. It does not drop data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Soft-delete flag
-- ----------------------------------------------------------------------------
ALTER TABLE neighborhoods
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ----------------------------------------------------------------------------
-- 2. Public read: only active rows for everyone; admins see all (incl. inactive)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on neighborhoods" ON neighborhoods;
DROP POLICY IF EXISTS "Read active neighborhoods or admin" ON neighborhoods;
CREATE POLICY "Read active neighborhoods or admin" ON neighborhoods
  FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. Write policies — admins only
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins insert neighborhoods" ON neighborhoods;
CREATE POLICY "Admins insert neighborhoods" ON neighborhoods
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update neighborhoods" ON neighborhoods;
CREATE POLICY "Admins update neighborhoods" ON neighborhoods
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete neighborhoods" ON neighborhoods;
CREATE POLICY "Admins delete neighborhoods" ON neighborhoods
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Derived property_count — trigger on properties keeps it in sync
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so an agent inserting a property (who cannot UPDATE
-- neighborhoods under RLS) still gets the count updated. search_path pinned.
CREATE OR REPLACE FUNCTION public.recompute_neighborhood_count(nid UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE neighborhoods n
  SET property_count = (
    SELECT COUNT(*) FROM properties p WHERE p.neighborhood_id = n.id
  )
  WHERE n.id = nid;
$$;

CREATE OR REPLACE FUNCTION public.trg_properties_neighborhood_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.recompute_neighborhood_count(NEW.neighborhood_id);
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.recompute_neighborhood_count(OLD.neighborhood_id);
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.neighborhood_id IS DISTINCT FROM OLD.neighborhood_id) THEN
      PERFORM public.recompute_neighborhood_count(OLD.neighborhood_id);
      PERFORM public.recompute_neighborhood_count(NEW.neighborhood_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS properties_neighborhood_count ON properties;
CREATE TRIGGER properties_neighborhood_count
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW EXECUTE FUNCTION public.trg_properties_neighborhood_count();

-- ----------------------------------------------------------------------------
-- 5. One-time backfill: resync every counter (fixes existing drift)
-- ----------------------------------------------------------------------------
UPDATE neighborhoods n
SET property_count = (
  SELECT COUNT(*) FROM properties p WHERE p.neighborhood_id = n.id
);
