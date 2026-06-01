-- ============================================================================
-- Migration 006: Fix privilege escalation + harden SECURITY DEFINER helpers
-- ============================================================================
-- APPLIED IN PRODUCTION 2026-06-01 (project slxlkbrqcjabsfuhlwdf, account
-- adspublioficial@gmail.com). Ejecutar en el SQL Editor de Supabase (la REST
-- API no ejecuta SQL crudo).
--
-- CONTEXTO (P0-1 / SEC-001 / DB-001 / ADM-001):
-- La politica de UPDATE sobre `agents` solo tenia `USING (user_id = auth.uid())`
-- y NINGUN `WITH CHECK`. En Postgres, sin WITH CHECK un UPDATE no valida las
-- filas resultantes, asi que cualquier agente autenticado podia, desde DevTools:
--     supabase.from('agents').update({ role:'admin', is_active:true })
--                            .eq('user_id', miId)
-- y auto-promocionarse a admin (control total de leads/PII, propiedades, blog).
--
-- ⚠️ NOMBRE REAL DE LA POLITICA EN PRODUCCION: `agents_update_own` (NO
-- "Agent can update own row"). La base productiva NO se construyo desde estos
-- archivos de migracion numerados sino desde un schema consolidado; los nombres
-- difieren. Verificado en vivo con pg_policies antes de aplicar (2026-06-01).
--
-- FIX: recrear la politica con WITH CHECK que congela `role` e `is_active` a su
-- valor actual. Postgres NO expone `OLD` dentro de WITH CHECK, asi que se
-- comparan contra una subconsulta de la propia fila (que por MVCC ve el valor
-- pre-update). Un agente puede seguir editando name/phone/bio/photo_url de su
-- fila, pero no su rol ni su estado.
--
-- NOTA: en esta base NO existe una politica "Admin can update any agent"; la
-- gestion de roles/estado de otros agentes se hace fuera de RLS (service_role /
-- admin API), por lo que este fix no rompe ningun flujo legitimo existente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Cerrar la escalada de privilegios en `agents`
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS agents_update_own ON agents;

CREATE POLICY agents_update_own
  ON agents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND role      = (SELECT a.role      FROM agents a WHERE a.user_id = auth.uid())
    AND is_active = (SELECT a.is_active FROM agents a WHERE a.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 2. Hardening: fijar search_path en los helpers SECURITY DEFINER (DB-005)
-- ----------------------------------------------------------------------------
-- Sin un search_path fijo, una funcion SECURITY DEFINER puede ser victima de
-- search-path hijacking. Este bloque es TOLERANTE: aplica el SET a cualquier
-- helper `is_*` que exista en `public`, sin fallar si alguno no esta presente
-- (los nombres reales pueden diferir de las migraciones numeradas).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS sch, p.proname AS fn,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname LIKE 'is_%'
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
                   r.sch, r.fn, r.args);
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICACION (ejecutada 2026-06-01, OK):
--   SELECT policyname, cmd, with_check FROM pg_policies
--   WHERE schemaname='public' AND tablename='agents' AND cmd='UPDATE';
--   -> check_expr ya NO es NULL: contiene role = (...) AND is_active = (...).
-- ============================================================================
