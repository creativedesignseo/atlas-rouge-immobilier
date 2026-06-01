# 2026-06-01 — Fix local: listado admin colgado tras crear propiedad

## Objetivo
Resolver el spinner infinito en `/admin/properties` después de guardar un
inmueble. El guardado ya redirige al listado, pero el listado no termina de
cargar.

## Archivos inspeccionados
- `src/pages/admin/AdminProperties.tsx`
- `src/services/admin/propertyAdmin.service.ts`

## Archivos cambiados
- `src/pages/admin/AdminProperties.tsx`
- `src/services/admin/propertyAdmin.service.ts`
- `HANDOFF_REPORT.md`
- `tasks/current.md`
- `progress/2026-06-01-fix-admin-properties-list-hang.md`

## Diagnóstico
`AdminProperties` deja `loading=true` hasta que `getAdminProperties()` resuelve.
Esa función seguía usando `supabase.from('properties').select('*')` sin timeout.
Era el mismo patrón de promesa colgada observado en traducción, subida de imagen
y guardado.

## Cambio
- `fetchAdminProperties()` ahora usa REST directo a PostgREST con Bearer token,
  `apikey`, `order=created_at.desc` y timeout de 30s.
- Conserva el filtro `agent_id=eq.<agentId>` para usuarios no-admin.
- `AdminProperties` muestra el mensaje real del error si la carga falla.

## Comandos ejecutados
- `npx tsc -b --noEmit`
- `bash scripts/verify.sh`

## Resultado de verificación
✅ `bash scripts/verify.sh` verde.

Notas:
- `npm run lint` pasa con 3 warnings Fast Refresh preexistentes.
- `npm run build` pasa.

## Riesgos abiertos
- No se verificó contra sesión de agente real en esta sesión. Si aún falla, la
  UI debería mostrar el error real en vez de quedarse en spinner.

## Próximo paso
Commit + push a `main`, esperar auto-deploy Netlify y recargar
`/admin/properties`.
