-- ============================================
-- Atlas Rouge Immobilier - Database Schema
-- ============================================

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
-- Table: properties
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: contact_submissions
-- ============================================
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

-- ============================================
-- Table: favorites (authenticated or anonymous browser scope)
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

-- ============================================
-- Table: admins (for admin panel access control)
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: is_admin()
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access on neighborhoods
CREATE POLICY "Allow public read on neighborhoods"
  ON neighborhoods FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public read access on properties
CREATE POLICY "Allow public read on properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public insert on contact_submissions
CREATE POLICY "Allow public insert on contact_submissions"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Favorites: authenticated users can only manage their own
CREATE POLICY "Allow authenticated users to manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Favorites: anonymous browser favorites. These are scoped by anonymous_id in the client.
CREATE POLICY "Allow anonymous favorites"
  ON favorites FOR ALL
  TO anon
  USING (anonymous_id IS NOT NULL)
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

-- Site settings: public read
CREATE POLICY "Allow public read on site_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- Admin RLS Policies
-- ============================================

-- Admins: self-read
CREATE POLICY "Allow admins to read admins"
  ON admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Properties: admin write
CREATE POLICY "Allow admin insert on properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin update on properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin delete on properties"
  ON properties FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Neighborhoods: admin write
CREATE POLICY "Allow admin insert on neighborhoods"
  ON neighborhoods FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin update on neighborhoods"
  ON neighborhoods FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin delete on neighborhoods"
  ON neighborhoods FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Contact submissions: admin read/update/delete
CREATE POLICY "Allow admin all on contact_submissions"
  ON contact_submissions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Site settings: admin update
CREATE POLICY "Allow admin update on site_settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin insert on site_settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
