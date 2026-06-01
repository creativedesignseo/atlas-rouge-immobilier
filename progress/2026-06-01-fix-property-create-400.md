# 2026-06-01 — Fix: crear inmueble daba HTTP 400 (neighborhood_id slug→uuid)

## Objetivo
Resolver el error reportado por el owner: al pulsar "Crear propiedad" la
consola mostraba `400` sobre `POST /rest/v1/properties?select=*` y el
inmueble no se guardaba. La traducción y la subida de imágenes ya
funcionaban; este era el último bloqueo del flujo de creación.

## Diagnóstico
- Un `400` (no 401/403) descarta RLS: es una bad request de datos.
- Introspección del esquema real de prod vía Management API (PAT en
  `.env.local`): todas las columnas del payload existen; los CHECK de
  `transaction`/`type` admiten los valores enviados (`sale`/`villa`).
- Causa raíz: el `<select>` de Barrio en `PropertyForm` usaba
  `value={n.slug}`, pero `properties.neighborhood_id` es `uuid` (FK a
  `neighborhoods.id`). Reproducido en prod (transacción + rollback):
  `ERROR: 22P02: invalid input syntax for type uuid: ""` con barrio vacío
  (y el mismo error con el slug si se elegía barrio).
- El bug afectaba también a la edición (el select no preseleccionaba el
  barrio porque comparaba uuid contra slug).

## Archivos inspeccionados
- `src/services/admin/propertyAdmin.service.ts` (createProperty/toDbInsert/updateProperty)
- `src/pages/admin/AdminPropertyNew.tsx`, `AdminPropertyEdit.tsx`
- `src/components/admin/PropertyForm.tsx`
- `src/services/neighborhood.service.ts`, `src/data/neighborhoods.ts`

## Archivos cambiados
- `src/data/neighborhoods.ts` — `id?: string` en el tipo `Neighborhood`.
- `src/services/neighborhood.service.ts` — el mapper expone `id: row.id`.
- `src/components/admin/PropertyForm.tsx` — `<option value={n.id ?? ''}>`
  y `buildSourceContent` busca por `item.id`.
- `src/services/admin/propertyAdmin.service.ts` — `toDbInsert` coercer
  `neighborhood_id: data.neighborhood_id || null`.

## Comandos
- `npx tsc -b --noEmit` → limpio.
- `bash scripts/verify.sh` → verde (lint + build).
- Repro vía Management API: insert con `''` → 400 (confirma causa);
  insert con `null` y con uuid real → válidos (rollback, 0 filas dejadas).

## Resultado de verificación
✅ Verde. Causa raíz confirmada y fix probado contra la BD real sin
persistir datos ni tocar la sesión del navegador del owner.

## Riesgos abiertos
- Ninguno en rutas de lectura (los slugs públicos no cambian; solo se
  añadió `id` opcional al tipo y al mapper).

## Próximo paso
Owner reabre el admin tras el deploy de Netlify y crea el inmueble
end-to-end (traducir → subir imagen → crear).
