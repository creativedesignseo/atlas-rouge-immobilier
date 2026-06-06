# ADR-002 — Cliente Supabase anónimo dedicado para lecturas públicas

**Status:** Accepted
**Date:** 2026-06-05
**Deciders:** Jonatan (Adspubli), Claude (asistente)
**Related:**
  - `progress/2026-06-05-first-load-resilience.md` (postmortem + cronología)
  - `src/lib/supabase.ts` (`supabase` vs `supabasePublic`)
  - `src/lib/adminRest.ts` (el mismo problema, resuelto antes en el admin)
  - ADR-001 (acoplamiento auth.users ↔ agents)

---

## Contexto

Supabase como tecnología **nunca falló**: la base de datos respondía bien. El
problema era de **arquitectura del cliente**, no del backend.

`@supabase/supabase-js` resuelve un token de acceso **antes de cada petición
PostgREST**. El cliente principal de la app (`supabase`) está configurado con
sesión persistente y `autoRefreshToken: true`, porque el panel `/admin` lo
necesita. Consecuencia: cuando hay un usuario logueado, en la **primera carga**
supabase-js intenta **refrescar el token de sesión**, y **toda** lectura de datos
(inmuebles, barrios, blog, favoritos) queda encolada detrás de ese refresco. Si
el refresco se atasca (cold start, red lenta, token al borde de caducar), las
lecturas no salen → la página "no carga a la primera" y hay que recargar.

Síntoma exacto observado en prod (5 jun 2026), con el owner logueado en /admin:
`Failed to load neighborhoods / featured / blog: Error: TIMEOUT` en los tres a
la vez. Un visitante **anónimo nunca lo reproducía** (no hay sesión que
refrescar), lo que mantuvo el bug invisible ~6 semanas.

Este es el **mismo** fallo que ya se había diagnosticado y resuelto en el admin
el 1 jun 2026 (`adminRest.ts`, fetch directo a PostgREST) — pero la lección se
aplicó solo al admin, no a las lecturas públicas.

## Decisión

Las **lecturas públicas/anónimas no usan el cliente con sesión.** Se añade un
segundo cliente dedicado en `src/lib/supabase.ts`:

```ts
export const supabasePublic = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
```

Como no persiste, no refresca ni detecta sesión, **no tiene nada en lo que
bloquearse**: usa la anon key directamente. Las políticas RLS ya permiten al rol
`anon` leer los datos públicos (propiedades activas, barrios activos, posts
publicados), así que estas lecturas **no necesitan el JWT del agente**.

Usan `supabasePublic`:
- `property.service.ts`, `neighborhood.service.ts` (import con alias)
- `blog.service.ts` — **solo las lecturas**; las escrituras (crear/editar/borrar)
  siguen en `supabase` (requieren el rol autenticado)
- `hooks/useFavorites.tsx` (favoritos son anónimos por `anon_id`)

El cliente `supabase` con sesión queda para: auth, panel admin y todas las
escrituras autenticadas.

## INVARIANTE (regla que un revisor debe poder verificar de un grep)

> **Toda lectura de datos públicos/anónimos usa `supabasePublic`, NUNCA
> `supabase`.** El cliente con sesión (`supabase`) es solo para auth, admin y
> escrituras autenticadas. Un grep de `supabase\.from` en `src/services/*.ts`
> (no-admin) y en componentes públicos debe dar **cero** resultados.

## Alternativas consideradas

- **Reescribir las lecturas públicas a fetch directo a PostgREST** (como
  `adminRest.ts`): funciona, pero obliga a construir query strings a mano y
  pierde el query-builder. El cliente anónimo logra el mismo desacople sin
  reescribir queries. (Descartada por coste/riesgo.)
- **Quitar `autoRefreshToken`/sesión del cliente único:** rompería el admin.
- **Solo timeouts + reintentos** (lo que se hizo primero el 5 jun): NO arregla la
  causa — los reintentos van por el mismo cliente bloqueado y también dan
  TIMEOUT. Se conservan como **red de seguridad**, no como solución.

## Consecuencias

- (+) La primera carga deja de depender del estado de la sesión → carga a la
  primera tanto para anónimos como para usuarios logueados.
- (+) Patrón replicable y claro para clonar el stack a otras inmobiliarias.
- (−) Dos clientes Supabase coexisten: hay que recordar la invariante al añadir
  servicios nuevos. Mitigación: esta ADR + la regla en `AGENTS.md`.
- (−) Las lecturas públicas siempre van como rol `anon`, aunque haya un admin
  logueado. Es correcto: las páginas públicas muestran datos públicos. Si alguna
  vez una lectura pública necesitara datos privados del usuario, iría por
  `supabase`, no por `supabasePublic`.

## Cómo verificar (reproducción del bug)

Preview de producción + Playwright: sembrar una sesión de admin **caducada** en
`localStorage` (`atlas-rouge-auth-token`) y **colgar `**/auth/v1/**`** (el
refresh). Resultado esperado: el refresh se intenta y cuelga, pero los datos
cargan igual (lecturas por `supabasePublic`). Antes del fix: TIMEOUT en las tres
secciones.
