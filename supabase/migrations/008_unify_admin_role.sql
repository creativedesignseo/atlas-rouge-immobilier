-- ============================================================================
-- Migration 008: Unify admin role — is_admin() recognises agents.role='admin'
-- ============================================================================
-- Apply with: npm run migrate -- supabase/migrations/008_unify_admin_role.sql
-- Project: slxlkbrqcjabsfuhlwdf (account adspublioficial@gmail.com)
--
-- CONTEXTO (diagnosticado en vivo 2026-06-01):
--   Crear un inmueble desde el admin no guardaba: la política RLS de INSERT en
--   `properties` exige is_admin(), y is_admin() consultaba SOLO la tabla
--   `public.admins`:
--       RETURN EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
--   Pero el admin del panel (Sofia, creativedesignseo@gmail.com) es admin en el
--   sistema `agents` (role='admin', is_active) y NO está en `admins`
--   (verificado: 2 admins en agents, 1 en admins, Sofia ausente de admins).
--   Por eso is_admin() devolvía false y el INSERT se rechazaba. Mismo bloqueo en
--   contact_submissions (ALL), properties (INSERT/UPDATE/DELETE) y site_settings
--   (UPDATE) — todas usan is_admin(). Eran dos sistemas de roles desincronizados.
--
-- FIX: redefinir is_admin() para reconocer a los admins de `agents` ADEMÁS de la
--   tabla `admins` (OR — nadie pierde acceso). Unifica el rol hacia `agents`, que
--   es el sistema que usa todo el panel admin. La tabla `admins` queda obsoleta
--   (deprecar más adelante; NO se borra aquí).
--
-- SEGURIDAD: SECURITY DEFINER evita recursión RLS al leer agents/admins;
--   search_path fijo mantiene el hardening de la migración 006.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.agents
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$;

-- ============================================================================
-- VERIFICACION (tras aplicar):
--   Como admin del sistema agents (Sofia): crear/editar inmuebles, gestionar
--   contactos y site_settings debe funcionar. A nivel SQL, is_admin() devuelve
--   true para cualquier agente con role='admin' e is_active=true.
-- ============================================================================
