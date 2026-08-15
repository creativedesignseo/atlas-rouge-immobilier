# tasks/current.md — cola activa de Atlas Rouge

> **Solo lo vivo.** Cuando algo se cierra, sale de aquí: al `HANDOFF_REPORT.md`
> si cambia lo que funciona en producción, o a `progress/` si fue multi-paso.
> Lo cerrado hasta el 2026-08-15 está en `tasks/archive-2026-08.md`.
>
> **Regla de tamaño: este archivo no debe pasar de ~120 líneas.** Si crece, es
> que hay que archivar.
>
> **Actualizado:** 2026-08-15 · `main` = `2fb517bc`

---

## 🔴 Dominio caído — delegación DNS rota (2026-08-12, ABIERTO)

`atlasrouge.com` no resuelve a Netlify. Netlify y Cloudflare están bien; el
registro no delega a Cloudflare. Diagnóstico completo en `HANDOFF.md` §2.

**Owner:** en Namecheap alternar a BasicDNS → guardar → volver a Custom DNS con
`dahlia.ns.cloudflare.com` + `kurt.ns.cloudflare.com` → guardar. Si a los 30 min
el whois no cambia, chat en vivo de Namecheap.

**Comprobar:** `dig +short NS atlasrouge.com` debe devolver los de Cloudflare.

Mientras siga caído: parar las campañas de Ads que estén activas.

## 🔴 Rotar la contraseña de admin (2026-08-15, ABIERTO)

El repo es **público** y la contraseña de producción estuvo en `HANDOFF.md`
desde `34af320b`. Redactada del working tree, pero el historial público la
conserva. Rotarla es la única mitigación real.

Tras rotarla: no volver a escribirla en ningún archivo del repo.

## 🔴 Canal de aviso de leads — falta decidir (owner)

`notify-lead` se ejecuta y devuelve `ok:true`, pero reporta
`skipped: no RESEND_API_KEY` y `skipped: no TELEGRAM env`. El código está
desplegado; solo faltan las variables en Netlify.

**Decisión del owner:** ¿Telegram o email? Es la mejor relación valor/esfuerzo
pendiente — hoy los leads entran y nadie se entera.

## 🔴 Las 10 URLs finales de los anuncios (owner)

Bloquea activar las campañas. Hay que editarlas **una a una**: la edición masiva
aplica la misma URL a todos los grupos. Tabla de URLs correctas por grupo en
`tasks/archive-2026-08.md`.

## 🔴 Páginas legales — Privacidad y Mentions Légales (owner + abogado)

Bloqueante para audiencia UE/Francia. Requiere datos reales de Khalid.

## 🔴 Tipografías Lazzer — requiere OK explícito del owner

5 archivos `.woff` comerciales en `public/vendre/fonts/`, trackeados y en vivo.
Riesgo de licencia abierto. **Borrarlos es destructivo: no tocar sin permiso.**

---

## 🟡 CRM fase 1 — cambiar estado y asignar agente

Es lo único que cambiaría el trabajo diario del equipo. Las columnas existen
desde el origen y las traducciones también; los leads siguen en `new` y sin
asignar. El pipeline visual ya está en vivo (`96ed65b9`); falta la parte que
mueve datos de verdad de forma sostenida.

Pendiente relacionado: recordatorios de seguimiento (hoy solo se guarda la
fecha) y UI para gestionar etapas personalizadas.

## 🟡 Verificar el CRM con sesión iniciada (owner)

Entrar al panel, mover una tarjeta, recargar y confirmar que se queda en su
fase. Desde las sesiones de agente no hay credenciales, así que el panel nunca
se ha visto autenticado desde aquí.

## 🟡 Bomba de relojería — antes de dar de alta a ningún agente

`fetchContactSubmissions` filtra por `assigned_to_agent_id` para los no-admin.
Nadie rellena esa columna → el primer agente no-admin verá **cero leads**.
Decidir la política antes de crear cuentas.

## 🟡 Mismo defecto de borrado en otras dos pantallas

`AdminProperties` y `AdminBlog` conservan el patrón de borrado lento que ya se
arregló en leads (`AdminBlog` además recarga la lista entera).

## 🟡 Abrir el panel al equipo de Marrakech — decisión pendiente

Implica exponer datos personales de ciudadanos europeos a cualquier agente
activo. Decisión del owner, con las páginas legales de por medio.

---

## Pre-existing failures conocidos

Ninguno registrado. `verify.sh` en verde al 2026-08-15.
