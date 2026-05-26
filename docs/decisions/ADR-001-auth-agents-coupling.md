# ADR-001 — Acoplamiento `auth.users` ↔ `public.agents`

**Status:** Accepted
**Date:** 2026-05-26
**Deciders:** Jonatan (Adspubli), Claude (asistente)
**Related:**
  - `progress/2026-05-26-orphan-user-incident.md`
  - `supabase/migrations/005_agents_auto_provisioning.sql`
  - `docs/runbooks/login-no-puedo-entrar.md`

---

## Contexto

El sistema de autenticación de Atlas Rouge usa dos tablas en paralelo:

- **`auth.users`** — tabla interna de Supabase. Maneja credenciales,
  tokens, sesiones. Cualquier vía de creación (Dashboard, `signUp`,
  `auth.admin.inviteUserByEmail`, `auth.admin.createUser`, recovery
  flows que generen usuario) inserta aquí.

- **`public.agents`** — tabla de negocio. Define **quién es admin
  activo** del sistema: role (`admin` / `editor` / `viewer`), nombre,
  avatar, biografía, teléfono. Es la fuente de verdad de "quién puede
  hacer qué dentro del panel".

El código de la app (`src/services/auth.service.ts → signIn`) valida
en dos pasos:

1. `supabase.auth.signInWithPassword` → password correcto contra
   `auth.users` (capa de credenciales).
2. `getAgent(userId)` → fila correspondiente en `public.agents` con
   `is_active = true` (capa de autorización).

Si la fila en `agents` no existe o está inactiva, el login se rechaza.

## Problema observado

El 2026-05-26 descubrimos que las dos tablas estaban **completamente
desacopladas**. Crear un usuario desde el Dashboard de Supabase
(Authentication → Add user) insertaba en `auth.users` pero NO en
`agents`. El resultado:

- El usuario podía autenticarse perfectamente (HTTP 200, access_token
  emitido).
- Pero la app le mostraba "credenciales incorrectas" porque `agents`
  no tenía su fila.
- El usuario, lógicamente, asumía que su password estaba mal y
  entraba en bucles de reset.
- Solo un admin con acceso a la Service Role Key podía rescatarlo
  insertando la fila manualmente.

Este patrón **bloqueaba el onboarding** y era invisible sin
inspeccionar Network + Console + tabla `agents`.

## Decisión

**Toda fila en `auth.users` debe tener una fila correspondiente en
`public.agents`. La sincronización se garantiza con un trigger
PostgreSQL en `AFTER INSERT ON auth.users`.**

Detalles:

- El trigger crea la fila con `role = 'agent'` y `is_active = false`
  por defecto. **Nadie es admin automáticamente** — un admin existente
  debe activar al usuario nuevo con un UPDATE.
- `ON CONFLICT (user_id) DO NOTHING` — el trigger es idempotente, no
  rompe si la fila ya existe (caso restoración de backup, creación
  manual, etc.).
- La función usa `SECURITY DEFINER` y `search_path = public` por
  seguridad (evita ataques de schema-shadowing).
- Backfill incluido en la migración: cualquier huérfano existente al
  aplicar la migración recibe su fila inactiva.

A nivel de aplicación, `signIn()` ahora distingue tres casos:

| Situación | Código devuelto | Mensaje al usuario |
|---|---|---|
| Password incorrecto | `Invalid login credentials` | "Email o contraseña incorrectos" |
| Sin fila en `agents` | `NO_AGENT_PROFILE` | "Tu cuenta existe pero no tiene perfil de admin. Contacta con el responsable del sitio." |
| Fila pero `is_active = false` | `AGENT_INACTIVE` | "Tu cuenta está desactivada. Contacta con el responsable del sitio." |

En `NO_AGENT_PROFILE` y `AGENT_INACTIVE` se hace `signOut()` automático
para no dejar sesiones huérfanas.

## Alternativas consideradas

### A. Flujo de "Invitar usuario" en el admin (rechazado por ahora)

Construir UI dentro de `/admin/users` que llame a
`auth.admin.inviteUserByEmail` **y** cree la fila en `agents`
atómicamente. Es la solución más limpia, pero requiere ~30 min de
desarrollo y no es bloqueante si el trigger está en su sitio. Se
mantiene como **P2 en el roadmap** para cuando haya tiempo o cuando
el número de admins justifique el polish.

### B. Hacer `agents.role` columna de `auth.users` directamente

Rechazado: Supabase no recomienda modificar el schema de `auth.*`.
Riesgo de romperse en upgrades del producto. Además perderíamos
campos de negocio (bio, photo_url, phone) que no caben en `auth.users`.

### C. Borrar la tabla `agents` y usar `app_metadata` en `auth.users`

Rechazado: `app_metadata` es JSON, no relacional. No podemos hacer
JOINs eficientes ni queries tipo "listar agentes activos en este
neighborhood". El modelo relacional de `agents` se justifica por
features de negocio (asignar propiedades a agentes, mostrar perfil
público en el sitio, etc.).

### D. Confiar en RLS sin trigger

Rechazado: RLS bloquea acceso pero no crea filas. El problema es
exactamente que la fila no existe, no que esté oculta.

## Consecuencias

### Positivas

- **Cero usuarios huérfanos a partir de la migración 005**, sin
  importar la vía de creación.
- **Error messages accionables** en login → reduce tickets de soporte
  y elimina bucles de password reset.
- **Default seguro**: nadie es admin sin acción explícita. Un atacante
  que consiga signUp solo obtiene una cuenta `viewer` inactiva.
- **Auditable**: cualquier alta queda registrada en `agents.created_at`.

### Negativas

- **El owner tiene que aplicar la migración manualmente** en Supabase
  Studio porque Supabase REST API no expone SQL crudo. Esto es un
  paso humano que puede olvidarse en futuras migraciones. Mitigado
  con el archivo `005_*.sql` en el repo + checklist en `tasks/current.md`.
- **El flujo de invitación queda dependiente del trigger.** Si alguien
  hace `DROP TRIGGER` sin reemplazarlo, volvemos al estado anterior.
  Mitigado con verificación en el runbook de soporte.
- **`role = 'agent'` por defecto requiere un paso manual de
  activación** cuando inivitas a un admin real. Es deliberado (default
  seguro) pero hay que documentar bien el flujo.

## Cómo activar un usuario invitado (procedimiento operativo)

Una vez aplicada la migración 005, el flujo correcto para dar acceso
a un nuevo admin es:

1. **Crear el usuario** en Supabase Dashboard → Authentication →
   Add user → Email + password temporal (o "Send invite").
2. **El trigger inserta automáticamente** la fila inactiva en `agents`.
3. **Activar** desde Supabase Studio → Table Editor → `agents`:
   - `is_active` → `true`
   - `role` → `admin` (o `editor` según el caso)
   - Opcional: rellenar `name`, `phone`, `photo_url`, `bio`.
4. El usuario ya puede entrar al panel.

Cuando exista la UI de "Invitar usuario" (P2), los pasos 1, 2, 3 se
fusionan en un único click desde el admin.
