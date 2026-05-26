# Incidente: usuario huérfano `auth.users` ↔ `agents`

**Date:** 2026-05-26 (started 21:00, resolved 21:45)
**Status:** completed
**Severity:** P0 — bloqueaba el acceso al admin para el owner del proyecto
**Related:**
  - ADR-001 (acoplamiento auth.users / agents)
  - `docs/runbooks/login-no-puedo-entrar.md`
  - Commits: `3a4fcd77`, `b21781d6`, `c352f646`
  - Migration: `supabase/migrations/005_agents_auto_provisioning.sql`

---

## Objective

Diagnosticar y resolver: Jonatan (creativedesignseo@gmail.com) no podía
entrar al panel admin de Atlas Rouge. El sistema le mostraba "Email o
contraseña incorrectos" aunque el password era correcto. El flujo de
recuperación de contraseña tampoco funcionaba (formulario se quedaba
en "Guardando…" indefinidamente).

Después del fix, dejar el sistema blindado para que ningún futuro
usuario invitado pueda caer en este estado.

---

## Diagnóstico — timeline real con red herrings

### Síntoma reportado por el usuario

> "Me llegó el correo pero se quedó aquí" (screenshot: spinner infinito
> en pantalla 'Nueva contraseña' tras pulsar Guardar).

### Hipótesis 1 (descartada): timeout de red

Aplicado `withTimeout(15s)` a `setNewPassword`. Resultado: tras 15s
aparecía "Request timed out". Confirmaba que la promesa nunca
resolvía, pero no la causa raíz.

**Commit:** `3a4fcd77` — fix(auth): wrap auth calls in withTimeout to prevent hang

### Hipótesis 2 (descartada): el password no se guardaba

Verificado via DevTools Network: `PUT /auth/v1/user` devolvía **200 OK**
con response válido. El password SÍ se guardaba server-side. El bug
estaba en el cliente JS de Supabase: tras un `updateUser` exitoso
durante recovery session, el cliente intenta refrescar el token con un
`refresh_token` que se acaba de invalidar → deadlock interno → la
promesa nunca resuelve aunque el HTTP terminó.

**Fix:** race entre evento `USER_UPDATED` (autoritativo), la propia
promesa, y un timeout de 15s. Whatever fires first wins.

**Commit:** `b21781d6` — fix(auth): race USER_UPDATED event vs updateUser promise

### Hipótesis 3 (CORRECTA — la causa raíz): usuario huérfano

Tras logear via API REST directamente (`POST /auth/v1/token?grant_type=password`)
con `Marru.2025`: HTTP 200 + access_token válido. **El password estaba
bien todo el rato.**

Test con Playwright en el browser real: el login a Supabase devolvía
token, pero el frontend mostraba "credenciales incorrectas". Inspección
de Console reveló:

```
ERROR: getAgent error: {code: 'PGRST116', message: 'Cannot coerce the result to a single JSON object'}
GET /rest/v1/agents?user_id=eq.190dcf0c-...&is_active=eq.true → 0 rows
```

**Causa raíz:** Jonatan existía en `auth.users` (creado vía Dashboard
de Supabase → Authentication → Invite user) pero NO existía en
`public.agents`. El código de `signIn()` consulta `agents` para validar
que el usuario es admin activo. Al no encontrar fila, **la app rechazaba
el login con el genérico "credenciales incorrectas"** — mensaje
engañoso que llevó a tres iteraciones de password reset infructuosas.

---

## Lecciones aprendidas

1. **El UX "credenciales incorrectas" debe ser específico.** Un mensaje
   ambiguo en login genera bucles de reset password sin solución.
   Solucionado en commit `c352f646`: el código ahora devuelve
   `NO_AGENT_PROFILE` y `AGENT_INACTIVE` como errores distintos,
   traducidos a mensajes accionables.

2. **`auth.users` y la tabla de perfil de negocio nunca deben
   desacoplarse.** Supabase trata `auth.users` como su propia tabla
   interna; cualquier vía de creación (Dashboard, signUp, admin API,
   recovery) inserta ahí. Si tu tabla de negocio no escucha esos
   inserts, generas usuarios huérfanos. Solucionado en migración 005:
   trigger en `auth.users` que auto-provisiona `agents` con role
   viewer + inactive.

