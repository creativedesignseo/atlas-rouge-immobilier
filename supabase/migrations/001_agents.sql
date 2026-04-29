-- ============================================================================
-- Migration: Sistema de Agentes Inmobiliarios
-- ============================================================================
-- Ejecutar esto en el SQL Editor de Supabase (pestaña "New query")

-- ----------------------------------------------------------------------------
-- 1. Eliminar la tabla antigua `admins` y recrear como `agents`
-- ----------------------------------------------------------------------------

-- Primero, guardar los datos existentes (si hay)
-- Si ya tienes admins creados, sus datos se migrarán automáticamente

-- Eliminar políticas antiguas de `admins` (si existen)
DROP POLICY IF EXISTS "Admins can read their own row" ON admins;
DROP POLICY IF EXISTS "Admins can insert their own row" ON admins;
DROP POLICY IF EXISTS "Admins can update their own row" ON admins;

-- Eliminar función antigua (si existe)
DROP FUNCTION IF EXISTS is_admin();

-- ----------------------------------------------------------------------------
-- 2. Crear tabla `agents` con nuevos campos
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  photo_url TEXT,
  bio TEXT,
  role TEXT CHECK (role IN ('admin', 'agent')) DEFAULT 'agent',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices útiles
CREATE UNIQUE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_role_idx ON agents(role);
CREATE INDEX IF NOT EXISTS agents_is_active_idx ON agents(is_active);

-- ----------------------------------------------------------------------------
-- 3. Migrar datos de `admins` a `agents` (si existe la tabla antigua)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admins') THEN
    INSERT INTO agents (id, user_id, email, name, created_at, role)
    SELECT 
      id,
      user_id,
      email,
      name,
      created_at,
      'admin' -- Los admins existentes se convierten en admin
    FROM admins
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Eliminar tabla antigua (opcional: comenta esta línea si quieres conservarla)
    DROP TABLE admins;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Agregar `agent_id` a `properties`
-- ----------------------------------------------------------------------------

ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id);

-- Crear índice para búsquedas rápidas por agente
CREATE INDEX IF NOT EXISTS properties_agent_id_idx ON properties(agent_id);

-- Asignar todas las propiedades existentes al primer admin (para no dejar nulos)
UPDATE properties 
SET agent_id = (SELECT id FROM agents WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1)
WHERE agent_id IS NULL AND EXISTS (SELECT 1 FROM agents WHERE role = 'admin');

-- ----------------------------------------------------------------------------
-- 5. Agregar campos a `contact_submissions`
-- ----------------------------------------------------------------------------

ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS assigned_to_agent_id UUID REFERENCES agents(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed'));

CREATE INDEX IF NOT EXISTS contact_submissions_agent_id_idx ON contact_submissions(assigned_to_agent_id);
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx ON contact_submissions(status);

-- Asignar contactos existentes al primer admin
UPDATE contact_submissions 
SET assigned_to_agent_id = (SELECT id FROM agents WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1)
WHERE assigned_to_agent_id IS NULL AND EXISTS (SELECT 1 FROM agents WHERE role = 'admin');

-- ----------------------------------------------------------------------------
-- 6. Función auxiliar: is_agent()
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_agent()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agents 
    WHERE user_id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 7. Función auxiliar: is_admin_role()
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agents 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 8. RLS Policies para tabla `agents`
-- ----------------------------------------------------------------------------

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policy: Admin puede ver todos los agentes
CREATE POLICY "Admin can read all agents"
ON agents FOR SELECT
TO authenticated
USING (is_admin_role());

-- Policy: Agente puede ver solo su propia fila
CREATE POLICY "Agent can read own row"
ON agents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admin puede insertar agentes
CREATE POLICY "Admin can insert agents"
ON agents FOR INSERT
TO authenticated
WITH CHECK (is_admin_role());

-- Policy: Admin puede actualizar cualquier agente
CREATE POLICY "Admin can update any agent"
ON agents FOR UPDATE
TO authenticated
USING (is_admin_role());

-- Policy: Agente puede actualizar solo su propia fila
CREATE POLICY "Agent can update own row"
ON agents FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 9. RLS Policies actualizadas para `properties`
-- ----------------------------------------------------------------------------

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Anyone can read properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON properties;

-- Policy: Cualquiera puede leer propiedades (público)
CREATE POLICY "Anyone can read properties"
ON properties FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Admin puede hacer todo
CREATE POLICY "Admin can manage all properties"
ON properties FOR ALL
TO authenticated
USING (is_admin_role());

-- Policy: Agente puede insertar (se asigna a sí mismo)
CREATE POLICY "Agent can insert own properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM agents 
  WHERE user_id = auth.uid() 
  AND is_active = true
));

-- Policy: Agente puede actualizar solo sus propiedades
CREATE POLICY "Agent can update own properties"
ON properties FOR UPDATE
TO authenticated
USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- Policy: Agente puede eliminar solo sus propiedades
CREATE POLICY "Agent can delete own properties"
ON properties FOR DELETE
TO authenticated
USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 10. RLS Policies actualizadas para `contact_submissions`
-- ----------------------------------------------------------------------------

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Anyone can insert contacts" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can read contacts" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can delete contacts" ON contact_submissions;

-- Policy: Cualquiera puede enviar contacto (público)
CREATE POLICY "Anyone can insert contacts"
ON contact_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Admin puede leer todos los contactos
CREATE POLICY "Admin can read all contacts"
ON contact_submissions FOR SELECT
TO authenticated
USING (is_admin_role());

-- Policy: Agente puede leer solo sus contactos asignados
CREATE POLICY "Agent can read assigned contacts"
ON contact_submissions FOR SELECT
TO authenticated
USING (assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- Policy: Admin puede actualizar todos los contactos
CREATE POLICY "Admin can update all contacts"
ON contact_submissions FOR UPDATE
TO authenticated
USING (is_admin_role());

-- Policy: Agente puede actualizar solo sus contactos
CREATE POLICY "Agent can update assigned contacts"
ON contact_submissions FOR UPDATE
TO authenticated
USING (assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- Policy: Admin puede eliminar contactos
CREATE POLICY "Admin can delete contacts"
ON contact_submissions FOR DELETE
TO authenticated
USING (is_admin_role());

-- ----------------------------------------------------------------------------
-- 11. Bucket de Storage para avatares de agentes
-- ----------------------------------------------------------------------------

-- Crear bucket 'agent-avatars' (esto se hace desde la UI de Supabase)
-- Ve a Storage → New bucket → Name: agent-avatars → Public: true

-- Después de crear el bucket, ejecuta esto para las policies del storage:
-- (Nota: Esto requiere que el bucket ya exista en la UI)

-- Policy: Usuarios autenticados pueden subir sus propios avatares
-- Se configura manualmente en la UI de Supabase Storage

-- ----------------------------------------------------------------------------
-- 12. Instrucciones para crear el primer admin
-- ----------------------------------------------------------------------------
-- 
-- Si no tienes ningún agente aún, sigue estos pasos:
-- 
-- 1. Ve a Authentication → Users → Invite user
-- 2. Introduce el email del admin (ej: admin@atlasrouge.ma)
-- 3. El usuario recibe email y crea contraseña
-- 4. Ve al SQL Editor y ejecuta:
-- 
-- INSERT INTO agents (user_id, email, name, role, is_active)
-- SELECT id, email, raw_user_meta_data->>'name', 'admin', true
-- FROM auth.users 
-- WHERE email = 'admin@atlasrouge.ma';
-- 
-- 5. Para crear agentes adicionales, repite los pasos 1-4 cambiando role='agent'
-- 
-- ============================================================================
