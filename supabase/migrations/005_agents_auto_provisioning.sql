-- ============================================================================
-- Migration 005: Auto-provisioning de filas en `agents`
-- ============================================================================
-- Problema que resuelve:
--   Al crear un usuario desde el Dashboard de Supabase (Authentication →
--   Add user / Invite), se inserta en `auth.users` pero NO en `agents`.
--   El usuario queda en limbo: puede autenticarse pero la app lo rechaza
--   porque getAgent() devuelve 0 filas, y el síntoma visible es
--   "credenciales incorrectas" — confuso y sin salida sin Admin API.
--
-- Solución:
--   Trigger en auth.users INSERT que crea automáticamente una fila en
--   `agents` con role='viewer' e is_active=false. Un admin existente
--   tiene que activar al nuevo usuario (cambiar is_active=true y/o role).
--
-- Beneficios:
--   - Cero usuarios huérfanos sin importar la vía de creación (Dashboard,
--     signUp, admin.inviteUserByEmail, admin.createUser, recovery, etc.)
--   - Default seguro: nadie es admin por defecto.
--   - Idempotente: si la fila ya existe (ej. creada manualmente), no falla.
--
-- Ejecutar en Supabase Studio → SQL Editor → New query → pegar todo → Run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Función que materializa el perfil de agente
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER es necesario porque el trigger corre en el contexto del
-- usuario que hizo el INSERT en auth.users (normalmente el rol supabase_auth_admin),
-- pero la RLS de public.agents puede bloquearlo. SECURITY DEFINER hace que
-- la función corra con los privilegios del propietario (postgres), que sí
-- puede insertar.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar perfil de agente por defecto. ON CONFLICT evita romper si
  -- ya existe (caso recovery flows, restoración de backup, etc.).
  INSERT INTO public.agents (user_id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    -- Nombre legible inicial: parte local del email capitalizada.
    -- El usuario lo edita después desde /admin/profile.
    initcap(split_part(NEW.email, '@', 1)),
    'viewer',  -- Default seguro: NO admin
    false      -- Default seguro: inactivo hasta que otro admin lo active
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user IS
  'Crea automáticamente una fila en public.agents cuando se inserta un usuario en auth.users. role=viewer e is_active=false por defecto. Un admin existente debe activar manualmente. Ver migración 005.';

-- ----------------------------------------------------------------------------
-- 2. Trigger en auth.users
-- ----------------------------------------------------------------------------

-- Drop si existe (idempotencia)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Auto-provisiona public.agents al crear un usuario en auth.users. Ver migración 005.';

-- ----------------------------------------------------------------------------
-- 3. Constraint UNIQUE en user_id (necesario para ON CONFLICT)
-- ----------------------------------------------------------------------------
-- Si ya existe (creado por migración previa) el comando no falla.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agents_user_id_unique'
      AND conrelid = 'public.agents'::regclass
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_user_id_unique UNIQUE (user_id);
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 4. Backfill: usuarios existentes en auth.users sin fila en agents
-- ----------------------------------------------------------------------------
-- Si hubiera más usuarios huérfanos aparte del que ya creamos a mano,
-- este INSERT los rescata. No toca a los que ya tienen perfil.

INSERT INTO public.agents (user_id, email, name, role, is_active)
SELECT
  u.id,
  u.email,
  initcap(split_part(u.email, '@', 1)),
  'viewer',
  false
FROM auth.users u
LEFT JOIN public.agents a ON a.user_id = u.id
WHERE a.user_id IS NULL
  AND u.email IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Verificación post-migración (solo lectura)
-- ----------------------------------------------------------------------------
-- Estos SELECTs no modifican nada. Útiles para confirmar el estado tras
-- ejecutar la migración. Copia-pégalos manualmente si quieres comprobar.
--
-- a) ¿Quedan usuarios huérfanos? (debería devolver 0 filas)
--    SELECT u.id, u.email FROM auth.users u
--    LEFT JOIN public.agents a ON a.user_id = u.id
--    WHERE a.user_id IS NULL;
--
-- b) ¿El trigger está activo? (debería devolver 1 fila)
--    SELECT tgname, tgenabled FROM pg_trigger
--    WHERE tgname = 'on_auth_user_created';
--
-- c) Estado actual de agents:
--    SELECT email, name, role, is_active, created_at FROM agents
--    ORDER BY created_at;
