# CODEX HANDOFF — Enigma: `translate-property` devuelve 401 en sesión válida

**Fecha:** 2026-06-01 · **Estado:** SIN RESOLVER · **Prioridad:** P0 (bloquea
crear inmuebles en el admin).

Lee también, en este orden: `AGENTS.md`, `CLAUDE.md`, `HANDOFF_REPORT.md`
(arriba del todo está el log más reciente), `tasks/current.md`.

---

## El síntoma (reproducible)

En el admin (`atlasrouge.com/admin/properties/new`), al pulsar **"Traducir a
los 3 idiomas con IA"** (y también al **subir una imagen**), la consola del
navegador muestra:

```
POST /.netlify/functions/translate-property  →  401
{"error":"Active agent session required"}
```

y los spinners "Adaptando…" / "Subiendo…" se quedan colgados. El owner lleva
horas bloqueado y NO ha podido crear ni un inmueble desde el panel.

## Lo que YA está DESCARTADO (no perder tiempo aquí)

1. **NO es sesión zombi / token caducado local.** Reproducido en una ventana
   **incógnito** con login totalmente fresco → mismo 401. El token es nuevo y
   válido.
2. **NO es `navigator.locks`.** Ese lock ya está desactivado en
   `src/lib/supabase.ts:21` (`lock: async (_n,_t,fn) => fn()`).
3. **NO es la RLS de `agents`.** La política `agents_select_own` es
   `USING (user_id = auth.uid())` para el rol `authenticated`: un agente con
   token válido SÍ puede leer su propia fila. El owner
   (`creativedesignseo@gmail.com`, user_id `190dcf0c-7176-40f9-a333-c089975828c8`)
   tiene fila en `public.agents` con `role='admin'`, `is_active=true`.
4. **NO es el bug del 400 al guardar** (ese era `neighborhood_id` slug→uuid, ya
   arreglado y desplegado, commit `701f8821`).

## Lo que SÍ está confirmado

- La función devuelve 401 **solo** desde `isActiveAgent()` en
  `netlify/functions/translate-property.js` (líneas ~58-83, 132-134).
  `isActiveAgent` hace DOS fetch con el token del usuario:
  1. `GET ${SUPABASE_URL}/auth/v1/user` (apikey = anon). Si no es `ok` → false.
  2. `GET ${SUPABASE_URL}/rest/v1/agents?user_id=eq.<uid>&is_active=eq.true&select=id`.
     Si no es `ok` o array vacío → false.
- Curl a la función SIN token → 401 (correcto, es el portón de auth).
- En Netlify NO existen `SUPABASE_URL`/`SUPABASE_ANON_KEY`; existen
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (scope All) y
  `DEEPSEEK_API_KEY`. La función lee `SUPABASE_URL || VITE_SUPABASE_URL` y
  `SUPABASE_ANON_KEY || VITE_SUPABASE_ANON_KEY`, así que el fallback debería
  resolver. **VERIFICAR que el fallback realmente coge la VITE_ en runtime** y
  que el valor de `VITE_SUPABASE_ANON_KEY` en Netlify pertenece al MISMO
  proyecto (`slxlkbrqcjabsfuhlwdf`) que usa el frontend — un anon key de otro
  proyecto haría que `/auth/v1/user` rechace el JWT.

## Hipótesis a probar (en orden de probabilidad)

1. **El token NO le llega a la función o `/auth/v1/user` lo rechaza.** Replica
   las 2 llamadas de `isActiveAgent` con un token REAL y mira cuál falla y con
   qué body. Añade logging temporal en la función (`console.log` del status de
   cada fetch + el body de error) y revisa los logs de la función en Netlify
   (`netlify functions:log translate-property` o el dashboard).
2. **Mismatch de proyecto/clave** entre el anon key del frontend (baked en
   build) y el `VITE_SUPABASE_ANON_KEY` runtime de la función.
3. **`translation.service.ts`** (`src/services/translation.service.ts`) adjunta
   el token vía `supabase.auth.getSession()` con un `Promise.race` a 6s; si la
   sesión tarda, manda la petición SIN `Authorization`. Verifica que en el flujo
   real el header `Authorization: Bearer <token>` se está enviando (pestaña
   Network → request headers).

## Cómo verificar SIN romper nada (regla crítica)

- ⛔ **NUNCA hagas login/logout con la cuenta del owner**
  (`creativedesignseo@gmail.com`). Un `signOut` global revoca su sesión
  server-side y lo deja en estado zombi (ya pasó, ver HANDOFF). 
- ✅ Crea un **agente de prueba dedicado** y úsalo para todo:
  1. Con la `service_role` key (NO está en `.env.local`; pídela al owner o
     cógela de Netlify env si la pone), crea un usuario:
     `POST ${SUPABASE_URL}/auth/v1/admin/users` con
     `{ email, password, email_confirm: true }`.
  2. El trigger `on_auth_user_created` (migración 005) auto-inserta su fila en
     `agents` con `is_active=false`. **Actívalo:**
     `UPDATE public.agents SET is_active=true, role='agent' WHERE user_id=<uid>`.
  3. Mintea token: `POST ${SUPABASE_URL}/auth/v1/token?grant_type=password`
     (header `apikey: <anon>`) con `{ email, password }` → `access_token`.
  4. Replica `isActiveAgent`: `GET /auth/v1/user` y el `GET /rest/v1/agents?...`
     con ese `access_token`. Luego llama a la función con
     `Authorization: Bearer <access_token>`. Esto AÍSLA dónde está el 401.
- Para inspeccionar la BD sin tocar sesiones: Supabase Management API con el PAT
  `SUPABASE_ACCESS_TOKEN` de `.env.local` →
  `POST https://api.supabase.com/v1/projects/slxlkbrqcjabsfuhlwdf/database/query`.

## Archivos clave

- `netlify/functions/translate-property.js` — la función y su `isActiveAgent()`.
- `src/services/translation.service.ts` — cliente que adjunta el Bearer y
  auto-cura en 401.
- `src/lib/supabase.ts` — config del cliente (lock desactivado).
- `src/hooks/useAuth.tsx` + `src/services/auth.service.ts` — sesión/validación.

## Verificación y reglas del repo

- `bash scripts/verify.sh` antes de cualquier commit. No commitear en rojo.
- Migraciones: `npm run migrate -- <archivo>` (Management API + PAT). NO pegar
  a mano en Studio.
- Netlify auto-deploya `main`. NO desplegar manualmente sin OK del owner.
- Al cerrar, actualiza `HANDOFF_REPORT.md` + `tasks/current.md`.

## Solución pragmática si urge desbloquear (decisión del owner)

Si hay que entrar YA y la causa sigue esquiva: suavizar el portón de
`isActiveAgent` para que acepte cualquier sesión con `/auth/v1/user` = 200
(sin exigir la fila en `agents`), o devolver el motivo exacto del 401 en el
body para diagnóstico. Trade-off: relaja la protección anti-abuso de la cuota
de pago de DeepSeek. Confirmar con el owner antes de tocar la seguridad.
