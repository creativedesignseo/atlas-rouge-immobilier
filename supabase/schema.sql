-- ============================================
-- Atlas Rouge Immobilier - Database Schema
-- ============================================
-- Estado actual: incluye agents, campos multilingües y RLS actualizadas
-- Fecha última revisión: 2026-04-30

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: neighborhoods
-- ============================================
CREATE TABLE IF NOT EXISTS neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  property_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: agents (reemplaza admins)
-- ============================================
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

-- ============================================
-- Table: properties (con campos multilingües)
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  transaction TEXT NOT NULL CHECK (transaction IN ('sale', 'rent')),
  type TEXT NOT NULL CHECK (type IN ('villa', 'apartment', 'riad', 'prestige', 'land', 'rooftop')),
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
  city TEXT NOT NULL DEFAULT 'Marrakech',
  price_eur INTEGER NOT NULL,
  price_mad INTEGER NOT NULL,
  surface INTEGER NOT NULL DEFAULT 0,
  land_surface INTEGER,
  rooms INTEGER NOT NULL DEFAULT 0,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  price_per_sqm INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  amenities TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
  has_video BOOLEAN NOT NULL DEFAULT FALSE,
  has_3d_tour BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Campos multilingües
  title_en TEXT,
  title_fr TEXT,
  title_es TEXT,
  description_en TEXT,
  description_fr TEXT,
  description_es TEXT,
  highlights_en TEXT[] DEFAULT '{}',
  highlights_fr TEXT[] DEFAULT '{}',
  highlights_es TEXT[] DEFAULT '{}',
  -- Relación con agente
  agent_id UUID REFERENCES agents(id)
);

-- ============================================
-- Table: contact_submissions (con asignación a agente)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  property_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to_agent_id UUID REFERENCES agents(id),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed'))
);

-- ============================================
-- Table: favorites (authenticated or anonymous)
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  property_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT favorites_owner_check CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

-- ============================================
-- Table: site_settings
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
CREATE INDEX IF NOT EXISTS idx_properties_transaction ON properties(transaction);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_eur);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_slug ON neighborhoods(slug);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_anonymous ON favorites(anonymous_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_property
  ON favorites(user_id, property_slug)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_anonymous_property
  ON favorites(anonymous_id, property_slug)
  WHERE anonymous_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE UNIQUE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_role_idx ON agents(role);
CREATE INDEX IF NOT EXISTS agents_is_active_idx ON agents(is_active);
CREATE INDEX IF NOT EXISTS contact_submissions_agent_id_idx ON contact_submissions(assigned_to_agent_id);
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx ON contact_submissions(status);

-- ============================================
-- Helper functions
-- ============================================
CREATE OR REPLACE FUNCTION public.is_agent()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agents
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agents
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Row Level Security (RLS) - Enable
-- ============================================
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: neighborhoods
-- ============================================
CREATE POLICY "Allow public read on neighborhoods"
  ON neighborhoods FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin insert on neighborhoods"
  ON neighborhoods FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());

CREATE POLICY "Allow admin update on neighborhoods"
  ON neighborhoods FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());

CREATE POLICY "Allow admin delete on neighborhoods"
  ON neighborhoods FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

-- ============================================
-- RLS Policies: properties
-- ============================================
CREATE POLICY "Anyone can read properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage all properties"
  ON properties FOR ALL
  TO authenticated
  USING (public.is_admin_role());

CREATE POLICY "Agent can insert own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents
    WHERE user_id = auth.uid()
    AND is_active = true
  ));

CREATE POLICY "Agent can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Agent can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ============================================
-- RLS Policies: contact_submissions
-- ============================================
CREATE POLICY "Anyone can insert contacts"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can read all contacts"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (public.is_admin_role());

CREATE POLICY "Agent can read assigned contacts"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Admin can update all contacts"
  ON contact_submissions FOR UPDATE
  TO authenticated
  USING (public.is_admin_role());

CREATE POLICY "Agent can update assigned contacts"
  ON contact_submissions FOR UPDATE
  TO authenticated
  USING (assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Admin can delete contacts"
  ON contact_submissions FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

-- ============================================
-- RLS Policies: favorites
-- ============================================
CREATE POLICY "Allow authenticated users to manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow anonymous favorites"
  ON favorites FOR ALL
  TO anon
  USING (anonymous_id IS NOT NULL)
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

-- ============================================
-- RLS Policies: site_settings
-- ============================================
CREATE POLICY "Allow public read on site_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin update on site_settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());

CREATE POLICY "Allow admin insert on site_settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());

-- ============================================
-- RLS Policies: agents
-- ============================================
CREATE POLICY "Admin can read all agents"
  ON agents FOR SELECT
  TO authenticated
  USING (public.is_admin_role());

CREATE POLICY "Agent can read own row"
  ON agents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can insert agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());

CREATE POLICY "Admin can update any agent"
  ON agents FOR UPDATE
  TO authenticated
  USING (public.is_admin_role());

CREATE POLICY "Agent can update own row"
  ON agents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
