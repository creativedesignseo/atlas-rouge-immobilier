# PROJECT_CONTEXT.md — Atlas Rouge Immobilier

> Contexto completo del proyecto para que cualquier sesión nueva (Claude Code,
> chat, otro dev) entienda el sistema sin depender de conversaciones previas.
> **Última actualización:** 2026-05-26
> **Fuente de verdad operativa:** `HANDOFF.md` · **Historial:** `HANDOFF_REPORT.md`

---

## 1. Descripción del proyecto

Sitio web de **Atlas Rouge Immobilier**, una **agencia inmobiliaria de lujo en
Marrakech (Marruecos)**. Es un sitio **trilingüe (Francés / Español / Inglés)**
dirigido a **inversores europeos** —principalmente franceses— interesados en
comprar villas, riads y apartamentos en Marrakech.

- **Tipo:** Lead-generation (captación de contactos). **NO es e-commerce**: no
  hay pagos online, carrito ni checkout.
- **Cliente final / owner:** **Khalid** (reside en Francia).
- **Agencia que desarrolla:** Adspubli (Jonatan).
- **Producción:** https://atlasrouge.com (Netlify). **LIVE.**
- **Repo:** https://github.com/creativedesignseo/atlas-rouge-immobilier

## 2. Objetivo principal

Captar **leads cualificados** (inversores) mediante:
- Catálogo de propiedades con fichas detalladas y mapa.
- Formularios de contacto, estimación de valor y suscripción a newsletter.
- Un **blog SEO** trilingüe (top-of-funnel; el SEO es el canal de crecimiento).
- Servicios de acompañamiento: compra, venta, **gestión locativa** (alquiler
  gestionado para propietarios extranjeros) — todos captan clientes.

## 3. Funcionalidades existentes (terminadas)

- **Sitio público trilingüe** con URLs por idioma (`/fr/`, `/es/`, `/en/`).
- **Catálogo de propiedades**: listado con filtros (`Search`), ficha detalle
  (`PropertyDetail`) con galería/lightbox y mapa MapLibre.
- **Blog CMS**: posts multilingües (ProseMirror/TipTap), página índice y post.
- **Formularios de lead**: contacto, estimación, inquiry de propiedad,
  newsletter → tablas Supabase + notificación (email Resend + Telegram).
- **Panel admin** (`/admin`, protegido): dashboard, CRUD propiedades, CRUD
  blog, bandeja de contactos, perfil de agente, reset de contraseña.
- **i18n**: ~18 namespaces. About, GestionLocative y BuyerGuide traducidas
  el 2026-05-26 (antes estaban en francés hardcoded).
- **Auth Supabase** con tabla `agents` (roles `admin`/`agent`) + trigger de
  auto-provisioning (migración 005).
- **SEO base**: hreflang, og-rewrite edge function, img-proxy WebP.

## 4. Funcionalidades pendientes / incompletas

Ver `TODO.md` y `AUDIT_REPORT.md` para el detalle priorizado. Resumen:

- **Páginas legales** (Política de Privacidad, Mentions Légales, Términos,
  Cookies): los enlaces del footer apuntan a `#`. **No existen** → bloqueante UE.
- **UI de gestión de leads** en el admin: estimaciones y newsletter se capturan
  pero no hay pantalla para verlas (solo Supabase Dashboard).
- **Sitemap dinámico**: el generador existe pero **no llegó a `main`**; el
  `sitemap.xml` de producción está obsoleto.
- **Tests**: cero tests automatizados.
- **site_settings** con datos reales (teléfono/email/dirección) — hoy placeholders.
- **SMTP custom**, foto/bio de Sofia, planes Pro (acciones de Khalid).

## 5. Arquitectura general

```
Navegador (SPA React 19, BrowserRouter)
  main.tsx → AuthProvider → App (Routes)
    /            → detección de idioma → /:lang/
    /:lang/*     → Layout → páginas públicas (lazy + Suspense)
    /admin/*     → ProtectedRoute → páginas admin (lazy)
        │
        ▼
  Capa de servicios (src/services/*) — aísla el acceso a datos del UI
        │
        ▼
  src/lib/supabase.ts (cliente anon, protegido por RLS)
        │
        ▼
  Supabase (Postgres + Auth + Storage)
    tablas: agents, properties, neighborhoods, blog_posts,
            blog_post_translations, contact_submissions,
            estimation_requests, newsletter_subscribers,
            site_settings, favorites

  Netlify Functions (server-side):
    notify-lead.js        → Resend + Telegram (notifica leads)
    translate-property.js → DeepSeek API (traduce fichas) ⚠ SIN AUTH
  Netlify Edge Functions:
    img-proxy.ts (/img/*) · og-rewrite.ts (OG meta para RRSS)
```

