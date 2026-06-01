-- ============================================================================
-- Migration 007: Storage RLS for the `property-images` bucket
-- ============================================================================
-- APPLY IN SUPABASE STUDIO → SQL Editor (the REST API cannot run raw SQL).
-- Project: slxlkbrqcjabsfuhlwdf (account adspublioficial@gmail.com).
--
-- CONTEXTO (verificado EN VIVO 2026-06-01 con Playwright + sesión de un
-- agente real, no por suposición):
--   Subir la foto de un inmueble desde el admin fallaba con
--     StorageApiError: new row violates row-level security policy
--     POST /storage/v1/object/property-images/<file>.webp -> HTTP 400
--   La conversión de la imagen a WebP SÍ funciona (el archivo llega como
--   .webp); lo que falla es el INSERT en `storage.objects`: el bucket
--   `property-images` no tiene una política que permita a los usuarios
--   autenticados (agentes) subir. Este era el problema de raíz que el
--   error de formato (AVIF) venía tapando.
--
-- FIX: políticas permisivas para el rol `authenticated` sobre el bucket
--   `property-images` (INSERT / UPDATE / DELETE). En Atlas Rouge los únicos
--   usuarios autenticados son los agentes del equipo (no hay registro
--   público de usuarios), por lo que `authenticated` ≈ agente. La LECTURA ya
--   es pública (el bucket es público y se sirve vía el proxy /img/).
--
-- NOTA: si en el futuro se añade registro público de usuarios, endurecer
--   estas políticas con `public.is_active_agent()` en lugar de permitir a
--   cualquier `authenticated`. No se usa ahora para no acoplar la subida al
--   estado de ese helper (la migración 006 le fijó el search_path).
-- ============================================================================

-- SELECT — necesario para que las operaciones de gestión (DELETE/UPDATE) del
-- admin localicen el objeto. La lectura pública del bucket va por otra vía
-- (rol anon); esto es para el rol authenticated (agentes).
DROP POLICY IF EXISTS "property_images_select" ON storage.objects;
CREATE POLICY "property_images_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'property-images');

-- INSERT — subir imágenes nuevas
DROP POLICY IF EXISTS "property_images_insert" ON storage.objects;
CREATE POLICY "property_images_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images');

-- UPDATE — reemplazar/upsert una imagen existente
DROP POLICY IF EXISTS "property_images_update" ON storage.objects;
CREATE POLICY "property_images_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images')
  WITH CHECK (bucket_id = 'property-images');

-- DELETE — borrar una imagen
DROP POLICY IF EXISTS "property_images_delete" ON storage.objects;
CREATE POLICY "property_images_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images');

-- ============================================================================
-- VERIFICACION (tras aplicar):
--   1. En el admin, subir una foto a un inmueble → debe completar sin error.
--   2. O comprobar que las políticas existen:
--        SELECT policyname, cmd FROM pg_policies
--        WHERE schemaname = 'storage' AND tablename = 'objects'
--          AND policyname LIKE 'property_images_%';
-- ============================================================================
