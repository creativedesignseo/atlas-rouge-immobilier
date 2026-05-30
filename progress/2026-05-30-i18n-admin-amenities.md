# 2026-05-30 — i18n del panel admin + amenities (FR → ES/EN)

## Objetivo
El owner vio el formulario de admin (y la web pública) **mixto**: castellano con
bloques en francés. Hacer la UI 100% coherente con el idioma activo.

## Causas (investigadas)
1. Fix de labels de `PropertyForm` de una sesión previa estaba **sin desplegar**
   (working tree) → prod seguía en francés.
2. **Amenities** (Piscine, Jardin…) en francés crudo en TODA la web: el
   namespace `amenities` estaba registrado en `i18n.ts` pero los
   `amenities.json` estaban **vacíos `{}`** y nunca se aplicó `t()`.
3. `AdminLogin` con textos franceses hardcodeados (las claves `login.*` ya
   existían, solo no se usaban).

## Cambios (commits `7a671e34` + `cbb235fa`, desplegados)
- `src/locales/{fr,es,en}/amenities.json` — poblados con las amenities (clave =
  slug del valor francés). Cubre las 16 reales de la BD + variantes de filtros.
- `src/lib/amenities.ts` (NUEVO) — `amenityLabel(value, t)` =
  `t(slug(value), { ns:'amenities', defaultValue:value })` (fallback al FR).
- Aplicado en `PropertyForm.tsx`, `Search.tsx` (tarjetas + filtros sidebar y
  drawer), `PropertyDetail.tsx`, `PropertyCard.tsx`.
- `PropertyForm.tsx` — labels FR ya migrados a i18n (admin ns) + **auto-traducir
  al guardar** si faltan ES/EN (Parte B).
- `AdminLogin.tsx` — usa las claves `login.*` existentes.
- `src/locales/{fr,es,en}/admin.json` — claves nuevas (pricingSection,
  pricePerSqm, roomsSection, optionsSection, selectOption, titleLangPlaceholder,
  descriptionLangPlaceholder).

## Verificación (en producción)
- `bash scripts/verify.sh` verde; paridad de claves fr/es/en ✓.
- Playwright sobre https://atlasrouge.com:
  - Admin `/admin/properties/new` en ES → **todo el formulario y todas las
    amenities en castellano**.
  - Público `/es/comprar` → tags de amenities en castellano; `stillFrench: []`.
  - Las 16 amenities de la BD tienen traducción.

## Pendiente / relacionado (NO en estos commits)
- **Contenido de inmuebles** (títulos/descripciones/highlights) sigue en
  francés — es CONTENIDO, se traduce con el **batch de IA**, que está
  **bloqueado esperando la `service_role` key** (RLS bloquea el UPDATE con login
  admin: `agent_id` null + `is_admin_role()` no autoriza desde RLS). El script
  `scripts/translate-existing-properties.mjs` está listo; en cuanto el owner
  ponga `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`, se corre
  `npm run translate:properties` y los inmuebles quedan trilingües.
- Ese script + el `package.json` (`translate:properties`) siguen sin commitear
  (van con el cierre del batch).
- Phase 0 sigue sin desplegar (intacto en working tree).
