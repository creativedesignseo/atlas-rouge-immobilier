# Auditoría de Preparación para Producción — Atlas Rouge Immobilier

> **Fecha de auditoría:** 2026-06-03
> **Modo:** full (13 agentes)
> **Commit:** `9a420587`
> **Stack:** React 19.2 · Vite 7.2 · TypeScript 5.9 (strict) · Supabase · Netlify (Functions + Edge) · Tailwind · i18next · sin pagos (lead-gen)
>
> _Auditoría anterior (2026-05-26, 22/100) conservada en `AUDIT_REPORT.2026-05-26.md`._

```
╔══════════════════════════════════════════════════════════════╗
║  AUDITORÍA DE PRODUCCIÓN — Atlas Rouge Immobilier             ║
║  Modo: full                              2026-06-03           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Score:  ████████░░░░░░░░░░░░  40/100   🔴 NOT READY         ║
║                                                              ║
║  Seguridad     ████████░░  19.5/25                           ║
║  Pagos         ██████████  20/20   (N/A — lead-gen)          ║
║  Datos/RLS     ░░░░░░░░░░   0/15                             ║
║  UI/UX         ░░░░░░░░░░   0/10                             ║
║  QA            ░░░░░░░░░░   0/10                             ║
║  Admin         ░░░░░░░░░░   0/5                              ║
║  SEO/Perf      ░░░░░░░░░░   0/5                              ║
║  Deploy        ░░░░░░░░░░   0/5                              ║
║  Stack         ░░░░░░░░░░   0/3                              ║
║  Legal         ░░░░░░░░░░   0/2                              ║
║                                                              ║
║  Hallazgos: 3 críticos · ~26 altos · ~28 medios             ║
║             · ~40 bajos · ~6 recomendaciones                ║
║                                                              ║
║  Top blockers (P0):                                          ║
║   1. DB-001  Drift de migraciones (la BD prod no = repo)    ║
║   2. LEGAL-001  Sin Política de Privacidad (RGPD)           ║
║   3. LEGAL-002  Sin Mentions Légales (LCEN, Francia)        ║
║                                                              ║
║  Informe completo: ./AUDIT_REPORT.md                        ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Cómo leer este score (importante)

El **40/100 🔴 NOT READY** es el resultado **determinista** del algoritmo del skill, y
hay que leerlo con dos matices honestos, no para suavizar sino para que el número
no engañe:

1. **+20 puntos "gratis" de Pagos.** El área Pagos pesa 20/100 y, como este sitio
   no tiene pagos por diseño (lead-gen), no acumula penalización → suma sus 20
   puntos completos. Sin esa área, sobre las áreas aplicables el proyecto sacaría
   ~**24/80**. El número real de salud está más cerca de ese rango.

2. **El cap por área aplasta áreas que están bien.** El algoritmo penaliza -10 por
   crítico y -5 por alto, y cada área tiene un peso pequeño (Legal 2, Stack 3,
   Deploy 5…). Un solo hallazgo "alto" ya deja un área en 0. Por eso **Stack
   (moderno, 0 CVEs) y Deploy (cabeceras de seguridad excelentes) marcan 0** pese
   a estar razonablemente bien: un único high los hunde. **Seguridad es la única
   área que "aprueba" numéricamente (19.5/25).**

**Traducción ejecutiva:** el sitio **no está catastróficamente roto** — la
ingeniería base es sólida (TS strict, 0 vulnerabilidades npm, RLS real, escalada
de privilegios ya cerrada). Lo que lo deja en "NOT READY" es una **combinación
concreta y acotada**: 2 bloqueantes **legales** (RGPD + Mentions Légales,
obligatorios para público francés), 1 bloqueante de **integridad de datos** (drift
de migraciones), y una **amplitud** de P1 repartidos (operativos, conversión, SEO,
deploy). No es un agujero; son varios frentes medianos a la vez.

---

## Resumen ejecutivo

Atlas Rouge es un proyecto **bien construido a nivel de ingeniería** para ser un
sitio de captación de leads: arquitectura madura (router trilingüe, AuthProvider
único, ErrorBoundary, code-splitting, capa de servicios), seguridad por encima de
la media (escalada de privilegios cerrada en mig. 006, PII cerrada en 009,
secretos bien higienizados, 0 CVEs) y un SEO técnico de SPA sorprendentemente
bueno (sitemap dinámico, hreflang, edge function de OG/canonical).

Pero **no está listo para lanzar a público europeo/francés** por tres motivos
duros y un conjunto amplio de P1:

- **Legal (P0×2):** no existen Política de Privacidad ni Mentions Légales — son
  obligatorias (RGPD/CNIL y LCEN en Francia) y el sitio ya recoge datos personales
  por tres vías. Además fuga la IP del visitante a `ipapi.co` (EEUU) antes del
  consentimiento.
- **Datos (P0×1):** drift de migraciones — la BD de producción no se construyó
  desde el repo; hay 4 SQL divergentes y archivos sueltos que reabrirían la
  escalada de privilegios si se reejecutan. No se puede auditar lo que no se puede
  reconstruir.
- **Amplitud de P1:** CTA primario móvil muerto en la ficha, leads de
  estimación/newsletter sin pantalla en el admin, `og-image`/favicon inexistentes
  (previews sociales rotas), build de Netlify no reproducible (sin `[build]` ni pin
  de Node), un plugin de Vite oscuro corriendo en producción, y cero tests.

**Veredicto:** 🔴 NOT READY. Con la **Fase 0** (legal + baseline de BD + un puñado
de quick wins) el proyecto pasa a 🟡 LAUNCH WITH CAVEATS de forma realista.

---

## Hallazgos críticos (P0) — corregir antes del lanzamiento

### DB-001 — Drift de migraciones: la BD de producción no coincide con el repo
- **Severidad:** 🔴 Crítico · **Área:** datos · **Ubicación:** `supabase/migrations/006_fix_agent_update_rls.sql:16`
- **Descripción:** Las migraciones 006/008/009/011 documentan por escrito que la BD
  productiva NO se construyó desde `supabase/migrations/` sino desde un schema
  consolidado, con nombres de política distintos (p. ej. la 001 crea "Agent can
  update own row" pero en prod es `agents_update_own`; la 009 dropea una política
  que no existe en ninguna migración numerada). Coexisten 4 fuentes de verdad SQL:
  `migrations/*`, `schema.sql`, `supabase_migracion_simple.sql`, `migrate_existing.sql`.
- **Impacto:** Imposible reconstruir staging/DR con fidelidad; imposible auditar la
  seguridad real desde el código; un `DROP POLICY IF EXISTS` con nombre equivocado
  falla en silencio y deja viva una política insegura. Choca de frente con el
  objetivo de clonar el stack para otras agencias.
- **Recomendación:** `pg_dump --schema-only` de prod → commitear como
  `000_baseline_prod.sql` (la verdad actual); borrar/archivar los 3 SQL sueltos;
  reanudar la cadena numerada desde ese baseline.

### LEGAL-001 — No existe Política de Privacidad (RGPD)
- **Severidad:** 🔴 Crítico · **Área:** legal · **Ubicación:** `src/App.tsx` (sin ruta) / `src/components/Footer.tsx:42` (`href:'#'`)
- **Descripción:** No hay página, ruta ni contenido i18n de política de privacidad
  en ningún sitio. El sitio recoge nombre, teléfono y email de residentes europeos
  por tres formularios (contacto, estimación, newsletter).
- **Impacto:** Violación directa de transparencia RGPD (Art. 13/14). La CNIL puede
  sancionar. Ningún aviso de base legal, retención, derechos del interesado ni
  destinatarios (Supabase, Netlify, ipapi).
- **Recomendación:** Crear página trilingüe (FR/ES/EN), enrutarla y enlazarla en el
  footer; contenido revisado por abogado francés.

### LEGAL-002 — No existen Mentions Légales (obligatorias en Francia)
- **Severidad:** 🔴 Crítico · **Área:** legal · **Ubicación:** `src/components/Footer.tsx:40` (`href:'#'`)
- **Descripción:** No existe página de aviso legal. La ley francesa (LCEN 2004-575
  Art. 6) las exige para cualquier sitio dirigido a Francia: identidad del editor,
  forma jurídica, RCS/SIRET, dirección, director de publicación, host. Ninguno
  presente. Falta además verificar Loi Hoguet (carte professionnelle) si actúa como
  intermediario inmobiliario hacia clientes franceses.
- **Impacto:** Sanción bajo LCEN. Exposición regulatoria clara para un sitio
  France-targeted.
- **Recomendación:** Crear Mentions Légales trilingües con datos del editor (entidad
  de Khalid) y del host; validar Loi Hoguet con abogado.

---

## Hallazgos altos (P1) — corregir en el primer sprint

**Datos / RLS**
- **DB-002** — `is_admin()` consulta `public.admins`, una tabla que el repo nunca
  crea (la 001 la dropea). En un entorno limpio, todas las RLS que dependen de
  `is_admin()` (properties, contactos, barrios) se rompen. `008:37`.
- **DB-003** — Tres funciones de rol divergentes (`is_admin_role`, `is_active_agent`,
  `is_admin`) usadas por distintas tablas; el mismo "admin" puede pasar una política
  y fallar otra. `008:28`.
- **DB-004** — Archivos SQL sueltos (`supabase_migracion_simple.sql`,
  `migrate_existing.sql`) recrean la política de UPDATE de `agents` **sin WITH
  CHECK** = la versión vulnerable a escalada que la 006 arregló. Reejecutarlos
  reabre el agujero. `supabase_migracion_simple.sql:22`.
- **DB-005** — El fix de escalada de privilegios depende del nombre de política de
  prod; en un entorno reconstruido desde las migraciones numeradas el agujero sigue
  abierto. `001_agents.sql:158`.

**Legal**
- **LEGAL-003** — Los 4 enlaces legales del footer (aviso legal, CGU/CGV,
  privacidad, cookies) apuntan a `href:'#'`. `Footer.tsx:40`. *(también detectado
  como UX-004)*
- **LEGAL-004** — `geoLanguage.ts:21` envía la IP del visitante a `ipapi.co` (tercero
  EEUU) en el primer render, **antes** del consentimiento y sin divulgación.
- **LEGAL-005** — Banner de cookies no granular (solo aceptar/rechazar) y con texto
  que promete "medir audiencia" sin que exista analytics. `CookieBanner.tsx:34`.
- **LEGAL-006** — El formulario de Estimación recoge nombre+teléfono **sin casilla
  de consentimiento**. `Estimation.tsx:31`.
- **LEGAL-007** — La newsletter recoge email sin consentimiento ni doble opt-in.
  `leads.service.ts:71`.

**UI/UX (conversión)**
- **UX-001** — El CTA primario móvil "Demander une visite" de la ficha de propiedad
  **no tiene `onClick`**: no hace nada. Es el peor bug de conversión, en la página
  de mayor intención y donde aterriza el tráfico móvil francés. `PropertyDetail.tsx:745`.
- **UX-002** — La página de búsqueda muestra **texto en francés hardcoded** a
  usuarios ES/EN (empty state, barra móvil, popups). `Search.tsx:1138`.
- **UX-003** — El lead-magnet "descarga la guía" del BuyerGuide es un `alert()`
  nativo; el email se descarta. `BuyerGuide.tsx:713`.

**QA**
- **QA-001** — Cero tests automatizados en todo el repo; sin runner, sin scripts
  `test`/`typecheck`. Toda regresión llega a prod sin red. `package.json:6`.
- **ARCH-001** — La página de Favoritos lee datos **mock hardcoded**, no la BD: los
  favoritos de inmuebles reales nunca aparecen. `Favorites.tsx:15`.

**Admin**
- **ADM-001** — Los leads de **estimación y newsletter** se guardan pero **no hay
  pantalla admin** para verlos: el negocio pierde esos leads de facto.
  `leads.service.ts:40`.
- **ADM-003** — Sin gestión de agentes en el panel (alta/baja/rol = SQL manual).
  `AgentProfile.tsx:15`.

**SEO / Rendimiento**
- **PERF-001** — `og-image.jpg` se referencia en 5 sitios pero **no existe** →
  previews sociales rotas en todo el sitio. `index.html:24`.
- **PERF-003** — Las 11 páginas estáticas no tienen título/descripción propios en el
  DOM (comparten los genéricos). `Home.tsx:274`.
- **PERF-004** — Sin JSON-LD de Organization/RealEstateAgent/WebSite en Home.
- **PERF-005** — El blog (activo top-of-funnel) no emite JSON-LD de Article.
  `BlogPost.tsx:64`.
- **PERF-006** — 4 familias de fuentes cargadas por `@import` render-blocking.
  `index.css:18`.

**Deploy**
- **DEPLOY-001** — `netlify.toml` sin sección `[build]`: comando/publish/Node solo
  viven en la UI de Netlify → build no reproducible. `netlify.toml:1`.
- **DEPLOY-002** — Sin pin de versión de Node (`.nvmrc`/`engines`/`NODE_VERSION`).

**Stack**
- **TECH-001** — `vite.config.ts:9` carga `plugin-inspect-react-code` (maintainer
  con email QQ, creado feb-2026) **incondicionalmente, también en el build de
  producción** → vector de supply-chain. Quitarlo del build prod ya.
- **TECH-002 / TECH-003** — Cero tests *(= QA-001)* y sin CI/Dependabot; push a main
  = prod sin gate.

---

## Hallazgos medios (P2) — backlog

| ID | Título | Área | Ubicación |
|---|---|---|---|
| SEC-001 | XSS almacenado en popup del mapa (innerHTML sin escapar) | seguridad | `Search.tsx:382` |
| DB-006 | Storage: cualquier authenticated puede escribir en `property-images` | datos | `007_*.sql:40` |
| DB-007 | UPDATE de `contact_submissions` sin WITH CHECK | datos | `schema.sql:259` |
| DB-008 | Sin audit log de cambios sensibles (rol, borrado de PII) | datos | `008_*.sql` |
| ARCH-002 | Fallback silencioso a datos demo si Supabase falla (precios ficticios) | qa | `property.service.ts:143` |
| ARCH-003 | Dos ZIP de ~6.9MB commiteados al repo | stack | `*.zip` |
| QA-002 | `subject:'Achat'` inicial no casa con ninguna opción → leads sucios | qa | `Contact.tsx:78` |
| QA-003 | Fallo de red en Search se muestra como "sin resultados" | qa | `Search.tsx:792` |
| QA-004 | ErrorBoundary único de raíz → cualquier crash = pantalla blanca total | qa | `main.tsx:36` |
| UX-005 | Badges Visa/Mastercard/PayPal en sitio sin checkout | ui-ux | `Footer.tsx:113` |
| UX-006 | Lightbox no cierra con Esc ni clic en fondo | ui-ux | `PropertyDetail.tsx:54` |
| UX-007 | Botón Compartir decorativo (sin handler) | ui-ux | `PropertyDetail.tsx:538` |
| UX-009 | Fallbacks de teléfono/email/dirección falsos shippables | ui-ux | `PropertyDetail.tsx:76` |
| ADM-004 | Botón borrar contacto visible a no-admin → falla silenciosa | admin | `AdminContacts.tsx:171` |
| ADM-005 | Verificar policy "admin edita/borra cualquier propiedad" | admin | `AdminProperties.tsx:210` |
| ADM-008 | Sin paginación ni operaciones masivas (cap 100 contactos) | admin | `AdminContacts.tsx:37` |
| ADM-010 | Borrado de propiedad es hard-delete sin soft-delete/undo | admin | `propertyAdmin.service.ts:210` |
| ADM-011 | Borrado de contacto = hard-delete de PII sin retención/export | admin | `contactAdmin.service.ts:68` |
| PERF-002 | Sin favicon ni `<link rel=icon>` | seo-perf | `index.html:3` |
| PERF-007 | Hero LCP como `background-image` (no precargable) | seo-perf | `Home.tsx:264` |
| PERF-008 | mapbox-gl (~1.8MB) sin code-split; `manualChunks` apunta a maplibre inexistente | seo-perf | `vite.config.ts:25` |
| PERF-009 | `<img>` sin width/height → CLS | seo-perf | `PropertyCard.tsx:44` |
| PERF-012 | SPA sin SSR/SSG/prerender de contenido | seo-perf | `App.tsx:17` |
| PERF-013 | `sitemap.xml` committeado con 0 URLs dinámicas | seo-perf | `public/sitemap.xml` |
| DEPLOY-003 | `.netlify/` commiteado (con ruta local absoluta) | deploy | `.netlify/netlify.toml:9` |
| DEPLOY-004 | 5 env vars usadas en Functions sin documentar (incl. destino de leads) | deploy | `.env.example` |
| DEPLOY-005 | Sin CI; push a main = prod sin gate | deploy | `.github` |
| TECH-004 | Node no pinneado *(= DEPLOY-002)* | stack | `package.json` |
| TECH-005 | Archivos enormes (`Search.tsx` 1263 líneas) | stack | `Search.tsx` |
| TECH-006 | Páginas consultan Supabase saltándose la capa de servicios | stack | `PropertyDetail.tsx` |

---

## Hallazgos bajos (P3) — mejoras opcionales

| ID | Título | Área |
|---|---|---|
| SEC-002 | Favoritos anónimos `FOR ALL` no acotado (enumerables/borrables) | seguridad |
| SEC-003 | translate-property usa el token del usuario como apikey de fallback | seguridad |
| SEC-004 | notify-lead sin rate-limit/captcha; CORS deja pasar sin Origin | seguridad |
| SEC-005 | CSP con `'unsafe-inline'` en scripts | seguridad |
| SEC-006 | Vista `blog_posts_published` sin `security_invoker` | seguridad |
| SEC-007 | `signUp()` muerto; verificar signups OFF en Supabase Auth | seguridad |
| SEC-008 | Links del blog sin validación de esquema href | seguridad |
| DB-010 | INSERT de leads sin rate-limit (spam) | datos |
| DB-011 | Sin CHECK de no-negatividad en precios/superficie | datos |
| DB-012 | `price_on_request` oculta el precio solo en UI; `price_eur` legible vía REST | datos |
| DB-013 | Funciones SECURITY DEFINER sin search_path/STABLE (pre-006) | datos |
| UX-010 | Sin skip-link; `focus:` en vez de `focus-visible:` | ui-ux |
| UX-011 | Offset del drawer móvil (64px) ≠ altura header (72px) | ui-ux |
| UX-012 | Dots del carrusel móvil sin indicador activo | ui-ux |
| UX-013 | aria-label del botón favorito describe resultado, no acción | ui-ux |
| UX-014 | Mapa decorativo falso en Contacto en vez del mapa real | ui-ux |
| UX-015 | Páginas de estimación duplicadas (Estimer vs Estimation) | ui-ux |
| UX-016 | Enlace FAQ de Contacto apunta a `/vendre#faq` | ui-ux |
| QA-005 | Form de contacto con `noValidate` y sin validación de email JS | qa |
| QA-006 | Sin test de paridad de claves i18n | qa |
| QA-007 | `verify.sh` anuncia pasos typecheck/test que no existen | qa |
| ADM-006 | Link "ver propiedad" roto en Contactos (sin prefijo de idioma) | admin |
| ADM-007 | KPI `newContacts` calculado pero no mostrado | admin |
| ADM-009 | Ruta `/admin/neighborhoods` sin guard de rol en el router | admin |
| ADM-012 | Cadenas en español hardcoded en AdminBlog | admin |
| ADM-013 | Edición con slug obsoleto sin estado not-found | admin |
| ADM-014 | Sin workflow de estado (contactado/cerrado) en contactos | admin |
| ARCH-004 | `supabase_migracion_simple.sql` huérfano en raíz | datos |
| ARCH-005 | README desactualizado (URL netlify.app, "sitio francés") | stack |
| PERF-010 | Deps pesadas sin usar (recharts, @studio-freight/lenis) | seo-perf |
| PERF-011 | og-rewrite hace 2 fetches y `max-age=0` (sin cache de HTML) | seo-perf |
| PERF-014 | `src/App.css` boilerplate de Vite sin usar | seo-perf |
| PERF-015 | Transforms de imagen sin quality explícita | seo-perf |
| PERF-016 | GSAP en el critical path de la home | seo-perf |
| DEPLOY-006 | CSP whitelistea GA/GTM no cableado | deploy |
| DEPLOY-007 | Sin script `typecheck` ni prettier | deploy |
| DEPLOY-008 | CSP `'unsafe-inline'` *(= SEC-005)* | deploy |
| TECH-007 | `@studio-freight/lenis` muerto (scope deprecado) | stack |
| TECH-008 | `next-themes` sin usar | stack |
| TECH-009 | lucide-react un major por detrás | stack |
| TECH-010 | ESLint `ecmaVersion 2020` vs target ES2022 | stack |
| TECH-011 | Sin Prettier | stack |
| TECH-012 | Sin husky/lint-staged | stack |

---

## Roadmap de corrección por fases

### Fase 0 — Detener la hemorragia (1-3 días, BLOQUEANTE antes de promocionar el sitio)

1. **Legal (con abogado):** crear y enlazar Política de Privacidad + Mentions
   Légales trilingües; añadir consentimiento a estimación y newsletter; enlazar la
   casilla de contacto a la política (resuelve LEGAL-001, 002, 003, 006, 007, 008).
2. **Quitar la fuga de IP:** eliminar la llamada a `ipapi.co` (usar `Accept-Language`
   o la cabecera geo de Netlify) o consentirla+divulgarla (LEGAL-004).
3. **Baseline de BD:** `pg_dump` de prod → `000_baseline_prod.sql`; borrar/archivar
   `schema.sql`, `supabase_migracion_simple.sql`, `migrate_existing.sql`; resolver la
   tabla `admins` fantasma (DB-001, DB-002, DB-004).
4. **Conversión y assets:** cablear el CTA móvil de la ficha (UX-001); subir
   `og-image.jpg` 1200×630 real + favicon (PERF-001, PERF-002).
5. **Supply-chain:** condicionar `plugin-inspect-react-code` a `mode==='development'`
   o eliminarlo (TECH-001).
6. **Quick wins de datos limpios:** `subject:'buy'` por defecto (QA-002); estado de
   error en Search (QA-003).

### Fase 1 — Estabilización (1-2 semanas)

1. **Admin operativo:** página de leads de estimación + newsletter (ADM-001); gate
   del botón borrar por `isAdmin` (ADM-004); arreglar link roto (ADM-006).
2. **RLS:** unificar funciones de rol (DB-003); una sola política UPDATE de `agents`
   con WITH CHECK validada (DB-005); WITH CHECK en contactos (DB-007).
3. **i18n de Search** (UX-002, UX-017); captura real del lead-magnet (UX-003).
4. **SEO on-page:** hook `useSEO` por página (PERF-003); JSON-LD Organization +
   Article (PERF-004, PERF-005); fuentes a `<link>` en `<head>` (PERF-006).
5. **Deploy reproducible:** `[build]` + `NODE_VERSION` + `.nvmrc`/`engines`
   (DEPLOY-001/002); documentar env vars (DEPLOY-004); CI con `verify.sh` como gate
   (DEPLOY-005).
6. **Tests:** Vitest + Testing Library sobre servicios de leads/contact y los 3
   forms; smoke Playwright del flujo de contacto (QA-001).
7. **XSS:** escapar datos en el popup del mapa (SEC-001).

### Fase 2 — Calidad de producción (3-4 semanas)

1. Audit log + soft-delete de propiedades y contactos (DB-008, ADM-010, ADM-011).
2. Paginación y workflow de estado en contactos (ADM-008, ADM-014).
3. `<AdminOnlyRoute>` compartido (ADM-009); gestión de agentes (ADM-003).
4. Rendimiento: hero `<img fetchpriority>`, width/height en imágenes, mapbox chunk,
   optimizar og-rewrite (PERF-007/008/009/011).
5. Storage RLS a `is_active_agent()` (DB-006); CHECKs de integridad (DB-011);
   decidir si `price_on_request` debe ocultar el precio de verdad (DB-012).
6. Limpieza de repo: sacar ZIPs y `.netlify/` de git, borrar deps muertas
   (ARCH-003, DEPLOY-003, TECH-007/008, PERF-010/014).

### Fase 3 — Modernización (3-6 meses)

1. Evaluar prerender/SSG de rutas de contenido (blog, fichas, listados) (PERF-012).
2. Descomponer `Search.tsx` y `PropertyForm.tsx`; consolidar accesos en services
   (TECH-005, TECH-006).
3. CSP con nonces (quitar `unsafe-inline`), `prefers-reduced-motion` global
   (SEC-005, PERF-017).
4. Prettier + lint-staged + bumps de deps (TECH-009/011/013) para el clon
   reutilizable.

---

## Detalle por área (veredictos de cada especialista)

<details>
<summary>🏗️ Arquitectura — sólida para lead-gen; 1 bug funcional + higiene</summary>

Router trilingüe bien diseñado, AuthProvider único, ErrorBoundary en raíz,
code-splitting + Suspense, capa de servicios, rutas admin protegidas, sin rutas
test/debug expuestas. Bugs: Favoritos lee mock (ARCH-001, alto), fallback silencioso
a demo en prod (ARCH-002, medio). Higiene: ZIPs commiteados, SQL huérfano, README
stale, carpeta `atlas-rouge-immobilier-v4/` local.
</details>

<details>
<summary>🔐 Seguridad (19.5/25) — buen estado para lanzar, sin críticos/altos en código actual</summary>

Escalada de privilegios cerrada (mig. 006, WITH CHECK + `AgentSelfUpdate`), PII
cerrada (mig. 009), secretos higienizados (.env gitignored, sin secretos en src,
DEEPSEEK sin VITE_), funciones serverless con auth/CORS/validación, blog sin
`dangerouslySetInnerHTML`, cabeceras de seguridad presentes, `npm audit` = 0.
Acción: XSS en popup del mapa (SEC-001, medio) + varios P3 (favoritos anon, CSP
unsafe-inline, rate-limit de notify-lead).
</details>

<details>
<summary>💳 Pagos (20/20, N/A) — no aplica (lead-gen sin checkout)</summary>

Verificado: cero SDKs de pago, sin endpoints ni tablas de transacciones. Único
matiz UX: badges "Visa/Mastercard/PayPal" en el footer inducen a error (UX-005).
El peso de 20 puntos se computa completo por el algoritmo; ver "Cómo leer este
score".
</details>

<details>
<summary>🗄️ Datos / RLS (0/15) — seguridad intencionada OK, pero drift grave de migraciones</summary>

La seguridad *intencionada* es razonable (RLS en todas las tablas, escalada y PII
cerradas en prod). El problema es que el repo no representa fielmente la BD
productiva (DB-001 crítico), `is_admin()` apunta a una tabla `admins` que el repo no
crea (DB-002), tres funciones de rol divergentes (DB-003), y archivos sueltos que
reabrirían la escalada (DB-004/005). Más: storage abierto, audit log ausente,
`price_on_request` legible vía REST.
</details>

<details>
<summary>🛠️ Admin (0/5) — funcional, pero agujeros operativos grandes</summary>

Rutas protegidas, confirmaciones del design-system, escalada cerrada. Pero: leads
de estimación/newsletter sin UI (ADM-001, pérdida de negocio), sin audit log, sin
gestión de agentes, botones visibles a no-admin que fallan en silencio, sin
paginación, hard-deletes sin undo.
</details>

<details>
<summary>🎨 UI/UX (0/10) — diseño premium, fugas de conversión reales</summary>

Sistema de tokens coherente, formularios de lead con estados correctos, paridad
i18n casi perfecta. Pero: CTA móvil muerto (UX-001), francés hardcoded en Search
(UX-002), lead-magnet falso (UX-003), enlaces legales muertos, badges de pago
absurdos, Lightbox sin Esc, Share decorativo. "Lead trust score": 6.5/10.
</details>

<details>
<summary>🧪 QA (0/10) — núcleo sano, pero CERO tests</summary>

build/lint/typecheck en verde; forms críticos llegan a Supabase con anti-doble-click
y errores visibles. Pero no hay un solo test, ni scripts `test`/`typecheck`. Bugs:
subject inicial inconsistente, fallo de red disfrazado de "sin resultados",
ErrorBoundary único de raíz.
</details>

<details>
<summary>📈 SEO/Rendimiento (0/5) — infra técnica buena, on-page y assets flojos</summary>

Excelente para un SPA: sitemap dinámico, hreflang, og-rewrite por ruta, sin noindex.
Pero `og-image`/favicon inexistentes (previews rotas), páginas estáticas sin
meta propios, sin JSON-LD Organization/Article, fuentes render-blocking, hero LCP no
precargable, mapbox sin chunk. CWV previstos: LCP amarillo/rojo, CLS amarillo.
</details>

<details>
<summary>🚀 Deploy (0/5) — cabeceras excelentes, build no reproducible</summary>

Cabeceras de seguridad de las mejores (HSTS preload, X-Frame DENY, CSP real),
redirect SPA correcto, sin source maps, sin secretos en git, sin VITE_ en secretos
server-side. Pero `netlify.toml` sin `[build]`, sin pin de Node, `.netlify/`
commiteado, 5 env vars sin documentar, sin CI.
</details>

<details>
<summary>📦 Stack (0/3) — moderno y sano, pero supply-chain a vigilar</summary>

React 19.2, Vite 7.2, TS 5.9 strict, 100% TypeScript, 0 CVEs, maplibre limpio tras
la migración. Pero un plugin de Vite oscuro corre en el build de prod (TECH-001,
alto), cero tests, sin CI/Dependabot, sin pin de Node, archivos enormes, deps
muertas.
</details>

<details>
<summary>⚖️ Legal (0/2) — incumplimiento claro para público europeo/francés</summary>

Sin Política de Privacidad (LEGAL-001) ni Mentions Légales (LEGAL-002) — ambos P0.
Fuga de IP a ipapi.co antes del consentimiento, consentimiento incoherente entre
formularios, banner de cookies no granular con texto inexacto, sin retención ni
derechos del interesado. Requiere abogado francés antes de lanzar.
</details>

---

## Apéndice — Desglose del score

| Área | Peso | Penalización (capada) | Score |
|---|---:|---:|---:|
| Seguridad | 25 | 5.5 | **19.5** |
| Pagos (N/A) | 20 | 0 | **20** |
| Datos/RLS | 15 | 15 (cap) | **0** |
| UI/UX | 10 | 10 (cap) | **0** |
| QA | 10 | 10 (cap) | **0** |
| Admin | 5 | 5 (cap) | **0** |
| SEO/Perf | 5 | 5 (cap) | **0** |
| Deploy | 5 | 5 (cap) | **0** |
| Stack | 3 | 3 (cap) | **0** |
| Legal | 2 | 2 (cap) | **0** |
| **Total** | **100** | | **40** 🔴 |

> **Score ajustado excluyendo Pagos (N/A):** 19.5 / 80 ≈ **24/100**. La verdad está
> entre ambos: la ingeniería es mejor de lo que el 24 sugiere (Seguridad/Stack/Deploy
> están bien pero el cap los aplasta), y peor de lo que el +20 de Pagos sugiere.

## Apéndice — Metodología

Auditoría generada por el skill `saas-audit` v0.1 (solo lectura, análisis estático).
Se lanzaron 11 agentes especialistas en paralelo (arquitectura, seguridad, pagos,
datos, admin, UI/UX, QA, SEO/rendimiento, deploy, stack, legal) + orquestador +
reporter. Cada uno citó `file:line`. **Importante:** por el drift documentado
(DB-001), varios hallazgos de datos están condicionados a "si la migración X se
aplicó realmente"; el estado real de producción debe verificarse en vivo. No se
consultó la BD en producción ni se ejecutó ningún cambio.

*Generado por el skill `saas-audit` — auditoría de solo lectura.*
