# 2026-06-01 — Fix local: `translate-property` 401 con sesión fresca

## Objetivo
Resolver el P0 descrito en `CODEX_HANDOFF_401.md`: la Netlify Function
`/.netlify/functions/translate-property` devolvía 401
`Active agent session required` incluso con una sesión admin fresca en
incógnito, bloqueando la creación de inmuebles.

## Archivos inspeccionados
- `AGENTS.md`
- `CODEX_HANDOFF_401.md`
- `docs/decisions/ADR-001-*.md`
- `HANDOFF_REPORT.md`
- `tasks/current.md`
- `docs/runbooks/login-no-puedo-entrar.md`
- `netlify/functions/translate-property.js`
- `src/services/translation.service.ts`
- `src/lib/supabase.ts`
- `src/hooks/useAuth.tsx`
- `src/services/auth.service.ts`
- `src/components/admin/ImageUploader.tsx`
- `src/services/admin/propertyAdmin.service.ts`

## Archivos cambiados
- `netlify/functions/translate-property.js`
- `src/services/translation.service.ts`
- `HANDOFF_REPORT.md`
- `tasks/current.md`
- `progress/2026-06-01-fix-translate-property-401.md`

## Decisión
No se relajó el portón de seguridad. La función sigue exigiendo una sesión
Supabase válida y una fila activa en `public.agents`, leída con el token del
usuario para que RLS siga siendo la autoridad.

El cambio elimina dos fuentes de falso 401:
- El cliente ya no llama la función sin Bearer si `getSession()` tarda o no
  devuelve sesión; usa el access token persistido en `atlas-rouge-auth-token`
  como fallback.
- La función tolera un anon key runtime ausente/desalineado intentando validar
  contra Supabase con el access token del usuario como `apikey`, sin aceptar
  usuarios que no pasen `/auth/v1/user` y `agents?is_active=true`.

También se añadieron reason codes no sensibles para dejar de diagnosticar a
ciegas: `missing_authorization`, `session_rejected`, `agent_lookup_failed`,
`agent_not_active`, `user_missing_id`, `missing_api_key`.

## Comandos ejecutados
- `node --check netlify/functions/translate-property.js`
- `npx tsc -b --noEmit`
- `bash scripts/verify.sh`
- Lecturas públicas de producción con `curl` para confirmar que el endpoint sin
  token sigue devolviendo 401 y que el bundle público usa el proyecto Supabase
  correcto.

## Resultado de verificación
✅ `bash scripts/verify.sh` verde.

Notas de verificación:
- `npm run lint` pasa con 3 warnings Fast Refresh preexistentes.
- `npm run build` pasa.
- El build local avisa que no hay key Supabase en env local para sitemap
  dinámico; el script degrada de forma tolerante y genera las URLs estáticas.

## Riesgos abiertos
- No se verificó producción con token real porque no se debe usar la cuenta del
  owner y no había agente de prueba dedicado disponible en esta sesión.
- Falta commit + push a `main`; mientras no se haga, producción sigue con el
  comportamiento anterior.

## Próximo paso
Commit + push a `main` tras aprobación del owner, dejar que Netlify auto-deploye
y verificar con un agente de prueba dedicado.
