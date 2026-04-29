-- PASO 1: Crear tabla agents
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

-- PASO 2: Crear indices
CREATE UNIQUE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);

-- PASO 3: Activar RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear policies basicas
CREATE POLICY "agents_select_own" ON agents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "agents_update_own" ON agents FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- PASO 5: Agregar agent_id a properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id);

-- PASO 6: Agregar campos a contact_submissions
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS assigned_to_agent_id UUID REFERENCES agents(id);
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
