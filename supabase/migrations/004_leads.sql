-- ============================================================================
-- 004_leads.sql — Leads adicionales (estimación + newsletter)
-- Idempotente: usa IF NOT EXISTS para que se pueda re-ejecutar.
-- ============================================================================

-- ── ESTIMATION REQUESTS ─────────────────────────────────────────────────────
-- Solicitudes de estimación gratuita del valor de un inmueble.
CREATE TABLE IF NOT EXISTS estimation_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,                                 -- opcional, el form actual no lo pide
  preferred_date DATE,                                -- fecha que el cliente sugiere
  property_address TEXT,                              -- futuro, si añadimos campo
  notes        TEXT,                                  -- futuro, comentarios libres
  source_lang  TEXT,                                  -- 'fr' / 'es' / 'en' — idioma activo al enviar
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'closed')),
  assigned_to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estimation_requests_status ON estimation_requests(status);
CREATE INDEX IF NOT EXISTS idx_estimation_requests_created ON estimation_requests(created_at DESC);

ALTER TABLE estimation_requests ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear una solicitud (INSERT anon)
DROP POLICY IF EXISTS "Anyone can submit estimation requests" ON estimation_requests;
CREATE POLICY "Anyone can submit estimation requests"
  ON estimation_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo agents activos pueden leer / actualizar
DROP POLICY IF EXISTS "Agents can read estimation requests" ON estimation_requests;
CREATE POLICY "Agents can read estimation requests"
  ON estimation_requests FOR SELECT
  TO authenticated
  USING (is_active_agent());

DROP POLICY IF EXISTS "Agents can update estimation requests" ON estimation_requests;
CREATE POLICY "Agents can update estimation requests"
  ON estimation_requests FOR UPDATE
  TO authenticated
  USING (is_active_agent())
  WITH CHECK (is_active_agent());

-- ── NEWSLETTER SUBSCRIBERS ──────────────────────────────────────────────────
-- Suscripciones a newsletter del blog. Email único.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  source_lang TEXT,                                   -- idioma activo al suscribirse
  source_page TEXT,                                   -- página desde donde se suscribió
  confirmed   BOOLEAN NOT NULL DEFAULT false,         -- double opt-in (futuro)
  unsubscribed_at TIMESTAMPTZ,                        -- soft-delete cuando cancelan
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede suscribirse (INSERT anon)
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo agents activos pueden leer la lista
DROP POLICY IF EXISTS "Agents can read subscribers" ON newsletter_subscribers;
CREATE POLICY "Agents can read subscribers"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (is_active_agent());

-- Solo agents pueden actualizar (marcar confirmed / unsubscribed)
DROP POLICY IF EXISTS "Agents can update subscribers" ON newsletter_subscribers;
CREATE POLICY "Agents can update subscribers"
  ON newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (is_active_agent())
  WITH CHECK (is_active_agent());
