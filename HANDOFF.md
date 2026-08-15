# HANDOFF.md — Atlas Rouge Immobilier

> **Este es EL handoff.** Léelo entero al empezar una sesión: cabe en un vistazo.
> El historial largo vive en `HANDOFF_REPORT.md` (archivo append-only, **no lo
> leas entero** — busca dentro con grep). Las tareas vivas, en `tasks/current.md`.
>
> **Actualizado:** 2026-08-15 · **`main` = `2fb517bc`** (HEAD == origin, limpio)

---

## 1. Qué es

Web trilingüe (FR/ES/EN) de una inmobiliaria de lujo en Marrakech, dirigida a
inversores europeos (sobre todo franceses). Es **captación de leads**, no
e-commerce: no hay pagos. Cliente final: **Khalid** (Francia).

Stack: React 19 · Vite 7 · TypeScript strict · Tailwind · Supabase (Auth + RLS +
Storage + Postgres) · i18next · GSAP · Mapbox GL · TipTap · Netlify.

---

## 2. Estado ahora mismo

### 🔴 EL DOMINIO ESTÁ CAÍDO (incidente abierto, 2026-08-12)

**El código y el hosting están perfectos.** `atlas-rouge-immobilier.netlify.app`
responde 200 y sirve la web completa. Lo que falla es la delegación del dominio.

| Capa | Estado |
|---|---|
| Netlify | ✅ sirve bien |
| Cloudflare (zona `atlasrouge.com`) | ✅ registros correctos, sin tocar desde 25/05 |
| **Namecheap → registro** | ❌ **no delega a Cloudflare** |

Al actualizar el contacto del titular (12/08, 12:21 UTC) Namecheap reseteó los
nameservers. El panel muestra `Custom DNS` con los de Cloudflare, pero el
registro público sigue diciendo `dns101/dns102.registrar-servers.com`, que
sirven un lander de aparcamiento. **El cambio nunca llegó al registro.**

- Síntoma: HTTPS falla entero (curl `000`, el handshake TLS ni se completa);
  HTTP devuelve 200 con la página de aparcamiento.
- Descartado: no es caducidad (expira 25/05/2027), no es suspensión de ICANN
  (whois solo muestra `clientTransferProhibited`, no hay `clientHold`), y no hay
  ningún correo de verificación pendiente.
- **Acción del owner:** en Namecheap, alternar a *Namecheap BasicDNS*, guardar,
  volver a *Custom DNS* con `dahlia.ns.cloudflare.com` y `kurt.ns.cloudflare.com`,
  guardar. Si a los 30 min el whois no cambia → chat en vivo de Namecheap.
- **Mientras tanto:** si hay campañas de Ads activas, **pararlas** — cada clic se
  paga contra una página de aparcamiento.
- Detalle completo en la memoria del proyecto (`project_dns_atlasrouge`).

### 🔴 Contraseña de admin expuesta en un repo PÚBLICO

`github.com/creativedesignseo/atlas-rouge-immobilier` es **público** y el
`HANDOFF.md` anterior contenía la contraseña del panel de producción en texto
plano, presente desde el commit `34af320b`. Redactada del working tree el
2026-08-15, **pero sigue en el historial de git, que es público.**

**Rotar la contraseña es la única mitigación real.** Reescribir el historial no
sirve: pudo ser clonado, forkeado o indexado. Ver §6.

*(Escaneado el resto del repo: las claves JWT que aparecen son todas
`role: anon` — públicas por diseño, viajan en el bundle del navegador. No hay
`service_role` filtrada. `.env*` no está trackeado.)*

### 🟢 Lo que sí funciona

- Web trilingüe completa, blog, buscador con mapa Mapbox, panel de admin.
- **Centro de leads / CRM** (`/admin/contacts`): embudo por fases, kanban con
  drag & drop en escritorio y selector «Mover a etapa» en móvil, ficha lateral
  con etapa, prioridad, asignación, seguimiento, notas e historial. Tarjetas en
  acordeón. Acciones de llamar / WhatsApp / copiar.
- **Dos landings de captación** (`/vendre/`, `/proprietaires/`) con selector de
  teléfono internacional (intl-tel-input, detección por IP, validación E.164) y
  botón final a WhatsApp. Confirmado con tráfico real: un lead entró y guardó su
  número en formato internacional.
