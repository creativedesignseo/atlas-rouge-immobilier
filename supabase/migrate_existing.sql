-- ============================================================================
-- Migración segura para base de datos EXISTENTE (idempotente)
-- ============================================================================
-- Ejecutar esto en el SQL Editor de Supabase (pestaña "New query")
-- Puede ejecutarse múltiples veces sin errores.

-- ============================================================================
-- 1. Crear tabla agents (si no existe)
-- ============================================================================
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

CREATE UNIQUE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_role_idx ON agents(role);
CREATE INDEX IF NOT EXISTS agents_is_active_idx ON agents(is_active);

-- ============================================================================
-- 2. Migrar datos de admins a agents (si existe tabla admins antigua)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admins') THEN
    INSERT INTO agents (id, user_id, email, name, created_at, role, is_active)
    SELECT 
      id,
      user_id,
      email,
      name,
      created_at,
      'admin',
      true
    FROM admins
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 3. Activar RLS en agents y crear policies básicas
-- ============================================================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read all agents" ON agents;
DROP POLICY IF EXISTS "Agent can read own row" ON agents;
DROP POLICY IF EXISTS "Admin can insert agents" ON agents;
DROP POLICY IF EXISTS "Admin can update any agent" ON agents;
DROP POLICY IF EXISTS "Agent can update own row" ON agents;

CREATE POLICY "Admin can read all agents"
  ON agents FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM agents WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Agent can read own row"
  ON agents FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admin can insert agents"
  ON agents FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM agents WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Admin can update any agent"
  ON agents FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM agents WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true)
  );

CREATE POLICY "Agent can update own row"
  ON agents FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- 4. Añadir campos multilingües a properties (si no existen)
-- ============================================================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_fr TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_es TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_fr TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_es TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS highlights_en TEXT[] DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS highlights_fr TEXT[] DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS highlights_es TEXT[] DEFAULT '{}';

-- Seed: copiar contenido francés existente a las columnas _fr
UPDATE properties SET
  title_fr = title,
  description_fr = description,
  highlights_fr = highlights
WHERE title_fr IS NULL;

-- ============================================================================
-- 5. Añadir agent_id a properties (si no existe)
-- ============================================================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id);

-- Asignar propiedades sin agente al primer admin disponible
UPDATE properties 
SET agent_id = (SELECT id FROM agents WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1)
WHERE agent_id IS NULL AND EXISTS (SELECT 1 FROM agents WHERE role = 'admin');

CREATE INDEX IF NOT EXISTS properties_agent_id_idx ON properties(agent_id);

-- ============================================================================
-- 6. Añadir campos a contact_submissions (si no existen)
-- ============================================================================
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS assigned_to_agent_id UUID REFERENCES agents(id);
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed'));

CREATE INDEX IF NOT EXISTS contact_submissions_agent_id_idx ON contact_submissions(assigned_to_agent_id);
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx ON contact_submissions(status);

-- Asignar contactos sin agente al primer admin disponible
UPDATE contact_submissions 
SET assigned_to_agent_id = (SELECT id FROM agents WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1)
WHERE assigned_to_agent_id IS NULL AND EXISTS (SELECT 1 FROM agents WHERE role = 'admin');

-- ============================================================================
-- 7. Funciones helper
-- ============================================================================
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

-- ============================================================================
-- 8. Actualizar políticas RLS de properties
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read on properties" ON properties;
DROP POLICY IF EXISTS "Allow admin insert on properties" ON properties;
DROP POLICY IF EXISTS "Allow admin update on properties" ON properties;
DROP POLICY IF EXISTS "Allow admin delete on properties" ON properties;
DROP POLICY IF EXISTS "Anyone can read properties" ON properties;
DROP POLICY IF EXISTS "Admin can manage all properties" ON properties;
DROP POLICY IF EXISTS "Agent can insert own properties" ON properties;
DROP POLICY IF EXISTS "Agent can update own properties" ON properties;
DROP POLICY IF EXISTS "Agent can delete own properties" ON properties;

CREATE POLICY "Anyone can read properties"
  ON properties FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin can manage all properties"
  ON properties FOR ALL TO authenticated USING (is_admin_role());

CREATE POLICY "Agent can insert own properties"
  ON properties FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM agents WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Agent can update own properties"
  ON properties FOR UPDATE TO authenticated USING (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));

CREATE POLICY "Agent can delete own properties"
  ON properties FOR DELETE TO authenticated USING (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- 9. Actualizar políticas RLS de contact_submissions
-- ============================================================================
DROP POLICY IF EXISTS "Allow public insert on contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow admin all on contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Anyone can insert contacts" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can read all contacts" ON contact_submissions;
DROP POLICY IF EXISTS "Agent can read assigned contacts" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can update all contacts" ON contact_submissions;
DROP POLICY IF EXISTS "Agent can update assigned contacts" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can delete contacts" ON contact_submissions;

CREATE POLICY "Anyone can insert contacts"
  ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin can read all contacts"
  ON contact_submissions FOR SELECT TO authenticated USING (is_admin_role());

CREATE POLICY "Agent can read assigned contacts"
  ON contact_submissions FOR SELECT TO authenticated USING (assigned_to_agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admin can update all contacts"
  ON contact_submissions FOR UPDATE TO authenticated USING (is_admin_role());

CREATE POLICY "Agent can update assigned contacts"
  ON contact_submissions FOR UPDATE TO authenticated USING (assigned_to_agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admin can delete contacts"
  ON contact_submissions FOR DELETE TO authenticated USING (is_admin_role());

-- ============================================================================
-- 10. Índices de búsqueda por idioma (opcional, para filtros futuros)
-- ============================================================================
CREATE INDEX IF NOT EXISTS properties_title_en_idx ON properties USING gin(to_tsvector('english', COALESCE(title_en, '')));
CREATE INDEX IF NOT EXISTS properties_title_fr_idx ON properties USING gin(to_tsvector('french', COALESCE(title_fr, '')));
CREATE INDEX IF NOT EXISTS properties_title_es_idx ON properties USING gin(to_tsvector('spanish', COALESCE(title_es, '')));

-- ============================================================================
-- FIN
-- ============================================================================
