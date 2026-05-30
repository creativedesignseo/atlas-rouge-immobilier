# HANDOFF.md — Atlas Rouge Immobilier

> Documento de transferencia conciso para retomar el proyecto en otra sesión.
> **Última actualización:** 2026-05-30
> **Último commit en `main`:** `cbb235fa` (i18n admin + amenities, **desplegado**
> — ver §1ter). Antes: `70af4956` Mapbox (§1bis). ⚠️ El trabajo de **Phase 0**
> sigue en el working tree **sin commitear y sin deploy** (ver §1); requiere SQL
> 006 + env vars Supabase (non-VITE) en Netlify antes de publicarse, o rompería
> `translate-property`. El **batch de traducción de contenido** de inmuebles
> espera la `service_role` key (ver §1ter).
> Para el **historial cronológico detallado** ver `HANDOFF_REPORT.md`.
> Para el **contexto completo** ver `PROJECT_CONTEXT.md`. Tareas en `TODO.md`.

---

## 1ter. i18n panel admin + amenities (2026-05-30) — ✅ DESPLEGADO Y VERIFICADO

- El formulario de admin tenía labels en francés hardcodeados y las **amenities**
  se mostraban en francés crudo en TODA la web (admin + público) porque
  `amenities.json` estaba vacío. Resuelto: commits `7a671e34` + `cbb235fa`.
- Ahora: `PropertyForm` y `AdminLogin` 100% i18n; nuevo helper
  `src/lib/amenities.ts` + `amenities.json` poblado (16 amenities reales);
  `PropertyForm` también **auto-traduce al guardar** si faltan ES/EN.
- Verificado en prod (Playwright): admin form y `/es/comprar` 100% en castellano.
- ⏳ **Pendiente**: el **contenido** de los inmuebles (títulos/descr/highlights)
  sigue en francés. Se traduce con el batch IA
  (`scripts/translate-existing-properties.mjs`, listo pero sin commitear), que
  necesita `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (el login admin no puede
  escribir por RLS). Con la key → `npm run translate:properties`.

## 1bis. Migración de mapas a Mapbox (2026-05-30) — ✅ DESPLEGADO Y VERIFICADO

- El motor de mapas se migró de **MapLibre GL → Mapbox GL JS v3** (estilo
  **Standard, 2D plano**) en `Search.tsx` (MapView) y `LocationMap.tsx`, vía
  nuevo `src/lib/mapbox.ts`. **Commit `70af4956`, desplegado en
  https://atlasrouge.com** (deploy Netlify OK, 40s).
- ✅ **Verificado en vivo**: tiles `api.mapbox.com` → HTTP 200, 0 errores de
  consola, basemap Mapbox Standard renderiza con los pines. El token
  `atlasrouge v2` está restringido a `atlasrouge.com` (correcto); por eso en
  localhost daba 403 (no era tarjeta — hipótesis errónea descartada).
- `VITE_MAPBOX_TOKEN` está en Netlify env (all contexts), NO en el repo. CSP de
  `netlify.toml` ampliada para Mapbox (connect-src + worker-src blob).
- Pendiente menor (no bloquea): para dev local, owner añade `localhost` a las
  URLs del token (o usa Default public token) + `VITE_MAPBOX_TOKEN` en
  `.env.local`. Detalle: `progress/2026-05-30-mapbox-migration.md`.

---

## 1. Estado actual (resumen)

- Sitio **LIVE** en producción: `https://atlasrouge.com` (Netlify).
- `origin/main`, último commit `34af320b`. `verify.sh` verde.
- Build OK (React 19 + Vite 7). Lint limpio (3 warnings cosméticos).
- **Phase 0 (stop-the-bleed) IMPLEMENTADA el 2026-05-29** — código escrito y
  `verify.sh` verde, pero ⚠️ **el SQL NO está aplicado en Supabase Studio y
  NO se ha hecho deploy**. Son fixes **implementados, pendientes de aplicar
  SQL + deploy**, NO resueltos en producción. Cubre: P0-1 escalada de
  privilegios (migración `006`), P0-4 SEO canonical/hreflang + sitemap
  dinámico, P0-5 drift de migraciones (`000_base_schema.sql`), cierre de
  funciones serverless (auth JWT + CORS) y Error Boundary global. Detalle en
  `progress/2026-05-29-phase0-security-seo.md`.
