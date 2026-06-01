-- ============================================================================
-- Migration 000: Base schema (pre-agents)
-- ============================================================================
-- Reconstruye el estado base que existía ANTES de la migracion 001_agents.sql.
-- Hasta ahora estas tablas solo vivian en supabase/schema.sql y NO en una
-- migracion numerada, por lo que 001 (que hace `ALTER TABLE properties ...`)
-- fallaba al reconstruir la BD desde cero. Este archivo cierra ese drift.
--
-- ORDEN de la cadena de migraciones:
--   000 (este)  crea: neighborhoods, properties (base), contact_submissions
--               (base), favorites, site_settings + helpers + RLS base.
--   001         crea `agents`, anade `properties.agent_id` y
--               `contact_submissions.assigned_to_agent_id`/`status`.
--   002         anade los campos multilingues a `properties`.
--   003         crea el blog. 004 los leads. 005 el auto-provisioning.
--   006         endurece RLS de agents + `search_path` de los helpers.
--
-- IMPORTANTE: en produccion estas tablas YA existen. Este archivo es
-- IDEMPOTENTE (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS) para poder
-- reconstruir entornos limpios (staging/DR) sin romper produccion. NO hace
-- falta re-aplicarlo sobre la BD de produccion.
--
-- Las columnas que dependen de `agents` (agent_id, assigned_to_agent_id) y los
-- campos multilingues NO se crean aqui: los anaden 001 y 002 respectivamente.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Tablas base
-- ----------------------------------------------------------------------------

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

-- properties SIN agent_id (001) ni campos multilingues (002).
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- contact_submissions SIN assigned_to_agent_id ni status (los anade 001).
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  property_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  property_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT favorites_owner_check CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Indices base (los de agent_id y multilingues los crean 001 y 002)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
CREATE INDEX IF NOT EXISTS idx_properties_transaction ON properties(transaction);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_eur);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at);
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

-- ----------------------------------------------------------------------------
-- Helper functions (necesarias para las RLS de abajo).
-- 001/003 las recrean con OR REPLACE; 006 les fija el search_path.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS: neighborhoods (las politicas de properties/contact_submissions las
-- (re)define 001 integramente tras anadir las columnas de agents)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on neighborhoods" ON neighborhoods;
CREATE POLICY "Allow public read on neighborhoods"
  ON neighborhoods FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin insert on neighborhoods" ON neighborhoods;
CREATE POLICY "Allow admin insert on neighborhoods"
  ON neighborhoods FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());

DROP POLICY IF EXISTS "Allow admin update on neighborhoods" ON neighborhoods;
CREATE POLICY "Allow admin update on neighborhoods"
  ON neighborhoods FOR UPDATE TO authenticated
  USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());

DROP POLICY IF EXISTS "Allow admin delete on neighborhoods" ON neighborhoods;
CREATE POLICY "Allow admin delete on neighborhoods"
  ON neighborhoods FOR DELETE TO authenticated USING (public.is_admin_role());

-- ----------------------------------------------------------------------------
-- RLS: favorites
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated users to manage own favorites" ON favorites;
CREATE POLICY "Allow authenticated users to manage own favorites"
  ON favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow anonymous favorites" ON favorites;
CREATE POLICY "Allow anonymous favorites"
  ON favorites FOR ALL TO anon
  USING (anonymous_id IS NOT NULL)
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

-- ----------------------------------------------------------------------------
-- RLS: site_settings
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on site_settings" ON site_settings;
CREATE POLICY "Allow public read on site_settings"
  ON site_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin update on site_settings" ON site_settings;
CREATE POLICY "Allow admin update on site_settings"
  ON site_settings FOR UPDATE TO authenticated
  USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());

DROP POLICY IF EXISTS "Allow admin insert on site_settings" ON site_settings;
CREATE POLICY "Allow admin insert on site_settings"
  ON site_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());

-- Base read policy so `properties` is queryable before 001 re-defines its
-- full policy set (001 drops and recreates the properties/contact policies).
DROP POLICY IF EXISTS "Anyone can read properties" ON properties;
CREATE POLICY "Anyone can read properties"
  ON properties FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can insert contacts" ON contact_submissions;
CREATE POLICY "Anyone can insert contacts"
  ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
