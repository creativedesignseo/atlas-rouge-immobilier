# tasks/current.md — Atlas Rouge active task queue

> Single page of what's being worked on **right now**. Keep it short.
> Older completed tasks live in `progress/`. Strategic plans live in
> `README.md`. Operational truth lives in `HANDOFF_REPORT.md`.

**Last updated:** 2026-07-22 (Redes sociales corregidas a Instagram+TikTok, quitado el menú de apps)

## Redes sociales + menú de apps — 2026-07-22 ✅ HECHO Y EN VIVO

El owner pidió: dejar solo **Instagram y TikTok** con los enlaces correctos,
usar **iconos gruesos de Font Awesome**, y **quitar el menú "Nos apps"** del
footer (todavía no hay app).

- ✅ URLs reales centralizadas en `lib/contact.ts` (`INSTAGRAM_URL`,
  `TIKTOK_URL`): `instagram.com/atlasrougeimmo` + `tiktok.com/@atlas.rouge.immo`.
- ✅ Iconos Font Awesome (brand, sólidos = gruesos) inline como SVG en
  `src/components/icons/SocialIcons.tsx` (sin instalar el paquete FA entero
  por 2 iconos). Footer los muestra como botones redondos; Contact.tsx
  también migrado (antes Instagram+Facebook de lucide).
- ✅ Quitada la columna "Nos applications" del footer + sus claves i18n
  muertas (`ourApps`/`iosApp`/`androidApp`/`emailAlerts` en fr/es/en);
  rejilla del footer 5 → 4 columnas.
- ✅ BD: migración `013_social_links.sql` aplicada (instagram_url real,
  tiktok_url añadido, facebook_url borrado) + seed + defaults actualizados.
- ✅ Verificado en el bundle JS **en vivo** de producción (commit `f4f2f27b`,
  deploy Netlify `ready`): ambas URLs presentes, `facebook.com` = 0,
  "Nos applications" = 0.

---


## Teléfono/WhatsApp real — 2026-07-21 ✅ UNIFICADO EN CÓDIGO Y BASE DE DATOS

El owner dio su número real (`+212 648 02 41 56`) para sustituir los dos
placeholders que nunca se habían usado (`+212524000000` teléfono,
`+212600000000` WhatsApp), repartidos de forma inconsistente en 6+ archivos.

- ✅ **Código**: `src/lib/contact.ts` (fuente central) + `settings.service.ts`
  + `Contact.tsx` + `PropertyDetail.tsx` + 3 enlaces `tel:` que estaban
  hardcodeados sin leer de ninguna fuente central (`About.tsx`,
  `Estimation.tsx`, `GestionLocative.tsx`) + `services.json` en los 3 idiomas.
- ✅ **Base de datos real**: migración `012_update_contact_phone.sql`
  aplicada con `npm run migrate` sobre `site_settings` (proyecto Supabase
  `slxlkbrqcjabsfuhlwdf`). `supabase/seed.sql` también actualizado.
- ✅ **Verificado en producción dos veces** (commit `0e15addc`, deploy
  Netlify `ready`): número real confirmado presente en el bundle JS servido
  en `atlasrouge.com` (`curl` directo al `.js` desplegado — no solo el HTML,
  que en esta SPA no lo mostraría).
- ✅ **De paso**: se encontró y borró `brand/Agente/remotion/build/` (298 MB,
  caché de render de vídeo sin trackear) que rompía `npm run lint` de todo
  el sitio porque `eslint.config.js` no excluye `brand/` de su
  `globalIgnores`. **Sigue pendiente** arreglar la causa raíz (añadir
  `brand` a `globalIgnores`) para que el trabajo de vídeo no pueda volver a
  romper el `verify.sh` del sitio.

---

## Correo corporativo — Zoho Mail — 2026-07-15 ✅ CONTRATADO Y MIGRADO EN CÓDIGO

El owner adquirió y configuró el correo corporativo con **Zoho Mail** sobre
el dominio `atlasrouge.com`. Coste: **13 €/año (IVA incluido)**, facturación
anual — próxima renovación esperada ~2027-07-15.

- ✅ **Migrado en código** (mismo día): `netlify/functions/notify-lead.js`
  ahora usa por defecto `info@atlasrouge.com` (antes `info@atlasrouge.ma`)
  tanto para `TO_EMAIL` como para `FROM_EMAIL` (antes `noreply@atlasrouge.ma`
  — se unificó a `info@` porque es la única cuenta real provisionada en
  Zoho). Placeholders de email en el login del admin (`AdminLogin.tsx` +
  `src/locales/{fr,es,en}/admin.json`) actualizados de `admin@atlasrouge.ma`
  a `admin@atlasrouge.com`. `verify.sh` en verde tras el cambio.
- ⏳ **Sin confirmar/verificar** (bloqueado por el clasificador de seguridad
  al intentar una lectura de la tabla `agents` sin autorización explícita
  del owner en el mensaje): si el segundo admin existente, **Sofia**
  (documentado en `HANDOFF.md` como `admin@atlasrouge.ma`), tiene ese mismo
  email como credencial de login real en Supabase Auth. **No se tocó** —
  cambiar el email de login de una cuenta real es una acción de credenciales,
  no un simple texto, y podría dejarla sin acceso. Si el owner quiere
  actualizarlo también, hay que confirmarlo explícitamente y coordinarlo con
  Sofia (cambio de email en Supabase Auth invalida la sesión/requiere que
  ella confirme el nuevo correo).
- Si en el futuro se quiere actualizar `AGENT_NOTIFY_EMAIL`/`AGENT_NOTIFY_FROM`
  como env vars reales en Netlify (en vez de depender del fallback en
  código), o automatizar algo del correo, la nueva CLI oficial de Zoho Mail
  es el camino a evaluar primero (explorada a nivel informativo, no instalada).