## 6. Flujo de datos (captación de lead)

```
Visitante rellena formulario (Contact / Estimation / Newsletter)
  → src/services/{contact,leads}.service.ts valida + insert en Supabase (RLS)
  → notifyLead() → fetch /.netlify/functions/notify-lead (fire-and-forget)
  → notify-lead envía email (Resend) + Telegram al agente
  → respaldo siempre en BD; el agente lo ve en /admin/contacts
```
RLS de las tablas de leads: **anon puede INSERT**, solo **agents activos
pueden SELECT/UPDATE** (verificado 2026-05-26, HTTP 201).

## 7. Dependencias importantes

`@supabase/supabase-js`, `react` 19, `react-router-dom` 7, `i18next` +
`react-i18next`, `maplibre-gl`, `@tiptap/react` + extensions, `gsap` +
`@gsap/react`, `tailwindcss` 3.4, `zod` + `react-hook-form`, `sonner` (toasts),
`lucide-react` (iconos). Hay deps de scaffolding shadcn **sin usar**
(`@studio-freight/lenis`, `next-themes`, recharts, vaul, cmdk) — candidatas a
limpieza (ver AUDIT_REPORT TECH-005/007).

## 8. Variables de entorno

**Frontend (VITE_*, van al bundle — solo claves públicas):**
- `VITE_SUPABASE_URL` = `https://slxlkbrqcjabsfuhlwdf.supabase.co`
- `VITE_SUPABASE_ANON_KEY` (clave anónima, pública por diseño, protegida por RLS)

**Server-side (solo en Netlify env vars, NUNCA con prefijo VITE_):**
- `DEEPSEEK_API_KEY` 🔒 (traducción de fichas; rotada 2026-05-26)
- `DEEPSEEK_MODEL` (opcional, default `deepseek-chat`)
- `RESEND_API_KEY`, `AGENT_NOTIFY_EMAIL`, `AGENT_NOTIFY_FROM` (email de leads)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (notificación Telegram de leads)

> ⚠️ `.env.example` solo documenta las 4 primeras. Las de notificación faltan
> (AUDIT DEPLOY-002). El `.env` local está gitignored.
> **Service role key**: NUNCA en el frontend ni commiteada. Solo para
> operaciones admin puntuales del owner.

## 9. Integraciones externas

- **Supabase** — BD, auth, storage (buckets `property-images`, `agent-avatars`).
- **Netlify** — hosting, functions, edge functions, env vars. Site id
  `7af94674-6d3f-4258-94bf-4776f8a7e9c6`.
- **DeepSeek** — traducción automática de fichas de propiedad (server-side).
- **Resend** — envío de email de notificación de leads.
- **Telegram** — notificación de leads al agente.
- **Pexels** — fuente de fotos reales (regla: nunca IA).

## 10. Decisiones técnicas tomadas

- **i18n por archivos JSON namespaced** importados estáticamente en `src/i18n.ts`.
  `fallbackLng: 'fr'` (idioma base; nunca caer a inglés — fue un bug recurrente).
  Idioma en la URL es la única fuente de verdad (sin cache localStorage).
- **Capa de servicios obligatoria** entre UI y Supabase (algunas páginas aún la
  saltan — deuda menor, TECH-008).
- **`withTimeout` defensivo** en queries Supabase (se colgaban en móvil). Aplicado
  en property/blog/auth-signin; pendiente en settings/neighborhood/getAgent (QA-003).
- **Reset de contraseña**: workaround del deadlock de `@supabase/auth-js` durante
  recovery → race entre evento `USER_UPDATED` y la promesa (commit b21781d6).
- **Trigger de auto-provisioning** (migración 005): cada usuario en `auth.users`
  recibe fila en `agents` con `role='agent'`, `is_active=false` (default seguro).
- **Harness de ingeniería** instalado (`AGENTS.md`, `scripts/verify.sh`,
  `.claude/agents/`, `.claude/skills/`, `tasks/`, `progress/`).
- **Lock de auth Supabase deshabilitado** (noop) para evitar esperas de 5s
  (trade-off documentado, SEC-004).

## 11. Estado de salud (auditoría 2026-05-26)

Auditoría de 13 agentes → **score 22/100** (mecánicamente duro: 19.5 pts vienen
del área Pagos que es N/A en lead-gen). **La ingeniería de base es fuerte**
(TS estricto, 0 vulns npm, capa de servicios real). El score refleja la
*cantidad* de P0 (7), no mala artesanía. Camino a producción seria ≈ 1 sprint.
Detalle completo en `AUDIT_REPORT.md`.
