# 2026-06-01 — Fix local: guardar propiedad colgado en spinner

## Objetivo
Resolver el tercer bloqueo del flujo admin: tras traducción e imagen OK, el
botón "Crear propiedad" quedaba girando y no creaba ni guardaba el inmueble.

## Archivos inspeccionados
- `src/pages/admin/AdminPropertyNew.tsx`
- `src/pages/admin/AdminPropertyEdit.tsx`
- `src/components/admin/PropertyForm.tsx`
- `src/services/admin/propertyAdmin.service.ts`
- `src/lib/authSession.ts`

## Archivos cambiados
- `src/services/admin/propertyAdmin.service.ts`
- `HANDOFF_REPORT.md`
- `tasks/current.md`
- `progress/2026-06-01-fix-property-save-hang.md`

## Diagnóstico
El submit del formulario sí entra en `AdminPropertyNew.handleSubmit()` y deja
`isLoading=true`. El spinner solo se queda indefinido si `createProperty()` no
resuelve. Esa función todavía usaba:

```ts
supabase.from('properties').insert(...).select().single()
```

Visto el patrón de los dos bloqueos anteriores, el wrapper de supabase-js podía
quedar esperando auth/red sin que el `finally` del formulario recuperase la UI.

## Cambio
`createProperty()` y `updateProperty()` ahora usan un helper REST directo:

- obtiene access token con `currentAccessToken()`;
- llama a PostgREST con `Authorization: Bearer`, `apikey`, JSON y
  `Prefer: return=representation`;
- timeout de 45s;
- 401 limpia sesión local y redirige a login;
- errores de PostgREST/RLS/validación propagan el mensaje real;
- mantiene invalidación de cachés tras guardar.

## Comandos ejecutados
- `npx tsc -b --noEmit`
- `bash scripts/verify.sh`

## Resultado de verificación
✅ `bash scripts/verify.sh` verde.

Notas:
- `npm run lint` pasa con 3 warnings Fast Refresh preexistentes.
- `npm run build` pasa.

## Riesgos abiertos
- No se probó insert real con token de agente dedicado en esta sesión. Si aún
  falla en producción, ahora debería mostrar el error real de PostgREST en el
  toast en vez de quedar colgado.

## Próximo paso
Commit + push a `main`, esperar auto-deploy Netlify y pedir al owner que
reintente "Crear propiedad".
