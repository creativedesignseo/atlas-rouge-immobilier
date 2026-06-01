-- ============================================================================
-- Migration 009: RLS audit fixes — close PII leak on contact_submissions
-- ============================================================================
-- Apply with: npm run migrate -- supabase/migrations/009_rls_audit_fixes.sql
-- Project: slxlkbrqcjabsfuhlwdf (account adspublioficial@gmail.com)
--
-- CONTEXTO (auditoría sistemática de RLS 2026-06-01, probado en vivo):
--   La tabla `contact_submissions` tenía una política SELECT para el rol `anon`
--   con USING (true): cualquiera con la anon key (que va en el bundle público
--   del navegador) podía leer TODOS los mensajes de contacto — nombre, email,
--   teléfono, mensaje. Verificado en vivo: un GET anónimo devolvió filas reales.
--   Fuga de PII / problema RGPD.
--
-- FIX: eliminar la lectura pública. El formulario de contacto sigue funcionando
--   (contact.service hace .insert() SIN .select(), verificado, y la política
--   "Allow public insert" se mantiene). El admin sigue leyendo los contactos vía
--   la política "Allow admin all on contact_submissions" (is_admin(), que tras
--   la migración 008 reconoce a los admins del sistema `agents`).
-- ============================================================================

-- 🔴 Cerrar la lectura pública de los datos de contacto (PII)
DROP POLICY IF EXISTS "Allow public read on contact_submissions" ON contact_submissions;

-- ============================================================================
-- VERIFICACION (tras aplicar):
--   - GET anónimo a /rest/v1/contact_submissions con la anon key → 0 filas.
--   - El formulario público de contacto sigue insertando (POST anon → 201).
--   - El admin sigue viendo los contactos en el panel (lee vía is_admin()).
-- ============================================================================
