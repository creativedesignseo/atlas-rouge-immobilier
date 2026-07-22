-- 014_contact_email_drop_address.sql
-- Correo corporativo real (Zoho Mail) + eliminar la dirección de la web.
-- El owner (2026-07-22) pidió: email = info@atlasrouge.com, y quitar la
-- dirección (no hay una dirección física que mostrar todavía).

UPDATE site_settings SET value = 'info@atlasrouge.com' WHERE key = 'email';

INSERT INTO site_settings (key, value) VALUES ('email', 'info@atlasrouge.com')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- La dirección ya no se muestra en ningún sitio (bloque "Dirección" y la
-- sección de mapa decorativo se quitaron de la página de Contacto).
DELETE FROM site_settings WHERE key IN ('address', 'city_postal');
