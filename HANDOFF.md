# HANDOFF.md — Atlas Rouge Immobilier

> Documento de transferencia conciso para retomar el proyecto en otra sesión.
> **Última actualización:** 2026-05-26
> Para el **historial cronológico detallado** ver `HANDOFF_REPORT.md`.
> Para el **contexto completo** ver `PROJECT_CONTEXT.md`. Tareas en `TODO.md`.

---

## 1. Estado actual (resumen)

- Sitio **LIVE** en producción: `https://atlasrouge.com` (Netlify).
- `origin/main` **sincronizado**, último commit `205bb1e3`. `verify.sh` verde.
- Build OK (React 19 + Vite 7). Lint limpio (3 warnings cosméticos).
- Se ejecutó una **auditoría de production-readiness de 13 agentes**
  (`AUDIT_REPORT.md`): score 22/100, 7 P0 — **2 ya resueltos**, 5 abiertos.

## 2. Qué estábamos haciendo antes de cambiar de chat

Sesión larga del 2026-05-26 con muchos frentes cerrados (ver §3). Lo último
fue: **auditoría completa + migración i18n de 3 páginas** y el **cierre del
harness**. El usuario quería preparar el paquete de transferencia de contexto
(este archivo + CLAUDE.md + PROJECT_CONTEXT.md + TODO.md).

## 3. Últimos cambios importantes (commits de hoy)

| Commit | Qué |
|---|---|
| `205bb1e3` | Cierre harness (tasks/HANDOFF/progress sync) |
| `8987f624` | `AUDIT_REPORT.md` (auditoría 13 agentes) |
| `593e47ae` | **i18n** de About/GestionLocative/BuyerGuide (218 claves FR/ES/EN) |
| `d4d23788` | Leads pipeline verificado (RLS anon INSERT) |
| `efef427b` `f40cedff` | Migración 005 (trigger orphan-user) aplicada+verificada |
| `c352f646` | Fix gap auth.users↔agents (3 mensajes de error distintos) |
| `b21781d6` `3a4fcd77` | Fixes de auth (withTimeout + race USER_UPDATED) |
| `c9ef0c4f` | Harness de ingeniería instalado |
| `b6b112d1` | Cierre rotación DEEPSEEK key |

## 4. Problemas abiertos / bugs conocidos

**Críticos (P0) — ver AUDIT_REPORT.md para detalle + fixes:**
- 🛑 **Escalada de privilegios** (SEC-001/DB-001/ADM-001): la RLS
  `"Agent can update own row"` no tiene `WITH CHECK` → cualquier agente puede
  `update({role:'admin'})` desde DevTools. **SQL de fix listo** en AUDIT_REPORT
  § P0-1. Es lo más urgente.
- 🛑 **Sin Política de Privacidad ni Mentions Légales** (LEGAL-001/002):
  bloqueante para audiencia UE/Francia. Requiere abogado + datos de Khalid.
- 🛑 **Canonical/hreflang estáticos** (PERF-001): toda página interna declara
  el canonical de la home → riesgo de colapso SEO.
- 🛑 **Drift de migraciones** (DB-002): tablas base solo en `schema.sql`, no en
  migraciones numeradas → BD no reproducible.

**Altos (P1):**
- Funciones serverless `notify-lead` y `translate-property` **abiertas sin auth**
  (SEC-002/003); `translate-property` quema cuota DeepSeek.
- **Sitemap dinámico nunca llegó a `main`** (PERF-002) — el de producción está
  obsoleto (dominio `.netlify.app`).
- **Policies RLS de leads DUPLICADAS** (DB-003) — limpiar con migración 006.
- **Leads sin UI en el admin** (ADM-003) — estimaciones/newsletter invisibles.
- Sin tests (QA-001), sin Error Boundary (ARCH-002), sin scripts typecheck/test.

## 5. Próximos pasos recomendados (en orden)

1. **P0-1 escalada de privilegios** — aplicar el SQL de AUDIT_REPORT § P0-1 en
   Supabase Studio (~30 min). Es un agujero de seguridad real.
2. **Migración 006** para limpiar las policies RLS duplicadas (DB-003) +
   `search_path` en helpers (DB-005).
3. **Canonical/hreflang dinámicos** (PERF-001) + **merge sitemap a main** (PERF-002).
4. **`000_base_schema.sql`** para reproducibilidad (DB-002).
5. **Cerrar funciones serverless** (auth + CORS) (SEC-002/003).
6. En paralelo (owner): páginas legales con abogado, `site_settings` reales,
   foto/bio Sofia, planes Pro. Ver TODO.md.

## 6. Archivos que la próxima sesión debe revisar primero

1. `CLAUDE.md` — reglas + comandos + qué leer.
2. `PROJECT_CONTEXT.md` — arquitectura, env vars, decisiones.
3. `TODO.md` — tareas priorizadas con estado.
4. `AUDIT_REPORT.md` — los 7 P0 con fixes y SQL listo.
5. Para tocar auth/RLS: `supabase/migrations/001_agents.sql`,
   `src/services/auth.service.ts`, `docs/decisions/ADR-001-auth-agents-coupling.md`.

## 7. Preguntas / decisiones pendientes de confirmar

- **[Khalid]** Datos reales para `site_settings`: teléfono, WhatsApp, email
  (¿creamos `contact@atlasrouge.com`?), dirección física, horarios, redes,
  RC/ICE. (Se le envió un cuestionario por WhatsApp; pendiente de respuesta.)
- **[Editorial]** En la traducción, "pensé pour les Français" se adaptó a
  "compradores internacionales" en ES/EN. **Confirmar** si Khalid prefiere
  mantener el enfoque France-specific.
- **[Producto]** ¿Activar GA/GTM? El CSP ya lo permite pero no está cargado;
  si se activa, debe ser tras consentimiento (RGPD).
- **[Pendiente de confirmar]** ¿Khalid ya configuró la Supabase Site URL? (se
  le dieron instrucciones; verificar en Dashboard).

## 8. Acceso admin (para pruebas)

- URL: `https://atlasrouge.com/admin/login`
- Email: `creativedesignseo@gmail.com` · Password: `Marru.2025`
  (Jonatan; provisionado como `admin` activo en la tabla `agents`).
- Segundo admin existente: `admin@atlasrouge.ma` (Sofia).
