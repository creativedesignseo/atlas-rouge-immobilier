# TODO.md — Atlas Rouge Immobilier

> Tareas pendientes priorizadas. **Última actualización:** 2026-05-26
> Origen: auditoría de 13 agentes (`AUDIT_REPORT.md`) + acciones de owner.
> Leyenda prioridad: 🔴 alta · 🟡 media · 🟢 baja
> Leyenda estado: ⬜ pendiente · 🔄 en progreso · ⛔ bloqueada

---

## 🔴 Alta prioridad (P0 — bloquean lanzamiento serio)

### T1 · Cerrar escalada de privilegios (RLS) — ⬜ pendiente
- **Prioridad:** 🔴 alta · **Estado:** ⬜ pendiente · **Quién:** Claude (SQL listo)
- **Problema:** la policy `"Agent can update own row"` no tiene `WITH CHECK`;
  cualquier agente puede auto-promoverse a admin desde DevTools.
- **Archivos:** `supabase/migrations/001_agents.sql:158`, `supabase/schema.sql:331`,
  `src/services/auth.service.ts` (filtrar `role`/`is_active` en `updateAgent`).
- **Notas:** SQL de fix completo en `AUDIT_REPORT.md` § P0-1. Aplicar en
  Supabase Studio (la REST API no ejecuta SQL crudo). ~30 min.

### T2 · Publicar páginas legales (RGPD + LCEN) — ⛔ bloqueada
- **Prioridad:** 🔴 alta · **Estado:** ⛔ bloqueada (necesita abogado + Khalid)
- **Problema:** no existen Política de Privacidad, Mentions Légales, Términos ni
  Política de Cookies. Enlaces del footer apuntan a `#`. Bloqueante para UE/Francia.
- **Archivos:** `src/components/Footer.tsx:38-45`, crear rutas en `src/App.tsx`,
  nuevas páginas `src/pages/`, locales.
- **Notas:** requiere datos legales reales (RC/ICE marroquí) y redacción legal.

### T3 · Canonical/hreflang dinámicos por ruta (SEO) — ⬜ pendiente
- **Prioridad:** 🔴 alta · **Estado:** ⬜ pendiente · **Quién:** Claude
- **Problema:** `index.html` declara el canonical de la home en TODA página →
  Google puede colapsar el sitio. (PERF-001)
- **Archivos:** `index.html:11`, `netlify/edge-functions/og-rewrite.ts`, o añadir
  gestión de `<head>` por ruta (react-helmet-async).

### T4 · Reproducibilidad de la BD (drift de migraciones) — ⬜ pendiente
- **Prioridad:** 🔴 alta · **Estado:** ⬜ pendiente · **Quién:** Claude + owner
- **Problema:** tablas base (`properties`, `contact_submissions`, `neighborhoods`,
  `site_settings`, `favorites`) solo en `schema.sql`, no en migraciones numeradas;
  `001` hace `ALTER` asumiéndolas → reconstruir desde `migrations/` falla. (DB-002)
- **Archivos:** crear `supabase/migrations/000_base_schema.sql`; revisar/eliminar
  `schema.sql` como fuente paralela (DB-016).

---

## 🟡 Media prioridad (P1 — primer sprint post-launch)

### T5 · Cerrar funciones serverless (auth + CORS) — ⬜ pendiente
- 🟡 · ⬜ · Claude. `notify-lead.js` y `translate-property.js` sin auth, CORS `*`.
  `translate-property` quema cuota DeepSeek. (SEC-002/003)
- **Archivos:** `netlify/functions/{notify-lead,translate-property}.js`.

### T6 · Migración 006: limpiar policies RLS duplicadas + search_path — ⬜ pendiente
- 🟡 · ⬜ · Claude (SQL). `estimation_requests` y `newsletter_subscribers` tienen
  2 juegos de policies; helpers `SECURITY DEFINER` sin `search_path`. (DB-003/005)
- **Archivos:** nueva `supabase/migrations/006_*.sql`.

### T7 · Merge del sitemap dinámico a `main` — ⬜ pendiente
- 🟡 · ⬜ · Claude. El generador `generate-sitemap.mjs` + `prebuild` solo está en
  el worktree; producción tiene sitemap obsoleto. (PERF-002)
- **Archivos:** `scripts/generate-sitemap.mjs`, `package.json` (prebuild),
  config de `SITE_URL`/`SUPABASE_SERVICE_KEY` en Netlify build env.