---

## Vídeo 2 · Conciergerie/Airbnb (Remotion) — 2026-07-07 🟡 EDITADO, falta cerrar

Montado en `brand/Agente/remotion` (composición `AtlasRougeConciergerie`,
720×1280 vertical, ~25s). Ronda de correcciones ya aplicada: corte seco entre
clips, glitch de IA recortado (clip2 acortado a 189 frames), subtítulo basura
quemado tapado, zoom/paneo continuo en los 3 clips (swing marcado en el
clip 1), voz con ganancia ×1.35, música al 28%/40%. Detalle completo en
`HANDOFF_REPORT.md`. **No es código de la web — vive fuera de git, en
`brand/Agente/`, no hay nada que desplegar.**

- 🔴 **Bloqueado esperando al owner:** pidió insertar 2 imágenes de apoyo
  (cutaways de hotel/conciergerie) en vez de la banda negra actual — las
  pegó en el chat pero no quedaron guardadas como archivo; hay que esperar a
  que las guarde en `brand/Agente/Video 1/` y confirme el nombre.
- ⏳ Música elegida (`leberch-real-estate-262604.mp3`) es una elección por
  defecto, no confirmada por el owner — puede cambiar.
- ⏳ No verificado en móvil real ni en Meta Ads Manager, solo en fotogramas
  extraídos con `ffmpeg`.
- ⏳ Video 1 (Gestión alquiler largo) y Video 3 (Vender) del plan de 3 vídeos
  siguen sin grabar.

---

## Grafo de conocimiento (/graphify) — 2026-07-06 ✅ GENERADO, hallazgos corregidos

Primera corrida de `/graphify` sobre el repo completo: 1685 nodos, 2857
aristas, 124 comunidades. Salidas en `graphify-out/` (`graph.html`,
`graph.json`, `GRAPH_REPORT.md`). Detalle completo en `HANDOFF_REPORT.md`.

- ✅ **README.md corregido**: las 5 menciones de MapLibre/CARTO ahora dicen
  Mapbox GL JS v3, acorde al código real.
- ✅ **Duplicación de `compressToWebp()` consolidada**: `ImageUploader.tsx`
  ahora importa la versión compartida de `lib/imageCompress.ts` en vez de
  tener su propia copia. `tsc`/`verify.sh` verdes.
  - ⏳ **Falta probar en el navegador** (subir una imagen real en el admin) —
    no verificado en runtime esta sesión, solo a nivel de tipos/build.
- 📌 `cn()` es el nodo más conectado (288 aristas) — mayor blast radius del
  proyecto si se toca sin cuidado.
- Para mantenerlo al día: `graphify . --update` (incremental, solo
  re-extrae archivos cambiados).

---

## Google Ads — campaña propietarios — 2026-07-06 🟢 CAMPAÑAS CREADAS, SIN ACTIVAR

Las 3 campañas (`Atlas Rouge - FR-France` 15€/día, `FR-Diaspora` 9€/día,
`Maroc` 6€/día) están creadas en la cuenta real `freecoche` (407-193-7268),
estado **Pendiente — anuncios en revisión**, confirmado en pantalla por el
owner (no solo Editor). Se subieron vía **Google Ads → Herramientas →
Acciones masivas → Cargas**: 3 campañas + 15 grupos + 102 keywords + 66
negativas + 15 anuncios, las 5 "Ha finalizado correctamente". Detalle en
`HANDOFF_REPORT.md`.

**Carpeta de trabajo:** `marketing/google-ads-templates/` (a petición del
owner) — ahí viven las 5 plantillas MCC + la nueva de ajuste, ya no hay
copias sueltas en `marketing/`.

- 🔴 **Pendiente de confirmar:** el owner debe subir
  `marketing/google-ads-templates/keyword_remove_low_volume_mcc_template.csv`
  (18 filas, `Action: Remove`) — borra 6 keywords que Google marcó "Entidad no
  apta - Volumen de búsquedas bajo" en `A - Vendre` (redundantes con keywords
  de frase ya activas). **No confirmado todavía que se haya subido.**
- 🔴 **Bloqueante de facturación:** la cuenta muestra "Se requiere un nuevo
  método de pago" — resolver antes de activar nada.
- 🔴 **Bloqueante no verificado esta sesión:** tracking de conversión (GA4 +
  conversión de Ads). Última vez comprobado en código (2026-06-05): NO existía.
  Falta re-verificar antes de activar cualquier campaña.
- ⚠️ **NO ACTIVAR las campañas** hasta cerrar los 3 puntos rojos de arriba.
- 📌 **Lección para el futuro:** las keywords originales se escribieron sin
  verificar volumen real (Semrush no disponible por plan). Cualquier keyword
  nueva debe pasar antes por el Planificador de palabras clave de Google Ads.
