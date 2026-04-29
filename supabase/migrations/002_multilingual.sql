-- ============================================================================
-- Migration: Multilingual property fields (EN / FR / ES)
-- ============================================================================

-- Add translatable fields to properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS title_fr TEXT,
  ADD COLUMN IF NOT EXISTS title_es TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_fr TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT,
  ADD COLUMN IF NOT EXISTS highlights_en TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS highlights_fr TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS highlights_es TEXT[] DEFAULT '{}';

-- Seed existing French content into the _fr columns as default
UPDATE properties SET
  title_fr = title,
  description_fr = description,
  highlights_fr = highlights
WHERE title_fr IS NULL;

-- Index for language-specific searches (optional, useful for filtering)
CREATE INDEX IF NOT EXISTS properties_title_en_idx ON properties USING gin(to_tsvector('english', COALESCE(title_en, '')));
CREATE INDEX IF NOT EXISTS properties_title_fr_idx ON properties USING gin(to_tsvector('french', COALESCE(title_fr, '')));
CREATE INDEX IF NOT EXISTS properties_title_es_idx ON properties USING gin(to_tsvector('spanish', COALESCE(title_es, '')));
