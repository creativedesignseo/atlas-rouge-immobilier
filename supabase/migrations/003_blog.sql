-- ============================================================================
-- Migration: Blog editorial (CMS)
-- ============================================================================
-- Crea dos tablas:
--   1. blog_posts: campos no traducibles (slug, fechas, autor, categoría, imagen)
--   2. blog_post_translations: una fila por (post, idioma) con título/excerpt/cuerpo
--
-- Estructura editorial profesional:
--   - status (draft|published) para flujo de redacción → publicación
--   - author_id (FK a agents) O guest_author (texto libre) para invitados
--   - content como JSONB (output del editor TipTap)
--   - RLS: público solo lee published; agents leen/escriben todo
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla principal: blog_posts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- URL & estado
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),

  -- Presentación
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'market' CHECK (
    category IN ('buying', 'investment', 'neighborhoods', 'taxation', 'decoration', 'market')
  ),
  read_time_min INT DEFAULT 5 CHECK (read_time_min > 0),

  -- Autoría: FK al agent O texto libre para invitados (uno de los dos)
  author_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  guest_author TEXT,

  -- Cronología
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON blog_posts(category);
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_author_idx ON blog_posts(author_id);

-- Trigger para mantener updated_at al día
CREATE OR REPLACE FUNCTION blog_posts_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION blog_posts_set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Tabla de traducciones: una fila por idioma
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_post_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('fr', 'es', 'en')),

  -- Contenido editorial
  title TEXT NOT NULL,
  excerpt TEXT,
  content JSONB,  -- output del editor TipTap (estructura ProseMirror)

  -- SEO (opcionales; si vacíos se usa title/excerpt como fallback)
  seo_title TEXT,
  seo_description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (post_id, locale)
);

CREATE INDEX IF NOT EXISTS blog_post_translations_post_idx ON blog_post_translations(post_id);
CREATE INDEX IF NOT EXISTS blog_post_translations_locale_idx ON blog_post_translations(locale);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS blog_post_translations_updated_at ON blog_post_translations;
CREATE TRIGGER blog_post_translations_updated_at
  BEFORE UPDATE ON blog_post_translations
  FOR EACH ROW
  EXECUTE FUNCTION blog_posts_set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RLS (Row Level Security)
-- ----------------------------------------------------------------------------
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_translations ENABLE ROW LEVEL SECURITY;

-- Helper: ¿el usuario actual es un agent activo?
CREATE OR REPLACE FUNCTION is_active_agent()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agents
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── blog_posts ───────────────────────────────────────────────────────────────

-- Público: solo lee posts published
DROP POLICY IF EXISTS "Anyone can read published posts" ON blog_posts;
CREATE POLICY "Anyone can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Agents: leen todo (incluyendo borradores)
DROP POLICY IF EXISTS "Agents can read all posts" ON blog_posts;
CREATE POLICY "Agents can read all posts"
  ON blog_posts FOR SELECT
  USING (is_active_agent());

-- Agents: crean posts
DROP POLICY IF EXISTS "Agents can create posts" ON blog_posts;
CREATE POLICY "Agents can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (is_active_agent());

-- Agents: editan/borran (cualquier agent activo puede editar — flujo colaborativo)
DROP POLICY IF EXISTS "Agents can update posts" ON blog_posts;
CREATE POLICY "Agents can update posts"
  ON blog_posts FOR UPDATE
  USING (is_active_agent());

DROP POLICY IF EXISTS "Agents can delete posts" ON blog_posts;
CREATE POLICY "Agents can delete posts"
  ON blog_posts FOR DELETE
  USING (is_active_agent());

-- ── blog_post_translations ───────────────────────────────────────────────────

-- Público: lee traducciones de posts published
DROP POLICY IF EXISTS "Anyone can read translations of published posts" ON blog_post_translations;
CREATE POLICY "Anyone can read translations of published posts"
  ON blog_post_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_post_translations.post_id
      AND blog_posts.status = 'published'
    )
  );

-- Agents: gestión completa
DROP POLICY IF EXISTS "Agents can read all translations" ON blog_post_translations;
CREATE POLICY "Agents can read all translations"
  ON blog_post_translations FOR SELECT
  USING (is_active_agent());

DROP POLICY IF EXISTS "Agents can create translations" ON blog_post_translations;
CREATE POLICY "Agents can create translations"
  ON blog_post_translations FOR INSERT
  WITH CHECK (is_active_agent());

DROP POLICY IF EXISTS "Agents can update translations" ON blog_post_translations;
CREATE POLICY "Agents can update translations"
  ON blog_post_translations FOR UPDATE
  USING (is_active_agent());

DROP POLICY IF EXISTS "Agents can delete translations" ON blog_post_translations;
CREATE POLICY "Agents can delete translations"
  ON blog_post_translations FOR DELETE
  USING (is_active_agent());

-- ----------------------------------------------------------------------------
-- 4. Vista pública para consultas comunes (post + traducción del idioma actual)
-- ----------------------------------------------------------------------------
-- Esta vista no es estrictamente necesaria (se puede hacer JOIN desde el cliente)
-- pero simplifica las queries del frontend.
CREATE OR REPLACE VIEW blog_posts_published AS
SELECT
  p.id,
  p.slug,
  p.status,
  p.cover_image,
  p.category,
  p.read_time_min,
  p.author_id,
  p.guest_author,
  p.published_at,
  p.created_at,
  p.updated_at,
  a.name AS author_name,
  a.photo_url AS author_photo,
  a.role AS author_role,
  a.bio AS author_bio
FROM blog_posts p
LEFT JOIN agents a ON a.id = p.author_id
WHERE p.status = 'published';

-- ============================================================================
-- LISTO
-- ============================================================================
-- Verifica en el dashboard de Supabase:
--   1. Tablas: blog_posts, blog_post_translations
--   2. Vista: blog_posts_published
--   3. Función: is_active_agent()
--   4. RLS habilitado en ambas tablas
--
-- Próximo paso: el frontend (src/services/blog.service.ts)
-- ============================================================================