- Se ejecutó una **auditoría de production-readiness de 13 agentes**
  (`AUDIT_REPORT.md`): score 22/100, 7 P0 — 2 resueltos (i18n, 2026-05-26),
  3 de ingeniería implementados (pendientes apply/deploy), 2 legales abiertos.

## 2. Qué estábamos haciendo antes de cambiar de chat

Sesión del 2026-05-29: **implementación de la Phase 0** (seguridad + SEO)
descrita en §1, dejada en el working tree pendiente de que el owner aplique
el SQL `006` en Studio, verifique las env vars de Netlify y apruebe el commit
+ push. La sesión anterior (2026-05-26) cerró auditoría + migración i18n +
harness + paquete de transferencia de contexto.

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

**P0 de ingeniería — IMPLEMENTADOS 2026-05-29 (pendientes aplicar SQL + deploy,
NO resueltos en producción):**
- 🟡 **Escalada de privilegios** (SEC-001/DB-001/ADM-001): fix escrito en
  migración `006_fix_agent_update_rls.sql` (`WITH CHECK` que congela
  `role`/`is_active` + `search_path` en helpers, cubre DB-005) y `updateAgent()`
  estrechado a `AgentSelfUpdate`. **⚠️ El SQL 006 todavía NO está pegado en
  Studio** → en producción el agujero sigue abierto hasta aplicarlo.
- 🟡 **Canonical/hreflang estáticos** (PERF-001): `og-rewrite.ts` ahora los
  reescribe por ruta en `/fr/* /es/* /en/*`; sitemap dinámico vía
  `scripts/generate-sitemap.mjs` + `prebuild` (cubre PERF-002). **⚠️ No
  desplegado.**
- 🟡 **Drift de migraciones** (DB-002): `000_base_schema.sql` idempotente. **⚠️
  No re-aplicar sobre prod.**
- 🟡 **Funciones serverless abiertas** (SEC-002/003): `translate-property`
  exige sesión de agente activo (JWT) + CORS allowlist + rate-limit;
  `notify-lead` CORS + origin check. **⚠️ No desplegado; necesita env vars en
  Netlify.**
- 🟡 **Sin Error Boundary** (ARCH-002): `ErrorBoundary.tsx` montado en
  `main.tsx`. **⚠️ No desplegado.**

**P0 legales — abiertos (owner + abogado):**
- 🛑 **Sin Política de Privacidad ni Mentions Légales** (LEGAL-001/002):
  bloqueante para audiencia UE/Francia. Requiere abogado + datos de Khalid.

**Altos (P1) que siguen abiertos:**
- **Leads sin UI en el admin** (ADM-003) — estimaciones/newsletter invisibles.
- Sin tests (QA-001), sin scripts typecheck/test.
- **DB-003 (RLS duplicadas de leads): NO aplica** — `004_leads.sql` ya define
  las policies limpias; no hay duplicado que limpiar.

## 5. Próximos pasos recomendados (en orden)

1. **Cerrar Phase 0 (boundaries del owner):**
   a. Aplicar `006_fix_agent_update_rls.sql` en Supabase Studio y **verificar
      que un agente no-admin NO puede auto-promoverse** (`update({role:'admin'})`
      desde DevTools debe ser rechazado).
   b. Verificar env vars en Netlify: build/sitemap necesita
      `SUPABASE_URL`/`SUPABASE_ANON_KEY` (o service key); las funciones
      necesitan `SUPABASE_URL`/`SUPABASE_ANON_KEY` para validar el JWT.
   c. Aprobar **commit + push** del working tree (Netlify auto-deploya `main`).
   Solo tras esto los P0-1/P0-4/P0-5 quedan cerrados en producción.
2. En paralelo (owner + abogado): páginas legales (P0-2/P0-3), `site_settings`
   reales, foto/bio Sofia, planes Pro. Ver TODO.md.
3. P1 de ingeniería: UI de leads en el admin (ADM-003), scripts
   `typecheck`/`test` en `package.json`.

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
