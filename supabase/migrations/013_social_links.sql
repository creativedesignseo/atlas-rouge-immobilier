-- 013_social_links.sql
-- Redes sociales reales del negocio: solo Instagram y TikTok.
-- Antes: instagram_url y facebook_url eran placeholders '#'.
-- Ahora: instagram_url real + tiktok_url nuevo. facebook_url se elimina
-- (la agencia no tiene Facebook activo; el footer/contacto ya no lo muestran).

INSERT INTO site_settings (key, value) VALUES
  ('instagram_url', 'https://www.instagram.com/atlasrougeimmo/'),
  ('tiktok_url', 'https://www.tiktok.com/@atlas.rouge.immo')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

DELETE FROM site_settings WHERE key = 'facebook_url';
