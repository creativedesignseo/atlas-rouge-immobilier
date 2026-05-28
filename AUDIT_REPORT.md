# Production Readiness Audit — Atlas Rouge Immobilier

> Auditoría multi-agente (13 agentes, modo `full`) · 2026-05-26
> Read-only. No se modificó código. Generado por el skill `saas-audit`.

---

## Score Banner

```
╔══════════════════════════════════════════════════════════════╗
║  PRODUCTION READINESS REPORT — Atlas Rouge Immobilier        ║
║  Mode: full                                  2026-05-26       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Score:  ████░░░░░░░░░░░░░░░░░░  22/100   🛑 BLOCKED          ║
║                                                              ║
║  Security      ██░░░░░░░░░░░░░░░░░░░░   2.5/25                ║
║  Payments      ████████████████████░  19.5/20  (N/A real)    ║
║  Data layer    ░░░░░░░░░░░░░░░░░░░░░░   0.0/15                ║
║  UI/UX         ░░░░░░░░░░░░░░░░░░░░░░   0.0/10                ║
║  QA            ░░░░░░░░░░░░░░░░░░░░░░   0.0/10                ║
║  Admin         ░░░░░░░░░░░░░░░░░░░░░░   0.0/5                 ║
║  SEO/Perf      ░░░░░░░░░░░░░░░░░░░░░░   0.0/5                 ║
║  Deploy        ░░░░░░░░░░░░░░░░░░░░░░   0.0/5                 ║
║  Stack         ░░░░░░░░░░░░░░░░░░░░░░   0.0/3                 ║
║  Legal         ░░░░░░░░░░░░░░░░░░░░░░   0.0/2                 ║
║                                                              ║
║  Findings: 7 critical · 27 high · 24 medium · 16 low · 1 rec ║
║                                                              ║
║  Top blockers (P0):                                          ║
║   1. Escalada de privilegios: agente → admin vía RLS         ║
║   2. Sin Política de Privacidad (RGPD)                        ║
║   3. Sin Mentions Légales (obligatorio Francia)              ║
║   4. Canonical/hreflang estáticos → SEO colapsa al home      ║
║   5. Drift de migraciones: BD no reproducible                ║
║   6. GestionLocative/BuyerGuide/About hardcoded en francés   ║
║   7. (i18n) promesa trilingüe rota en páginas clave          ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Executive Summary

Atlas Rouge es un sitio **lead-gen inmobiliario trilingüe** con una **base de
ingeniería genuinamente sólida** (TypeScript 100% estricto, 0 vulnerabilidades
npm, capa de servicios real, React 19 + Vite 7, RLS en todas las tablas, la
migración 005 es ejemplar). El stack por sí solo sacaría ~9/10.

**Sin embargo, NO debe lanzarse a una audiencia europea tal cual.** El score
de 22/100 está mecánicamente determinado por **7 hallazgos críticos repartidos
en 5 áreas distintas** (seguridad, datos, SEO, legal, i18n). El número es duro
porque cada área cae a 0 al acumular un crítico; el 19,5 de Pagos es un
espejismo (no hay sistema de pagos = no hay bugs de pago posibles). Si se
excluye Pagos por N/A, lo aplicable puntúa ~2,5/80.

La buena noticia: los P0 están **concentrados y son corregibles en ~1 sprint**.
No hay que reescribir la app — hay que tapar agujeros puntuales y publicar las
páginas legales.

---

## Critical Findings (P0) — bloquean el lanzamiento

### P0-1 · Escalada de privilegios: cualquier agente puede auto-promoverse a admin
**Áreas:** security / data / admin (triple-detectado: SEC-001, DB-001, ADM-001)
**Archivos:** `supabase/migrations/001_agents.sql:158`, `supabase/schema.sql:331`, `supabase/migrate_existing.sql:76`

La política RLS `"Agent can update own row"` usa `USING (user_id = auth.uid())`
sin `WITH CHECK` ni restricción de columnas. El frontend lo expone: `updateAgent()`
(`auth.service.ts:141`) hace `.update(updates)` con un tipo que incluye `role`
e `is_active`. Cualquier agente desde DevTools:
```js
supabase.from('agents').update({ role:'admin', is_active:true }).eq('user_id', miId)
```
→ control total: todos los leads/PII, propiedades, blog, gestión de agentes.
Anula el "default seguro" de la migración 005.

**Fix (listo):**
```sql
DROP POLICY IF EXISTS "Agent can update own row" ON agents;
CREATE POLICY "Agent can update own row" ON agents FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND role      = (SELECT a.role      FROM agents a WHERE a.user_id = auth.uid())
    AND is_active = (SELECT a.is_active FROM agents a WHERE a.user_id = auth.uid())
  );