### T8 · UI de leads en el admin — ⬜ pendiente
- 🟡 · ⬜ · Claude. Estimaciones y newsletter se capturan pero no hay pantalla.
  (ADM-003)
- **Archivos:** nuevas páginas admin + `src/services/leads.service.ts` (lectura).

### T9 · Datos reales en site_settings — ⛔ bloqueada
- 🟡 · ⛔ (espera datos de Khalid). Teléfono/WhatsApp/email/dirección/horarios/redes.
  Hoy placeholders (`+212 524 00 00 00`, `Sophie Martin`, etc.).
- **Archivos:** tabla `site_settings` (Supabase); el front ya lee de ahí en
  Contact, falta en About/Estimation/GestionLocative (UX-010).

### T10 · Scripts typecheck/test + Error Boundary + tests — ⬜ pendiente
- 🟡 · ⬜ · Claude. Añadir `"typecheck": "tsc -b --noEmit"` y `"test"` a
  package.json; Error Boundary global; primeros tests (Vitest). (TECH-001, ARCH-002, QA-001)
- **Archivos:** `package.json`, `src/App.tsx` (boundary), nuevos `*.test.ts`.

### T11 · withTimeout en servicios faltantes — ⬜ pendiente
- 🟡 · ⬜ · Claude. `settings`, `neighborhood`, `auth.getAgent` sin `withTimeout`
  → riesgo de spinner infinito en /admin. (QA-003)
- **Archivos:** `src/services/{settings,neighborhood,auth}.service.ts`.

### T12 · Cookie banner RGPD granular + geo-IP sin fuga — ⬜ pendiente
- 🟡 · ⬜ · Claude. Banner solo Accept/Reject, no bloquea nada; `geoLanguage.ts`
  envía IP a `ipapi.co` antes de consentir. (LEGAL-003/004, UX-021)
- **Archivos:** `src/components/CookieBanner.tsx`, `src/lib/geoLanguage.ts`.

---

## 🟢 Baja prioridad (P2/P3 — backlog / pulido)

### T13 · Higiene de repo — ⬜ pendiente
- 🟢 · ⬜ · Claude. `git rm` de los 2 zips de 6.6MB, borrar carpeta `-v4/`,
  añadir `*.zip` a `.gitignore`, condicionar `plugin-inspect-react-code` a dev.
  (TECH-003/004, ARCH-003/004)

### T14 · Limpiar deps muertas y shadcn sin usar — ⬜ pendiente
- 🟢 · ⬜ · Claude. `@studio-freight/lenis`, `next-themes`, `tw-animate-css`,
  53 componentes ui/ sin usar (recharts/vaul/cmdk...). (TECH-005/006/007)

### T15 · Accesibilidad — ⬜ pendiente
- 🟢 · ⬜ · Claude. `aria-label` en botones solo-icono, `focus-visible` global,
  lightbox/drawer con Esc + focus-trap (usar radix Dialog). (UX-006/007/009)

### T16 · Sistema de diseño — ⬜ pendiente
- 🟢 · ⬜ · Claude. Adoptar `<Button>`/`<FormInput>` o borrar shadcn; tokens de
  container/tipografía/radius en tailwind.config. (UX-004/011/012/013)

### T17 · JSON-LD + performance (LCP/fuentes/bundle) — ⬜ pendiente
- 🟢 · ⬜ · Claude. Organization/Article/Breadcrumb schema; fuentes no bloqueantes;
  hero como `<img fetchpriority>`; strip de console. (PERF-004/005/006/007/011)

### T18 · Lead magnet falso de BuyerGuide — ⬜ pendiente
- 🟢 · ⬜ · Claude. El botón "Descargar guía" hace `alert()` y descarta el email.
  Conectar a leads.service o quitar. (UX-003)

---

## ✅ Cerradas recientemente (2026-05-26)

- i18n de About/GestionLocative/BuyerGuide (UX-001/002) — commit `593e47ae`
- Migración 005 orphan-user + trigger auto-provisioning
- Gap auth.users↔agents (mensajes de error específicos)
- Fixes de auth (withTimeout + race USER_UPDATED en reset password)
- Leads pipeline RLS verificado
- Rotación DEEPSEEK_API_KEY + cierre del fallback VITE_
- Supabase URL Configuration (Site URL → atlasrouge.com)
- Harness de ingeniería instalado
- Auditoría de production-readiness (13 agentes) → AUDIT_REPORT.md

> Las owner-actions de Khalid (SMTP, foto Sofia, planes Pro) viven en
> `tasks/current.md` § "owner config".