3. **El cliente JS de Supabase oculta deadlocks tras updateUser en
   recovery session.** Conocido issue del SDK (auth-js). La estrategia
   correcta es no esperar a la promesa; escuchar el evento
   `USER_UPDATED` como source of truth.

4. **DevTools Network es la herramienta de diagnóstico definitiva
   cuando la UI se queda en limbo.** En este caso, los 200 OK del
   servidor descartaron 2 hipótesis falsas en un screenshot.

5. **Toda creación de auth.users debe pasar por un flujo controlado.**
   Mientras no haya UI de invitación dentro del admin, NUNCA crear
   usuarios desde el Dashboard de Supabase sin acordarse de también
   activar la fila en `agents`. Con la migración 005 esto deja de ser
   un riesgo.

---

## Files inspected

- `src/services/auth.service.ts` — flujo signIn / requestPasswordReset / setNewPassword
- `src/pages/admin/AdminPasswordReset.tsx` — UI del flujo recovery
- `src/pages/admin/AdminLogin.tsx` — error handling del login
- `src/lib/supabase.ts` — configuración del cliente (lock disabled)
- `netlify/functions/translate-property.js` — verificado, no relacionado
- `supabase/migrations/001_agents.sql` — schema base de `agents`

## Files changed

- `src/services/auth.service.ts` — withTimeout + USER_UPDATED race + agent profile check
- `src/pages/admin/AdminPasswordReset.tsx` — signOut + redirect to login tras reset
- `src/pages/admin/AdminLogin.tsx` — switch sobre 3 códigos de error
- `supabase/migrations/005_agents_auto_provisioning.sql` — **NUEVO** trigger + backfill
- `docs/decisions/ADR-001-auth-agents-coupling.md` — **NUEVO**
- `docs/runbooks/login-no-puedo-entrar.md` — **NUEVO**

## Commands run

```bash
# Diagnóstico del estado real en Auth
curl ".../auth/v1/admin/users" -H "Authorization: Bearer $SERVICE_KEY"
# → 2 usuarios, ambos con last_sign_in_at reciente

# Test de password contra Supabase
curl -X POST ".../auth/v1/token?grant_type=password" -d '{"email":"…","password":"Marru.2025"}'
# → 200 OK + access_token (descartó hipótesis "password mal")

# Inspección de agents
curl ".../rest/v1/agents?select=*" -H "Authorization: Bearer $SERVICE_KEY"
# → 1 sola fila (admin@atlasrouge.ma). Confirmó user huérfano.

# Hotfix vía Admin API
curl -X PUT ".../auth/v1/admin/users/$USER_ID" -d '{"password":"Marru.2025"}'
curl -X POST ".../rest/v1/agents" -d '{"user_id":"…","email":"…","role":"admin","is_active":true}'

# Verificación end-to-end con Playwright
# → Login OK, dashboard carga, "Jonatan" en esquina superior
```

## Verification

- ✅ Login con `creativedesignseo@gmail.com` / `Marru.2025` → entra al admin
- ✅ `bash scripts/verify.sh` → all checks passed
- ✅ Build verde, deploy verde en Netlify
- ⏳ Trigger SQL pendiente de aplicar en Supabase Studio (paso manual del owner)

## Open risks

1. **La migración 005 está en el repo pero no aplicada todavía.** Hasta
   que el owner pegue el SQL en Supabase Studio → SQL Editor, el bug
   sigue siendo reproducible. Una vez aplicado, queda blindado.

2. **No hay UI de "Invitar usuario" en el admin.** Mientras no exista,
   el riesgo de crear users desde Dashboard sigue presente, pero el
   trigger lo neutraliza (queda inactivo, no huérfano).

3. **El refresh_token deadlock de Supabase auth-js no está reportado
   upstream.** Si el SDK lo arregla en una versión futura, nuestro
   workaround (race con USER_UPDATED) seguirá funcionando — solo
   añade un evento extra de listener.

## Next step

Owner aplica la migración 005 en Supabase Studio (2 min). Después,
test invitando un usuario de prueba desde Dashboard para confirmar
que el trigger auto-crea la fila inactiva en `agents`. Una vez
confirmado, marcar B7 como resuelto.