```
Y filtrar `role`/`is_active` del payload de `updateAgent()` salvo flujo admin.

### P0-2 · Sin Política de Privacidad (RGPD)
**Área:** legal (LEGAL-001) · `src/components/Footer.tsx:42`
El enlace `privacy` apunta a `#`. Se recoge PII (nombre, email, teléfono) sin
informar de finalidad, base legal, responsable, plazos ni derechos. Violación
arts. 13-14 RGPD. **Requiere abogado.**

### P0-3 · Sin Mentions Légales (obligatorio en Francia)
**Área:** legal (LEGAL-002) · `src/components/Footer.tsx:40`
La LCEN francesa exige identidad, dirección, registro mercantil y hosting.
No existe. Multa hasta 375.000€. Audiencia principal = inversores franceses.
**Requiere datos legales de Khalid (RC/ICE) + abogado.**

### P0-4 · Canonical y hreflang estáticos → SEO colapsa contra la home
**Área:** seo-perf (PERF-001) · `index.html:11`
`index.html` codifica `canonical=atlasrouge.com/` y los hreflang de la home, y
NO se reescriben por ruta. Toda página interna (cada propiedad, cada artículo)
declara el canonical de la homepage → Google puede colapsar el sitio y
desindexar listings/blog. Catastrófico para un negocio SEO-first.
**Fix:** canonical+hreflang dinámicos por ruta (react-helmet-async) o ampliar
la edge function `og-rewrite` a todas las rutas.

### P0-5 · Drift de migraciones: la BD no es reproducible
**Área:** data (DB-002) · `supabase/migrations/001_agents.sql:70`
Las tablas base (`properties`, `contact_submissions`, `neighborhoods`,
`site_settings`, `favorites`) solo existen en `schema.sql`, NO en las
migraciones numeradas, pero `001` hace `ALTER TABLE properties`. Reconstruir
desde `migrations/` **falla en la 001**. No hay fuente única de verdad →
imposible DR/staging fiable.
**Fix:** crear `000_base_schema.sql` con los CREATE TABLE; regenerar o eliminar
`schema.sql` como fuente paralela.

### P0-6 / P0-7 · i18n roto en páginas clave (promesa trilingüe rota)
**Área:** ui-ux (UX-001, UX-002) · `src/pages/GestionLocative.tsx`, `BuyerGuide.tsx`, `About.tsx`
`GestionLocative` (272 líneas, **0 `t()`**), `BuyerGuide` (907 líneas, 3 `t()`)
y `About` (513 líneas, 6 `t()`) están casi 100% hardcodeadas en francés. Un
visitante ES/EN ve francés en páginas de servicio, guía legal y credibilidad.
Rompe la propuesta central del producto para la audiencia objetivo.

---

## High Findings (P1) — primer sprint post-launch

**Seguridad / Backend**
- **Funciones serverless abiertas** (SEC-002, SEC-003, ARCH-001, DEPLOY-007):
  `notify-lead` y `translate-property` sin auth, CORS `*`, sin rate-limit.
  `translate-property` quema cuota de pago de DeepSeek; `notify-lead` permite
  spam + inyección Markdown en Telegram. → exigir JWT Supabase + CORS al dominio.
- **Funciones `SECURITY DEFINER` sin `search_path`** (DB-005): `is_agent()`,
  `is_admin_role()`, `is_active_agent()` → riesgo de search-path hijacking en
  funciones de autorización. Fix trivial: `SET search_path = public, pg_temp`.
- **Políticas RLS duplicadas** (DB-003): `estimation_requests` y
  `newsletter_subscribers` tienen 2 juegos de políticas (las viejas no
  versionadas + las nuevas). Crear `006` con `DROP POLICY` de las antiguas.

