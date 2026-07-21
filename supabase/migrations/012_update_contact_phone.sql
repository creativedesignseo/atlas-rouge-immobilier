-- 012_update_contact_phone.sql
-- Actualiza el teléfono/WhatsApp real de contacto en site_settings.
-- Antes: placeholders +212 524 00 00 00 / +212 600 00 00 00.
-- Ahora: +212 648 02 41 56 (mismo número para llamada y WhatsApp).

UPDATE site_settings SET value = '+212 648 02 41 56' WHERE key = 'phone';
UPDATE site_settings SET value = '+212 648 02 41 56' WHERE key = 'whatsapp';

-- Por si el proyecto aún no tenía filas de site_settings sembradas.
INSERT INTO site_settings (key, value)
  VALUES ('phone', '+212 648 02 41 56'), ('whatsapp', '+212 648 02 41 56')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
