# Runbook: "No puedo entrar al admin"

**Versión:** 2026-05-26
**Severity habitual:** P1 (un admin sin acceso bloquea operaciones)
**Tiempo medio de resolución:** 5–10 min con este runbook
**Audiencia:** agentes de soporte (humanos o IA), owner del sitio,
desarrolladores que vuelven al proyecto tras un gap.

---

## Cómo usar este runbook

Si eres un **agente de soporte (humano o IA)** y un cliente reporta
que no puede entrar al admin, **NO empieces a tocar nada**. Recorre
las preguntas del árbol de decisión en orden. La mayoría de incidentes
se resuelven en los primeros 2 pasos.

Si eres una **IA atendiendo al cliente**, transcribe literalmente las
preguntas de cada paso al cliente, recoge la respuesta, y solo pasa al
siguiente cuando tengas la información del paso actual. No saltes
pasos aunque "creas" saber el problema.

---

## Síntomas que cubre este runbook

- "No puedo entrar al panel admin"
- "Me dice que las credenciales son incorrectas y estoy seguro de
  que mi password está bien"
- "Hago reset password, cambio la clave, pero sigue diciendo que es
  incorrecta"
- "El formulario de reset se queda cargando para siempre"
- "Cambié la contraseña y ahora ya no puedo entrar con la nueva"
- "Recibí un email de invitación, hice click, pero no me deja entrar"

---

## Árbol de decisión

### Paso 1 — Confirma que el usuario está en `auth.users`

**Acción (admin con Service Role Key):**

```bash
SUPABASE_URL="https://slxlkbrqcjabsfuhlwdf.supabase.co"
SERVICE_KEY="<service_role_key del owner>"  # ver HANDOFF_REPORT.md
EMAIL_DEL_CLIENTE="…"

curl -sS "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  | python3 -c "import sys,json; [print(u) for u in json.load(sys.stdin)['users'] if u['email']=='$EMAIL_DEL_CLIENTE']"
```

**Resultado posible A — no existe:**

→ El usuario nunca fue invitado o el email está mal escrito. Acción:
crear el usuario siguiendo el procedimiento de ADR-001 sección "Cómo
activar un usuario invitado".

**Resultado posible B — existe:**

→ Apunta el `id` del usuario y pasa al **Paso 2**. Mira también
`last_sign_in_at`: si está poblado, el usuario YA ha logueado bien
alguna vez (no es problema de credenciales).

### Paso 2 — Verifica el password contra la API de Supabase

Antes de creer al cliente que "el password está bien" o que "no
funciona", **pruébalo tú mismo contra la API directamente** (esto
salta toda la lógica del frontend):

```bash
ANON_KEY="<VITE_SUPABASE_ANON_KEY de Netlify>"  # public, no peligrosa

curl -sS -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_DEL_CLIENTE\",\"password\":\"<password que dice el cliente>\"}" \
  -w "\nHTTP:%{http_code}\n"
```

**Resultado A — HTTP 200 + access_token devuelto:**

→ El password **está bien**. El problema NO es de credenciales.
Pasa al **Paso 3**.

**Resultado B — HTTP 400 con `"error":"invalid_credentials"`:**

→ El password está realmente mal. Resetea via Admin API a un valor
conocido:

```bash
USER_ID="<id del paso 1>"
NEW_PASS="ResetTemporal2026!"

curl -sS -X PUT "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$NEW_PASS\"}"
```

Comunica al cliente la nueva password y pídele que la cambie por una
suya desde `/admin/profile` una vez dentro.

### Paso 3 — Verifica fila en `public.agents`

**Este es el bug del orphan-user que rompió la sesión del owner el
2026-05-26.** Si llegas aquí, es porque el password está bien pero el
frontend rechaza el login → casi seguro el usuario no tiene perfil
de agente.

```bash
curl -sS "$SUPABASE_URL/rest/v1/agents?user_id=eq.$USER_ID&select=*" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"
```

**Resultado A — array vacío `[]`:**

→ **Usuario huérfano.** Crea la fila:

```bash
curl -sS -X POST "$SUPABASE_URL/rest/v1/agents" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"email\": \"$EMAIL_DEL_CLIENTE\",
    \"name\": \"<nombre que indique el owner>\",
    \"role\": \"admin\",
    \"is_active\": true
  }"
```

⚠️ **Si la migración 005 ya está aplicada, este caso no debería
ocurrir.** Si lo ves, verifica que el trigger esté activo:

```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Si devuelve 0 filas o `tgenabled != 'O'`, el trigger se desactivó →
reaplicar migración 005.

**Resultado B — fila existe con `is_active = false`:**

→ Usuario provisionado pero **no activado**. Comportamiento esperado
si lo crearon vía Dashboard tras migración 005. Activa:

```bash
curl -sS -X PATCH "$SUPABASE_URL/rest/v1/agents?user_id=eq.$USER_ID" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true, "role": "admin"}'
```

**Resultado C — fila existe, `is_active = true`, `role = admin`:**

→ El usuario está correctamente provisionado. Pasa al **Paso 4**.

### Paso 4 — Verifica que el frontend no esté cacheando estado viejo

Pide al cliente:

1. Abrir DevTools (Cmd+Option+I / F12)
2. Application → Storage → **Clear site data**
3. Cerrar todas las pestañas de `atlasrouge.com`
4. Abrir una ventana **incógnita** (Cmd+Shift+N / Ctrl+Shift+N)
5. Ir a `https://atlasrouge.com/admin/login`
6. Login fresh

Si entra en incógnita → era caché/localStorage corrupto. El cliente
puede limpiar su navegador normal.

Si NO entra en incógnita → **bug nuevo, escalar**. Recoge:

- Screenshot del error
- Screenshot de DevTools → Console (errores en rojo)
- Screenshot de DevTools → Network → la petición a `/auth/v1/token`
  o `/rest/v1/agents` con su Status, Response y Timing

Reporta a desarrollo con esos artifacts.

---

## Síntoma específico: "El formulario de reset se queda en Guardando…"

Este era el bug del SDK de Supabase `auth-js` durante recovery
sessions. **Ya está arreglado en commit `b21781d6`** (Carrera entre
evento `USER_UPDATED` y la promesa de `updateUser`).

Si reaparece, el password probablemente SÍ se cambió aunque la UI no
lo confirme. Verifica:

```bash
curl -sS "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('updated_at:', d['updated_at'])"
```

Si `updated_at` está muy reciente (segundos atrás), el password se
cambió. Dile al cliente que pruebe a entrar con la nueva password en
una pestaña incógnita.

---

## Síntoma específico: "Recibí el link del email pero no me deja"

El link de recovery de Supabase tiene un TTL (1 hora por defecto). Si
el cliente abrió un link viejo o ya consumido, no funcionará. Acción:

1. Pídele que pida un **nuevo** reset password
2. **Que abra el link más reciente** (los anteriores quedan
   invalidados al pedir uno nuevo)
3. Click el link → pantalla "Nueva contraseña" → mete password →
   Guardar (debería resolver en <2s)

Si después de cambiar password ve "Tu cuenta existe pero no tiene
perfil de administrador", pasa al **Paso 3** de arriba.

---

## Glosario

| Término | Qué es |
|---|---|
| `auth.users` | Tabla interna de Supabase Auth. Credenciales. |
| `public.agents` | Tabla de negocio. Quién es admin activo. |
| Usuario huérfano | Existe en `auth.users` pero no en `agents`. |
| Recovery session | Session especial de Supabase Auth durante reset password. Tiene un access_token de tipo "recovery" con scope limitado. |
| Service Role Key | API key con permisos totales sobre la BD. **NUNCA exponer al frontend.** Vive en `.env.local` del dev o en Netlify env vars. |
| Anon Key | API key pública. Va embebida en el bundle. RLS la protege. |
| Trigger 005 | El que auto-crea filas en `agents` cuando se inserta en `auth.users`. Aplicado el 2026-05-26. |

---

## Trampa común: error "violates RLS policy" en INSERT que SÍ debería estar permitido

Si al hacer `POST /rest/v1/<tabla>` con la anon key obtienes:

```json
{"code":"42501","message":"new row violates row-level security policy for table \"X\""}
```

y verificas que la INSERT policy es PERMISSIVE con `with_check = true` para
`anon` — **el problema casi seguro es `Prefer: return=representation`** en
la petición.

Cuando pides que la API devuelva la fila insertada, Postgres también evalúa
las SELECT policies sobre la fila recién creada. Si las SELECT policies
sólo permiten a `authenticated` (caso de `estimation_requests` y
`newsletter_subscribers`), la lectura falla y todo el INSERT se reporta
como RLS violation. Soluciones:

- Para pruebas con `curl`: omite `Prefer: return=representation`.
- Para código frontend: usa `.insert(...)` SIN `.select()` encadenado.
- Si necesitas el ID devuelto al cliente, expón un RPC con
  `SECURITY DEFINER` que haga el insert y devuelva solo el ID.

Diagnóstico el 2026-05-26 durante el rollout de migración 004.

---

## Última auditoría de este runbook

**Fecha:** 2026-05-26
**Por:** Claude + Jonatan
**Estado:** ✅ Cubre el incidente del owner del 2026-05-26 al 100%.
Cubre además la trampa RLS+RETURNING descubierta al rolear leads.
Pendiente de validar contra futuros tickets.