- ⚠️ Se vio en pantalla otra sesión de IA en paralelo (ventana "HANDOFF status
  review") con un diff de +4969 líneas sin revisar — el owner dijo que no es
  relevante aquí, pero si reaparece un PR de esa sesión, revisarlo antes de
  fusionar.

---

## French Modern Direction — 2026-06-22 ✅ GUARDADA Y VERIFICADA EN PROD

Nueva dirección visual para una inmobiliaria moderna francesa, separada de las
pruebas Marrakech. Se guardó con nombre fijo `French Modern Direction` y se
publicó un brand book HTML navegable.

Verificado en producción:
- `https://atlasrouge.com/french-modern-direction` → `200 OK`
- `https://atlasrouge.com/design-books/french-modern-direction/` → `200 OK`
- brand book HTML expone el título `French Modern Direction`

Artefactos:
- `src/pages/FrenchModernDirection.tsx`
- `public/design-books/french-modern-direction/index.html`
- `docs/design-directions/french-modern-direction.md`

Estado: listo para reutilizar en próximas iteraciones de marca.

---

## Nuevo servicio: Conciergerie / alquiler turístico — 2026-06-10 ✅ EN VIVO (`4dedfc87`, deploy ready)

Khalid pidió añadir el servicio de **conciergerie de location courte durée**
(gestión Airbnb: propietario cede el bien → agencia lo gestiona en Airbnb/Booking
→ comisión sobre ingresos). Es distinto de la "Gestión de alquileres" actual
(larga duración, planes 8/10/12 %). Decisión: **fundido en la misma página
`GestionLocative`** (sin tocar la rejilla del home), **solo el servicio** (cluster
de blog después).

Implementado y verificado en preview (FR/ES/EN, Playwright, sin claves crudas):
- `src/pages/GestionLocative.tsx`: nueva sección midnight con 6 tarjetas + "Cómo
  funciona" + CTA "Solicitar presupuesto" → /contact; badge "Larga duración" sobre
  lo existente para diferenciar la pareja.
- `src/locales/{fr,es,en}/services.json`: `rental.concierge.*` (paridad OK).
- `src/locales/{fr,es,en}/home.json`: card `management` menciona ambas modalidades.

⚠️ **NO se inventaron cifras.** Precio = "presupuesto a medida"; modelo = "comisión
sobre ingresos, sin gastos fijos". **Pendiente de Khalid** para mostrar cifras:
(1) comisión real (¿~20 %? ¿tramos?), (2) qué incluye, (3) ¿tiers o todo-incluido?
**Fase 2:** cluster SEO de blog de captación (destino de Ads propietarios + `/epure`).

---

## Landing de captación de propietarios — 2026-06-08 🎨 EN MAQUETA (no es la web real)

Exploración de una landing para captar propietarios que venden en Marrakech.
Maquetas estáticas aisladas en `public/` (no tocan la SPA), todas EN VIVO:
`/vendre` (réplica Semrush), `/atlas-luxe`, `/prestige` (descartada), `/lumiere`,
y **`/epure` = la ELEGIDA** (blanca, limpia, elegante). El formulario de `/epure`
ya inserta leads en `contact_submissions` + `notify-lead` (FR). Detalle completo
en `HANDOFF_REPORT.md`.
- ⏳ Pendiente: fotos reales (no demo), idioma final, probar lead end-to-end,
  decidir si se integra en la SPA, y limpiar archivos sueltos
  (`public/prueba/`, `semrush-lp-full.jpeg`, `document/`).
- ⚠️ `/vendre` usa la fuente **Lazzer** (propietaria de Semrush) — solo maqueta,
  NO producción sin licencia.

---

## Fix filtros móvil (Search) — 2026-06-06 ✅ EN VIVO (`f6767dbf`, deploy ready)

En el panel de Filtros móvil, los checkboxes pintaban la casilla pero NO tenían
`onClick`/toggle (el panel desktop sí). Afectaba a **Barrios, Tipo, Estado,
Equipamiento y Multimedia**. Arreglado con `toggleArr` + `onClick` y área táctil
mayor en `MobileFilterDrawer` (`src/pages/Search.tsx`). **Confirmado EN VIVO** en
`atlasrouge.com` con Playwright (390×844): las 5 secciones marcan/desmarcan y el
contador "Ver N resultados" se actualiza. Commits: `407f2dd4` (barrios/tipo) +
`f6767dbf` (estado/equipamiento/multimedia).

## Causa raíz "no carga a la primera" — 2026-06-06 ✅ EN VIVO (`13687e8a`)
ADR-002 (cliente anónimo `supabasePublic` para lecturas públicas) + invariante y
matriz de 3 personas + regla "reproduce-primero" en `AGENTS.md`.

## Filtros que no filtraban — 2026-06-06 ✅ (cablear + limpiar)
Los filtros del panel se marcaban pero NO afectaban a los resultados: la query
solo usaba 8 campos y `const filtered = allProperties` no filtraba más. Añadido
`applyClientFilters` (Search.tsx) que filtra sobre la lista ya cargada por
**Equipamientos** (amenities, AND), **Habitaciones**, **Sup. terreno**,
**Multimedia** (video/3D) y **Estado** (exclusivité / recientes ≤90d). Verificado
con datos reales: marcar "Piscina" → 14→8. Eliminados **Vista** y **Estilo** (no
existen esos campos en la BD; eran controles muertos) y recortado **Estado** a las
opciones con datos. Detalle de qué filtros existen: ver ADR/HANDOFF.

## ⏳ Pendiente (verificado, no resuelto)
- **UX desktop:** en los checkboxes del panel desktop (barrios/tipo/estado/
  equipamiento/multimedia) el clic solo responde en la casilla, no en el texto
  (móvil ya es fila completa). Mejora menor pendiente.
- Filtro **Radio (km)** sigue siendo decorativo (sin lógica de geo-radio).
- **2 errores de consola** en `/es/comprar` (no rompen nada; sin investigar).
- Landing "Regalitos" (`/bold-type-landing`) sin empezar.

---

## Resiliencia de primera carga — 2026-06-05 ✅ IMPLEMENTADO + VERIFICADO (sin commitear, sin deploy)

Fix del bug "la web no carga a la primera, hay que recargar". Tres causas
cerradas: (1) guard de stale-chunk que se atascaba → ahora por timestamp con
cooldown; (2) sin reintentos ni timeout en datos → nuevo `withRetry`/`withTimeout`
en `src/lib/retry.ts`, agujero de timeout de `neighborhood.service` cerrado;
(3) `Home` sin estado de error → spinner→error+retry por sección; LangDetector
síncrono (sin blanco en `/`). Añadido beacon de auto-reporte de errores
(`src/lib/reportError.ts` + `netlify/functions/report-error.js`, sin BD ni PII).
Verificado con preview prod + Playwright: retry transitorio auto-cura sin mostrar
error, fallo total muestra retry, recuperación OK, GSAP sin regresión, beacon
dispara. `verify.sh` verde. Detalle: `progress/2026-06-05-first-load-resilience.md`.
- ⏳ Pendiente: commit + push (Netlify auto-deploya). Tras deploy, vigilar
  function logs (`[client-error]`); opcional `TELEGRAM_BOT_TOKEN`/`_CHAT_ID` en
  Netlify env para ping a Telegram.

---

## Logo de marca v1 — 2026-06-04 ✅ IMPLEMENTADO (sin commitear, sin deploy)

El owner entregó el vector final `logo-atlasrouge-v1.svg` (lockup apilado:
isotipo de montañas terracota sobre wordmark `ATLAS ROUGE` navy; colores =
tokens de marca exactos `#B5533A` / `#172033`). Implementado en la web:
- `public/logo.svg` (color, navbar) + `public/logo-reverse.svg` (wordmark cream
  para footer sobre midnight).
- `Navbar.tsx` y `Footer.tsx` ahora usan `<img>` del logo en vez del texto.
- Favicon sin tocar (montaña demasiado apaisada para 16px; el `AR` actual ya es
  de marca). `verify.sh` verde, verificado visualmente en headless Chrome.
- ⏳ Pendiente: commit + push (Netlify auto-deploya). Detalle:
  `progress/2026-06-04-logo-vectorization.md`.

---

## Auditoría de producción (saas-audit full) — 2026-06-03 ✅ Score 40/100 🔴 NOT READY

13 agentes. Informe en `AUDIT_REPORT.md` (anterior 22/100 en
`AUDIT_REPORT.2026-05-26.md`). Matiz: +20 "gratis" de Pagos (N/A lead-gen) y el
cap por área aplasta a 0 áreas que están bien; sobre áreas aplicables ≈ 24/80.
**3 P0:** DB-001 (drift de migraciones), LEGAL-001 (sin Política de Privacidad),
LEGAL-002 (sin Mentions Légales). ~26 P1.

### Fase 0 — quick wins ✅ DESPLEGADO (`847ff042`)
6 fixes en código, `verify.sh` verde: UX-001 (CTA móvil cableado), TECH-001
(plugin Vite fuera de prod), PERF-008 (mapbox chunk), LEGAL-004 (eliminada fuga
de IP a ipapi.co), QA-002 (`subject:'buy'`), QA-003 (estado de error en Search +
empty state i18n), PERF-002 (favicon).

### Batch 2 — 13 hallazgos (2 agentes paralelos) ✅ DESPLEGADO
Admin/negocio: ADM-001 (pantalla de leads estimación+newsletter + CSV),
ADM-004 (gate borrado), ADM-006 (link), ARCH-001 (Favoritos contra BD).
Público: UX-002 (Search i18n), SEC-001 (XSS popup mapa cerrado), UX-005/006/007
(footer/Lightbox/Share), PERF-004/005 (JSON-LD), PERF-006 (fuentes a <link>),
ARCH-002 (sin datos demo en prod). tsc+verify verdes, paridad i18n OK.

⏳ **Pendientes de Fase 0:**
- `og-image.jpg` 1200×630 real (necesita foto del owner; no IA).
- **Legal (P0):** páginas Política de Privacidad + Mentions Légales (abogado + datos Khalid).
- **DB-001 baseline:** `pg_dump` de prod → `000_baseline_prod.sql`, limpiar SQL
  divergentes (operación delicada, requiere OK explícito).
Roadmap completo (Fases 1-3) en `AUDIT_REPORT.md`.

---

## Nuevo barrio "Route de Ouarzazate" — 2026-06-03 ✅ EN VIVO (solo datos, sin deploy de código)

Alta de un barrio nuevo. **Sin cambios de código**: la tabla `neighborhoods`
de Supabase es la fuente de verdad y alimenta a la vez el home (rejilla de
barrios), el desplegable de Barrio del admin y el buscador. Pasos:

- Foto (Aït Benhaddou, aportada por el owner, 720×480 → baja resolución)
  optimizada a JPG 1200×800 (mismo ratio 3:2, sin crop) y subida al bucket
  `property-images/neighborhood-route-ouarzazate.jpg` (render 200). Original
  archivado como WebP en `source-images/neighborhoods/route-ouarzazate/`
  (gitignored).
- Fila insertada (`id e51f7b8d`, slug `route-ouarzazate`, `property_count 0`,
  textos FR factuales). Detalle: `progress/2026-06-03-add-route-de-ouarzazate.md`.

⚠️ **Decisión técnica a recordar:** la inserción se hizo vía Management API
(PAT, que salta RLS) porque `neighborhoods` **solo tiene policy SELECT pública,
ningún INSERT/UPDATE/DELETE** → hoy ni un admin puede crear/borrar barrios
desde la web. Esto motiva la siguiente tarea.

### Gestión de barrios en el admin (Fase 1) — ✅ DESPLEGADO (`8219d357`)
CRUD de barrios en el admin (crear/editar/soft-delete/borrar) hecho como los
pros. **`verify.sh` verde.** Migración `011` **aplicada en prod y verificada**
(4 políticas RLS, trigger activo, drift corregido: Médina 2→3). Pusheado a
`main` → Netlify auto-deploy. ⏳ Pendiente: smoke-test del UI admin en vivo +
verificar que un agente no-admin no puede escribir (falta agente de prueba).

Implementado:
- `supabase/migrations/011_neighborhood_admin.sql`: `is_active` (soft-delete),
  RLS INSERT/UPDATE/DELETE solo admin (`is_admin()`), SELECT público solo
  activos (o admin), **trigger** que mantiene `property_count` desde
  `properties` + backfill que corrige el drift (Médina 2→3).
- Servicio `src/services/admin/neighborhoodAdmin.service.ts` + helper REST
  `src/lib/adminRest.ts` + util `src/lib/imageCompress.ts`.
- UI: `src/pages/admin/AdminNeighborhoods.tsx` +
  `src/components/admin/NeighborhoodForm.tsx` (subida de foto única → WebP).
- Ruta `/admin/neighborhoods` (App.tsx) + item de menú **solo admins**
  (AdminSidebar). i18n FR/ES/EN (`admin.json` → `neighborhoods.*`).
- `neighborhoods.service.ts` filtra `is_active`; tipo `NeighborhoodRow` +
  interfaz `Neighborhood` con `is_active`/`isActive`.

Detalle: `progress/2026-06-03-neighborhood-admin-crud.md`.

### Fase 2 (ciudades / multi-país) — PLANIFICADA, no empezada
Subir `city` a entidad (`cities`), cascada Ciudad→Barrio, `UNIQUE(parent_id,
slug)`, CRUD de ciudades. Modelo **clon por agencia** (single-tenant). NO
multi-tenant ni PostGIS (sobre-ingeniería). Pendiente de confirmar alcance.

---

## Precio opcionalmente oculto ("Prix Nous Consulter") — 2026-06-02 ✅ DESPLEGADO Y VERIFICADO (`16dae844`)

Nueva perilla (Switch) junto al precio en el form admin: al activarla, el
inmueble se marca `price_on_request`. El precio se sigue guardando (el agente
lo ve), pero el sitio público muestra "Prix Nous Consulter" / "Precio a
consultar" / "Price on request" en vez del número. Flag booleano end-to-end
(imita `is_featured`): migración `010`, tipos, servicios, form y los 6 puntos
de render (PropertyCard, Search ×4 incl. mapa, PropertyDetail). Lógica de
display centralizada en `src/hooks/usePropertyPrice.ts`.

**Verificado en runtime (Claude, vía Management API + Playwright, SIN tocar la
sesión del owner):** puse el flag a una propiedad de prueba → la ficha muestra
"Precio a consultar" en el precio principal, y su card en `/comprar` también
("villa850: false"). Flag revertido tras la prueba. El número `850.000` que
apareció en la sección "similares" del preview era **fallback a datos mock**
(`getSimilarProperties` cae a `mockProperties` cuando la query falla/timeout),
no una fuga de la feature. `verify.sh` verde; migración `010` aplicada.
Detalle: `progress/2026-06-02-price-on-request.md`.

> ⚠️ Observación (separada, pre-existente): `getSimilarProperties` hace
> fallback a inmuebles MOCK si su query falla. En el preview local cayó a mock.
> Conviene comprobar que en PROD no muestre inmuebles falsos en "similares".

---

## Rediseño tabla de specs (ficha) estilo BARNES — 2026-06-02 ✅ DESPLEGADO Y VERIFICADO

En `PropertyDetail`, las specs pasaron de tarjetas con icono a **tabla
label/valor a 2 columnas con líneas finas, sin iconos** (`InfoRow`); los
equipamientos usan un **check uniforme** (sin los iconos variados), a 4
columnas. Eliminado código muerto (`amenityIconMap` + 13 SVG + imports lucide).
Filas sin valor se ocultan (barrio vacío no deja etiqueta colgando). Verificado
con Playwright (2 fichas). Shipeado dentro de `16dae844` (junto al precio).

---

## Modal de borrado nativo → AlertDialog del sistema de diseño — 2026-06-01 ✅ DESPLEGADO

Las 3 acciones de borrar (inmueble, artículo, contacto) usaban
`window.confirm()` nativo. Ahora usan un `useConfirm()` (promesa) + `ConfirmProvider`
montado en `AdminLayout`, sobre el `AlertDialog` shadcn/Radix existente, con
botón "Eliminar" en rojo. Añadido `actions.cancel` en fr/es/en. Commit `87735bec`.
Verificado: tsc + verify.sh verdes. NOTA: solo saca del modal nativo; el rediseño
visual del sistema de diseño es trabajo aparte (el owner ya dijo que no le gusta).

---

## Retraso al cargar el panel admin — 2026-06-01 ✅ RESUELTO Y DESPLEGADO

`checkAuth` hacía `await validateSession()` (un `getUser()` al servidor,
añadido en el fix de sesión zombi `d0e6e695`) **antes** de bajar `isLoading`,
así que el spinner de `ProtectedRoute` bloqueaba CADA carga con ese round-trip
extra. El caso zombi es raro → mala compensación. Fix (`3698de76`):
`validateSession()` pasa a segundo plano (`.then`), el panel se pinta en cuanto
responde `getAgent()`. Las 7 consultas del dashboard ya iban en paralelo (OK).
Verificado: tsc + verify.sh verdes.

---

## Crear inmueble desde el admin — 2026-06-01 ✅ RESUELTO Y DESPLEGADO (cadena completa)

Toda la cadena de bugs que bloqueaba crear inmuebles está cerrada y en `main`
(= desplegada). `HEAD == origin/main == 92fe90e1`, `verify.sh` verde, función
en prod confirmada nueva (`reason: "missing_authorization"` sin token).

| # | Bug | Commit | Por |
|---|-----|--------|-----|
| 1 | 400 al guardar (`neighborhood_id` slug→uuid) | `701f8821` | Claude |
| 2 | Sesión zombi → 401 (validar contra servidor) | `d0e6e695` | Claude |
| 3 | **`translate-property` 401** (anon key runtime desalineado con el proyecto del JWT) | `d0bc223c` | Codex |
| 4 | Imágenes colgadas → REST directo Storage | `d521c7d6` | Codex |
| 5 | Guardar colgado → REST directo PostgREST | `5110413c` | Codex |
| 6 | Listado colgado → REST directo PostgREST | `92fe90e1` | Codex |

Detalle, causa raíz y lecciones: `HANDOFF_REPORT.md` (cierre 2026-06-01
post-Codex) + entradas de Codex. `CODEX_HANDOFF_401.md` queda como histórico.

Pendiente menor (no bloquea):
- [ ] Owner confirma el flujo real end-to-end tras el deploy.
- [ ] Crear **agente de prueba** dedicado (verificar sin tocar la cuenta del owner).
- [ ] CSP: `ipapi.co/json` bloqueado (geo-lookup) — añadir a `connect-src` o quitar. Cosmético.

---

## `translate-property` 401 con sesión admin fresca — 2026-06-01 ✅ DESPLEGADO

Síntoma reportado: `/.netlify/functions/translate-property` devolvía
401 `Active agent session required` incluso con login fresco en incógnito, y
bloquea crear inmuebles. Contexto completo en `CODEX_HANDOFF_401.md`.

Fix implementado por Codex y desplegado en `main` commit `d0bc223c`:
- `netlify/functions/translate-property.js`: auth de agente activo ya no es una
  caja negra; devuelve `reason`, loguea intentos sin tokens, usa timeout y
  mantiene sesión válida + fila `agents` activa vía RLS. Añadido fallback seguro
  para validar con el access token como `apikey` si el anon key runtime está
  desalineado.
- `src/services/translation.service.ts`: nunca llama la función sin Bearer
  (fallback a `localStorage` si `getSession()` no responde) y solo redirige a
  login cuando el 401 indica sesión muerta, no por fallos de verificación de
  agente/config.

Verificación: `npx tsc -b --noEmit` verde; `node --check
netlify/functions/translate-property.js` verde; `bash scripts/verify.sh`
verde (3 warnings Fast Refresh preexistentes, build OK). Producción verificada:
sin token devuelve 401 con `reason: "missing_authorization"`, confirmando que
la función nueva está viva.

---

## Sesión zombi → 401 en traducir/subir — 2026-06-01 ✅ RESUELTO Y DESPLEGADO

El navegador guardaba un token en localStorage de una sesión ya borrada en
el servidor (revocada por un signOut global previo). `checkAuth` solo leía
localStorage → UI "logueada" pero 401 en cada llamada autenticada. Fix:
`validateSession()` pregunta al servidor (`getUser()`) al cargar y purga el
token zombi → login limpio. Verificado vía Management API (auth.sessions
vacío para el user). Desbloqueo del owner: cerrar sesión + entrar de nuevo.
Detalle: `HANDOFF_REPORT.md` (cierre 2026-06-01 noche 2ª parte).

⚠️ **REGLA:** verificar SIEMPRE con un AGENTE DE PRUEBA dedicado, NUNCA con
la cuenta del owner (un signOut global le deja sesión zombi). Pendiente:
crear ese agente de prueba.

---

## Crear inmueble — HTTP 400 — 2026-06-01 ✅ RESUELTO Y DESPLEGADO

El formulario de admin nunca pudo crear inmuebles: el `<select>` de Barrio
mandaba el **slug** pero `properties.neighborhood_id` es `uuid` (FK) →
`invalid input syntax for type uuid` → 400. Fix en 4 archivos (select usa
`n.id`, `''`→`null` en `toDbInsert`, tipo `Neighborhood.id`, mapper). Arregla
también la edición. Verificado vía Management API (insert con null y uuid →
OK, rollback). Detalle en `HANDOFF_REPORT.md` (cierre 2026-06-01 noche) y
`progress/2026-06-01-fix-property-create-400.md`.

---

## i18n panel admin + amenities — 2026-05-30 ✅ DESPLEGADO Y VERIFICADO

Commits `7a671e34` + `cbb235fa` en `main`. Detalle:
`progress/2026-05-30-i18n-admin-amenities.md`.

- [x] `PropertyForm` labels FR → i18n + auto-traducir al guardar (Parte B).
- [x] `AdminLogin` → claves `login.*`.
- [x] **Amenities** traducidas en TODA la web (admin + cards + filtros + ficha):
      `amenities.json` poblado (16 de BD), helper `src/lib/amenities.ts`.
- [x] Verificado en prod (Playwright): admin form y público 100% en ES,
      `stillFrench: []`.
- [x] **Conmutador de idioma FR|ES|EN** en el panel de Traducciones de
      `PropertyForm` (commit `28cc33cd`, desplegado): pestañas en vez de
      acordeones, editable, badge `fuente` + punto verde si rellenado.
      Verificado en prod (pestaña FR muestra el contenido francés).

### Pendiente relacionado
- [ ] **Batch de CONTENIDO** (títulos/descr/highlights de inmuebles) — sigue
      bloqueado esperando `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (RLS
      bloquea UPDATE con login admin). Script listo:
      `scripts/translate-existing-properties.mjs` (sin commitear aún, con
      `package.json` translate:properties). Owner pone la key → corro
      `npm run translate:properties`.

---

## Mapbox migration — 2026-05-30 ✅ DESPLEGADO Y VERIFICADO EN PROD

Map engine migrado MapLibre GL → **Mapbox GL JS v3** (estilo **Standard 2D
plano**) en `Search.tsx` (MapView) y `LocationMap.tsx`, vía `src/lib/mapbox.ts`.
Commit `70af4956`, desplegado en https://atlasrouge.com. Detalle:
`progress/2026-05-30-mapbox-migration.md`.

- [x] Código: `maplibre-gl` → `mapbox-gl@3.24`, `src/lib/mapbox.ts`,
      `src/vite-env.d.ts`, `.env.example`, guard `hasMapboxToken` + fallback,
      `canUseWebGL` exige WebGL2.
- [x] CSP en `netlify.toml`: `connect-src` + api/events.mapbox.com,
      `worker-src 'self' blob:`.
- [x] `VITE_MAPBOX_TOKEN` en Netlify (all contexts). Token restringido a
      atlasrouge.com (correcto). NO commiteado en el repo.
- [x] Deploy + verificación en vivo: tiles HTTP 200, 0 errores, basemap OK.
- [ ] (Opcional, solo dev local) owner añade `localhost` a las URLs del token o
      usa el Default public token + `VITE_MAPBOX_TOKEN` en `.env.local`.

---

## Current state

Site is **live in production** on Netlify (`atlasrouge.com`).
`origin/main` last commit `34af320b`. verify.sh green.

⚠️ **There is unmerged, uncommitted Phase 0 work in the working tree**
(2026-05-29). The code is written and verify.sh is green, but **the SQL
has NOT been applied in Supabase Studio and NOTHING has been deployed**.
These are fixes **implemented, pending SQL apply + deploy** — not yet
live in production. See the section below.

A **13-agent production-readiness audit** ran 2026-05-26 →
`AUDIT_REPORT.md` at repo root. **Score 22/100 🛑** (mechanically
harsh: 19.5 pts come from the N/A Payments area; the engineering
foundation is strong — TS strict, 0 npm vulns, real service layer).
**7 P0s** identified; 2 fixed 2026-05-26 (i18n), 3 engineering P0s
implemented 2026-05-29 (pending apply/deploy), 2 legal P0s still owner-
side. See the lists below and `AUDIT_REPORT.md` for the full roadmap.

---

## Phase 0 — implemented 2026-05-29 (pending SQL apply + deploy)

These are **code-complete and verify.sh-green**, but **not live**: the
SQL must be pasted by the owner in Supabase Studio and the branch must
be committed + pushed (Netlify auto-deploys `main`). Until then,
production still has the original holes.

- [x] **P0-1 · Privilege escalation (SEC-001/DB-001/ADM-001)** —
      **APPLIED IN PRODUCTION 2026-06-01.** Migration
      `supabase/migrations/006_fix_agent_update_rls.sql` applied via SQL
      Editor (project `slxlkbrqcjabsfuhlwdf`). ⚠️ Real policy name in prod
      is `agents_update_own` (NOT "Agent can update own row" — the prod DB
      wasn't built from these numbered migrations; names differ). Verified
      live with `pg_policies`: `agents_update_own` now has a `WITH CHECK`
      that freezes `role`/`is_active` via subquery (was NULL → escalation
      open). Hardening block sets `search_path` on all `public.is_*`
      helpers (tolerant DO block; the literal `ALTER FUNCTION public.is_agent()`
      failed because those exact names don't exist in prod). Client side:
      `updateAgent()` in `src/services/auth.service.ts` narrowed to
      `AgentSelfUpdate` (`Pick` name/phone/bio/photo_url) — still
      uncommitted in working tree.
- [~] **P0-4 · Canonical/hreflang dynamic** — implemented.
      `netlify/edge-functions/og-rewrite.ts` now rewrites canonical +
      hreflang per route on all pages (`config.path` widened to
      `/fr/*`, `/es/*`, `/en/*`). New `scripts/generate-sitemap.mjs` +
      `prebuild` in `package.json` generate a dynamic trilingual sitemap
      (posts/properties/neighborhoods, domain `atlasrouge.com`, fault-
      tolerant). `public/sitemap.xml` is now build output (gitignored,
      no longer tracked). Closes PERF-002 too. **⚠️ Not deployed.**
- [~] **P0-5 · Migration drift** — implemented. New
      `supabase/migrations/000_base_schema.sql` (idempotent
      `CREATE TABLE IF NOT EXISTS` for neighborhoods / properties /
      contact_submissions / favorites / site_settings). Rebuilding from
      `migrations/` no longer fails on 001. **Do not re-apply over prod.**
- [~] **Close open serverless functions (SEC-002/003, P1 pulled
      forward)** — implemented. `translate-property.js` now requires an
      active-agent session (JWT validated against `/auth/v1/user` +
      agents check) + CORS allowlist + best-effort rate-limit;
      `notify-lead.js` gets CORS + OPTIONS + origin check;
      `translation.service.ts` attaches the Bearer token. **⚠️ Not
      deployed; needs Netlify env vars (see owner boundaries).**
- [~] **Error Boundary (ARCH-002, P1 pulled forward)** — implemented.
      New `src/components/ErrorBoundary.tsx` mounted in `main.tsx`, i18n
      fallback (new keys in `src/locales/{fr,es,en}/errors.json`).

### Owner boundaries to close this Phase 0 (next steps)
- [ ] **Apply `supabase/migrations/006_fix_agent_update_rls.sql`** in
      Supabase Studio, then **verify a non-admin agent cannot self-
      promote** (`update({role:'admin'})` from DevTools must be rejected).
- [ ] **Verify Netlify env vars**: the build/sitemap needs
      `SUPABASE_URL` + `SUPABASE_ANON_KEY` (or service key); the
      functions need `SUPABASE_URL` + `SUPABASE_ANON_KEY` to validate
      the JWT. Without them the prebuild sitemap and the function auth
      degrade.
- [ ] **Approve commit + push** of the working-tree changes (Netlify
      auto-deploys `main`).

---

## P0 — still open (owner / legal — needs Khalid + lawyer)
- [ ] **P0-2 · Privacy Policy (RGPD)** — none exists. Lawyer.
- [ ] **P0-3 · Mentions Légales** — mandatory in France. Lawyer + RC/ICE.

### Already fixed 2026-05-26
- [x] ~~**UX-001/UX-002 — i18n of GestionLocative, BuyerGuide, About**~~
      DONE 2026-05-26 (commit `593e47ae`). 218 keys translated FR/ES/EN
      by 3 parallel subagents. Key parity verified, build green.

---

## P0 — owner config (Khalid) — pre-launch

- [x] ~~**Rotate `DEEPSEEK_API_KEY`**~~ — DONE 2026-05-26. Old key
      `sk-d047f...8752` deleted on platform.deepseek.com. New key
      configured in Netlify env vars as `DEEPSEEK_API_KEY` 🔒
      (Specific scopes: Builds, Functions, Runtime · 4 deploy
      contexts). `VITE_DEEPSEEK_API_KEY` also removed from Netlify.
      Verified live: `POST /.netlify/functions/translate-property`
      → HTTP 200 with correct FR→EN+ES translation. Fallback
      `process.env.VITE_DEEPSEEK_API_KEY` removed from the function
      code.

- [x] ~~**Supabase Site URL + Redirect URLs**~~ — DONE 2026-05-26.
      Site URL set to `https://atlasrouge.com`. Redirect URLs
      whitelist contains atlasrouge.com, www.atlasrouge.com,
      localhost:3000, localhost:5173, atlasrouge.com/auth/callback.
      `freecoche.com` removed.

- [x] ~~**Apply migration `005_agents_auto_provisioning.sql`**~~ —
      DONE 2026-05-26. Trigger `on_auth_user_created` applied and
      verified end-to-end: created test user via Admin API → trigger
      auto-inserted agents row (role='agent', is_active=false) →
      DELETE cascaded correctly. Orphan-user gap permanently closed.
      Hotfix during apply: initial migration used role='viewer' which
      violated the CHECK constraint defined in migration 001; patched
      to 'agent' (commit `f40cedff`).

- [x] ~~**Leads pipeline (`estimation_requests` + `newsletter_subscribers`)**~~
      — DONE 2026-05-26. Tables already existed from migration 004
      (applied previously). Missing RLS policies added: anon can
      INSERT, only active agents can SELECT/UPDATE. Verified
      end-to-end via curl with the anon key:
        POST /rest/v1/estimation_requests → HTTP 201 ✅
        POST /rest/v1/newsletter_subscribers → HTTP 201 ✅
      Frontend code (`leads.service.ts`) uses `.insert()` without
      `.select()` so it does not trigger the RETURNING/SELECT
      policy check that would fail for anon users. Form submissions
      now reach the DB.
- [ ] **Apply migration `004_leads.sql`** in Supabase Studio.
- [ ] **Update `site_settings`** with real phone, WhatsApp, email,
      physical address.
- [ ] **Configure custom SMTP** for transactional email branding
      (currently using Supabase default).
- [ ] **Upload Sofia's professional photo + bio** (`agents` table,
      id `08f2006c-0d47-464b-9fd4-518b214c1a6b`).
- [ ] **Contract Supabase Pro (~€25/mo)** + Netlify Pro (~€20/mo)
      before traffic ramp.

---

## P1 — important, not blocking

- [n/a] **DB-003 · Duplicate leads RLS policies** — **does NOT apply.**
      `004_leads.sql` already defines the leads policies cleanly; there
      is no duplicate set to drop. The earlier worry (from the audit)
      was based on a stale read. No migration needed for this.
- [x] ~~**i18n P0-6/P0-7 (GestionLocative/BuyerGuide/About in French)**~~
      Resolved in commit `593e47ae` (2026-05-26). Listed here for the
      record; it is the same as UX-001/UX-002 above.
- [ ] **Add `typecheck` and `test` scripts to `package.json`** so
      `scripts/verify.sh` actually validates types and tests, not
      just lint+build.
- [ ] **Bundle split for `maplibre` and `AdminBlogForm`** (>500 kB
      chunks). Both already lazy-loaded; manualChunks would polish.
- [ ] **Rename `HANDOFF_REPORT.md` → `HANDOFF.md`** to align with
      the harness convention. Or keep both with a symlink.

---

## Blocked

*(none right now — all blockers are owner-side P0 items above)*

---

## Next recommended action

**Close out Phase 0 (owner boundaries):** apply
`006_fix_agent_update_rls.sql` in Supabase Studio and verify a non-admin
agent cannot self-promote; confirm the Netlify env vars
(`SUPABASE_URL`/`SUPABASE_ANON_KEY`) so the prebuild sitemap and the
function JWT checks work; then approve the commit + push so Netlify
deploys the working-tree changes. Only after that are P0-1/P0-4/P0-5
actually closed in production. In parallel, Khalid + lawyer on the legal
P0s (P0-2/P0-3).

---

## Known pre-existing failures (not blockers, but on the floor)

- `npm run lint`: 3 `react-refresh/only-export-components` warnings
  (RichTextRenderer.tsx, useFavorites.tsx). Not errors. Triggered by
  exporting helper constants/types alongside the component. Cosmetic
  — fixable by splitting into separate files but no functional
  impact.
- Build warns "chunks larger than 500 kB" for `maplibre` (1 MB) and
  `AdminBlogForm` (404 kB). Both are lazy-loaded; not on the main
  bundle path.

---

## Out of scope right now

- **Sofia AI agent backend** — already shipped (dynamic from DB);
  no changes planned this sprint.
- **B2B / wholesale features** — not in scope for Atlas Rouge; that
  pattern lives in the Piro project.
- **Server-side rendering** — Vite SPA is the chosen stack
  (decision lives in commit history).