- Formularios públicos escriben vía `supabasePublic` (ver ADR-002).

---

## 3. Qué bloquea de verdad (por orden)

| # | Qué | De quién depende |
|---|---|---|
| 1 | **Restaurar la delegación DNS** | Owner (Namecheap) |
| 2 | **Rotar la contraseña de admin** | Owner |
| 3 | **Canal de aviso de leads** — `notify-lead` responde `ok:true` pero avisa `skipped: no RESEND_API_KEY` / `no TELEGRAM env`. Código desplegado, faltan las variables. Decidir Telegram o email. | Owner (decisión) |
| 4 | **Las 10 URLs finales de los anuncios** en Google Ads — hay que editarlas una a una (la edición masiva pone la misma en todas). Bloquea activar campañas. | Owner |
| 5 | **Páginas legales** (Privacidad / Mentions Légales) — bloqueante para audiencia UE. | Owner + abogado |
| 6 | **Tipografías Lazzer** (5 `.woff` en `public/vendre/fonts/`) — comerciales, publicadas y en vivo. Riesgo de licencia abierto. Borrarlas necesita OK explícito. | Owner |

---

## 4. Trampas conocidas (te ahorran horas)

- **`supabase-js` se CUELGA (no falla) en rutas acopladas a auth.** Las lecturas
  públicas van por `supabasePublic`; el cliente con sesión refresca el token
  antes de cada petición y bloquea la primera carga del usuario logueado.
  Comprobación: `grep -rn "supabase\.from" src/services` fuera de
  `src/services/admin/` debe salir vacío. Ver `ADR-002`.
- Para operaciones de admin autenticadas, usa REST directo (`src/lib/adminRest.ts`)
  con token explícito y `AbortController`.
- **Netlify devuelve 200 con el shell de la SPA para CUALQUIER ruta inexistente.**
  Un 200 no prueba que un archivo exista — comprueba el contenido.
- **`countLabel` no existe como clave suelta**, solo como `countLabel_one` /
  `countLabel_other` (plurales de i18next). Buscar la desnuda da falso negativo.
- **`public/` lo copia Vite tal cual**: sin bundling, sin imports de npm. Las dos
  landings son HTML estático — sus dependencias van en `public/vendor/`.
- **Bomba de relojería:** `fetchContactSubmissions` filtra por
  `assigned_to_agent_id` para los no-admin. Como nadie rellena esa columna, el
  primer agente no-admin verá **cero leads**. Decidir la política antes de dar
  de alta a ningún agente.

---

## 5. Verificación

```bash
bash scripts/verify.sh     # lint + build
```

**`verify.sh` NO prueba comportamiento.** Ningún arreglo está verificado hasta
haber reproducido el fallo bajo la condición real y haberlo visto desaparecer
bajo esa misma condición. Verifica bajo las tres personas: visitante anónimo en
frío, **admin logueado en frío** (esta es la que escondió un fallo seis semanas)
y red lenta o bloqueada.

---

## 6. Acceso admin

- URL: `https://atlasrouge.com/admin/login`
- Cuentas: `creativedesignseo@gmail.com` (Jonatan, admin) y `admin@atlasrouge.ma` (Sofia).
- **Las contraseñas NO se guardan en este repo** — es público. Gestor de
  contraseñas del owner. Ver el incidente en §2.

---

## 7. Dónde está cada cosa

| Necesitas | Mira |
|---|---|
| Reglas de trabajo del agente | `AGENTS.md` (+ `CLAUDE.md`) |
| Tareas vivas | `tasks/current.md` |
| Historial largo | `HANDOFF_REPORT.md` (grep, no leer entero) |
| Tareas viejas cerradas | `tasks/archive-2026-08.md`, `progress/` |
| Informe para el cliente | `docs/BITACORA.md` + skill `/reporte` |
| Decisiones arquitectónicas | `docs/decisions/ADR-*.md` |
| Soporte / incidencias | `docs/runbooks/*.md` |
| Auditoría de producción | `AUDIT_REPORT.md` |

⚠️ `PROJECT_HANDBOOK.md`, `README.md` e `info.md` están **desactualizados**
(hablan de una URL de Netlify y de un "sitio francés"). No son fuente de verdad.