**SEO / Performance**
- **Sitemap dinámico no está en `main`** (PERF-002, DEPLOY-009): el generador
  `generate-sitemap.mjs` + `prebuild` solo viven en el worktree; `main` tiene
  un sitemap obsoleto (dominio `.netlify.app`, 11 URLs, sin idiomas/posts).
- **Sin SSR/prerender** (PERF-003): crawlers reciben `<div id=root>` vacío.
- **Falta JSON-LD** Organization/RealEstateAgent/Article/BreadcrumbList (PERF-004).
- **Fuentes bloqueantes + LCP en background-image** (PERF-005, PERF-006).

**Admin / Operación**
- **Leads sin UI en el admin** (ADM-003): `estimation_requests` y
  `newsletter_subscribers` se capturan pero solo se ven en Supabase Dashboard.
- **Sin audit log** (ADM-002, DB-013): nadie sabe quién borró qué.
- **Editor de blog sin auto-save** (ADM-004): riesgo de perder artículos largos.

**QA / Stack / Deploy / UI**
- **Cero tests automatizados** (QA-001).
- **Sin Error Boundary** (ARCH-002, TECH-002): un throw deja pantalla en blanco.
- **Sin scripts `typecheck`/`test`** (TECH-001, DEPLOY-004): `verify.sh` da
  "verde engañoso".
- **`netlify.toml` sin `[build]`** (DEPLOY-001) + **env vars no documentadas**
  (DEPLOY-002): si faltan RESEND/TELEGRAM en Netlify, los leads no se notifican
  en silencio.
- **Sin CI/CD** (DEPLOY-003), `main` no protegida.
- **Lead magnet falso** (UX-003): "Descargar guía" hace `alert()` y descarta el
  email → lead perdido.
- **Sistema de diseño muerto** (UX-004): shadcn completo sin usar; todo `<button>` crudo.
- **Accesibilidad** (UX-006, UX-007, UX-009): lightbox/drawer sin Esc/focus-trap,
  botones solo-icono sin `aria-label`, sin `focus-visible`.

**Legal**
- **Banner de cookies cosmético** (LEGAL-003): no bloquea nada, no granular.
- **IP a `ipapi.co` antes del consentimiento** (LEGAL-004).
- **Estimación sin consentimiento RGPD** (LEGAL-005).
- **Badges de pago falsos** (LEGAL-006, PAY-001): Visa/Mastercard/PayPal sin
  sistema de pago = práctica engañosa.

---

## Medium Findings (P2) — backlog

Datos: helpers duplicados sin consolidar (DB-004, DB-010), `email` no UNIQUE
(DB-006), sin DELETE/retención de leads RGPD (DB-008, DB-009), `schema.sql`
desincronizado (DB-016), scripts SQL sueltos (DB-019).
QA: CSP bloquea geo-IP (QA-002), servicios sin `withTimeout` → spinner infinito
en admin (QA-003), formularios sin maxLength/validación de teléfono (QA-004,
QA-005), pérdida silenciosa de leads sin env (QA-007, QA-008).
UI: color CTA inconsistente (UX-005), placeholder phone hardcoded (UX-010),
24 max-widths ad-hoc (UX-011), sin escala tipográfica (UX-012), estado vacío de
Search en francés (UX-014), PhoneField sin teclado (UX-018), cookie no granular
(UX-021).
Deploy: Node sin fijar (DEPLOY-005), sin observabilidad/Sentry (DEPLOY-006).
Stack: plugin de dev en build de prod (TECH-004), 2 zips de 6.6MB committeados
(TECH-003). Legal: sin doble opt-in newsletter (LEGAL-008), sin ejercicio de
derechos (LEGAL-009), sin política de retención (LEGAL-010), datos placeholder
sin RC/ICE (LEGAL-011).

---

## Low Findings (P3) — pulido

Lock de auth noop (SEC-004), href de blog sin validar esquema (SEC-005), CSP
`unsafe-inline` (SEC-006, ARCH-006), errores crudos al cliente (SEC-007),
bucket avatares (SEC-008), FK `properties.agent_id` sin ON DELETE (DB-007),
`published_at` sin integridad (DB-011), `properties` sin `updated_at` (DB-012),
sin CHECK precios/coords (DB-014), JSONB sin validar (DB-015), comentario
engañoso `viewer` en 005 (DB-017), OAuth email NULL (DB-018), favoritos anon
(DB-020), site_settings público (DB-021), tasa EUR→MAD hardcoded ×11 (PAY-002),
console.* en prod (PERF-007), alt-text 8/30 imágenes (PERF-008), sin width/height
(PERF-009), GSAP sin prefers-reduced-motion (PERF-010), bundle 776KB (PERF-011),
boilerplate App.css (PERF-014), radios inconsistentes (UX-013), PhoneField en
estimación (UX-015), subject default Contact (UX-016), drawer offset (UX-017),
sin skeletons (UX-019), mapa decorativo en Contact (UX-020), README desfasado
(TECH-009, DEPLOY-008), `as any` dashboard (TECH-010), deps muertas (TECH-005,
TECH-006), shadcn sin usar (TECH-007), PII en console mock (LEGAL-012).

---

## Phased Roadmap

### Phase 0 — Stop the Bleed (1-3 días) · OBLIGATORIO antes de promocionar
1. **P0-1** Cerrar la escalada de privilegios (SQL `WITH CHECK` + filtrar `updateAgent`).
2. **P0-2/P0-3** Publicar Política de Privacidad + Mentions Légales (FR/ES/EN) — requiere abogado + datos de Khalid. Quitar badges de pago falsos.
3. **P0-4** Canonical/hreflang dinámicos por ruta.
4. **P0-5** `000_base_schema.sql` para BD reproducible.
5. **Cerrar funciones serverless** (auth + CORS) — riesgo de coste DeepSeek.
6. **Error Boundary** global + tratar env Supabase ausente como error visible.

### Phase 1 — Stabilization (1-2 semanas)
- i18n de GestionLocative/BuyerGuide/About (P0-6/7) + estado vacío de Search.
- Migración `006` para limpiar políticas RLS duplicadas + `search_path` en helpers.
- Merge del sitemap dinámico a `main`; verificar RESEND/TELEGRAM en Netlify.
- UI de leads en el admin (estimaciones + newsletter).
- `[build]` en netlify.toml, `.nvmrc`, scripts `typecheck`/`test`, CI con verify.sh.
- Arreglar/quitar el lead magnet falso; `aria-label` + `focus-visible`.
- Cookie banner granular + mover geo-IP a Edge Function (RGPD).

### Phase 2 — Production Quality (3-4 semanas)
- Suite de tests (Vitest servicios + Playwright smoke trilingüe).
- JSON-LD completo, prerender de rutas públicas, optimización LCP/fuentes.
- Audit log + soft-delete + UI de gestión de agentes.
- Tokens de diseño (container/tipografía/radius) + adoptar `<Button>`.
- Doble opt-in newsletter + política de retención + ejercicio de derechos RGPD.

### Phase 3 — Modernization (3-6 meses)
- Refactor de páginas monolíticas (Search.tsx 1.272 líneas, etc.).
- CSP con nonces (quitar `unsafe-inline`), observabilidad (Sentry).
- Husky + lint-staged + Prettier + Dependabot.

---

## Per-Area Scores

| Área | Score | Veredicto |
|---|---|---|
| Security | 2.5/25 | 1 crítico + 2 high (funciones abiertas) |
| Payments | 19.5/20 | N/A real — no hay pagos (solo badges falsos) |
| Data | 0/15 | drift de migraciones + escalada + RLS duplicadas |
| UI/UX | 0/10 | i18n roto + lead magnet falso + a11y |
| QA | 0/10 | cero tests + servicios sin timeout |
| Admin | 0/5 | leads sin UI + sin audit log |
| SEO/Perf | 0/5 | canonical estático + sin SSR |
| Deploy | 0/5 | sin [build], sin CI, env no documentadas |
| Stack | 0/3 | sano de base, penalizado por falta typecheck/test |
| Legal | 0/2 | sin páginas legales (bloqueante UE) |

> **Nota de interpretación:** el score de 22 sobrevalora por el área de Pagos
> (19,5 "gratis" por no existir). La salud real de las áreas aplicables es muy
> baja por *cantidad* de P0, no por mala artesanía: el stack es excelente. El
> camino a 🟡 LAUNCH WITH CAVEATS pasa por cerrar la Fase 0 + Fase 1.

---

*Auditoría generada por `saas-audit` v0.1 · 13 agentes · read-only · 2026-05-26*
