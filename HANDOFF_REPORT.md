# Handoff Report - Atlas Rouge Immobilier

> **Nota de continuidad:** Este documento se actualiza cada vez que una IA interviene. Leerlo completo antes de tocar código.

---

## Intervención: Claude Sonnet 4.6 — 2026-05-01 (quinta sesión — ejecución plan i18n, parcial)

Autor: Claude Sonnet 4.6.

### Contexto

El usuario pidió ejecutar el plan i18n acordado en la sesión anterior, usando los skills `i18n` (lobehub), `vercel-react-best-practices` y `requesting-code-review` instalados vía `npx skills add ...`. La sesión avanzó las fases 1 y 2 parcialmente; quedó pausada antes de terminar todas las páginas públicas. Build verde, lint verde, listo para commit. La siguiente IA puede retomar exactamente donde se dejó.

### Skills instalados (ya disponibles para futuras sesiones)

```
~/.agents/skills/find-skills              # descubrir más skills
~/.agents/skills/i18n                     # convenciones lobehub i18n
~/.agents/skills/vercel-react-best-practices
~/.agents/skills/requesting-code-review
```

Symlinkados a `~/.claude/skills/`. Se cargan al iniciar Claude Code.

### Fase 1 completada — estructura

- 6 namespaces nuevos creados en EN/FR/ES (18 archivos):
  - `about.json` (solo ES por ahora con contenido completo; EN/FR pendientes pero con JSON `{}` vacío)
  - `blog.json`, `estimation.json`, `services.json`, `amenities.json`, `errors.json` (todos `{}` vacíos, listos para llenar)
- Build pasa con namespaces vacíos (no hay roturas)
- **NO se han registrado todavía en `src/i18n.ts`** — la siguiente IA debe añadir los imports y la entrada en `resources` antes de poder usar `t('about:...')` etc.

### Fase 2 — progreso por archivo

**Completado en esta sesión:**

1. **`src/pages/Search.tsx`** — 51 reemplazos automáticos vía Python regex:
   - Etiquetas de filtros (Transaction, Localisation, Type de bien, Budget, Surface, Pièces, Chambres, Statut, Vue, Style, Équipements, Médias, Rayon)
   - `FilterSection title=...` en todo el sidebar
   - Placeholders (`Ville, quartier...`, `Min`, `Max`)
   - Botones reset/createAlert
   - `sortOptions` ahora usa `t()` directamente en su definición (movido fuera de array literal)
   - Tabs `Acheter/Louer`, badges `À vendre/À louer`, "Voir le bien"
   - "Voir les X résultats" con interpolación count

2. **`src/components/admin/PropertyForm.tsx`** — 19 reemplazos:
   - Mensajes zod: ahora en inglés llano (project fallback). NO se usan keys de i18n porque zod necesita strings en tiempo de schema, no de render
   - `transactionOptions` y `typeOptions` ahora son arrays de strings y se traducen con `t('properties.types.X')` y `t('properties.badges.sale|rent')` al renderizar
   - Section titles, field labels (Pièces/Chambres/Salles de bain/Latitude/Longitude/Points forts/Informations de base/Localisation)
   - Placeholders (titre, slug, description, highlight, highlight lang)
   - Botones submit (`Créer la propriété` / `Enregistrer les modifications`) y `Retour à la liste`

3. **JSON files actualizados:**
   - `src/locales/{en,fr,es}/admin.json`: añadido `propertyForm.{createSubmit,updateSubmit,backToList,titlePlaceholder,slugPlaceholder,descriptionPlaceholder,highlightPlaceholder,highlightLangPlaceholder}`
   - `src/locales/{en,fr,es}/sell.json`: añadido **completo** el contenido de FAQ (6 preguntas), feature cards (Déposer une annonce / Vendre avec Atlas Rouge), y agents search (search/specialty/type/results)

**Pendiente — el usuario quiere todo. Lo siguiente que debe hacer la IA que retome:**

1. **Registrar los nuevos namespaces en `src/i18n.ts`** — imports + entradas en `resources` para `about`, `blog`, `estimation`, `services`, `amenities`, `errors`
2. **`src/pages/Sell.tsx`** — JSON ya está, falta tocar el componente:
   - Reemplazar `faqItems` array para que use claves (ej. `['estimation', 'duration', ...]`) y traducir con `t('faq.items.{key}.question')` en render
   - Las dos feature cards (`Déposer une annonce` y `Vendre avec Atlas Rouge`): título, descripción, items, CTA, learnMore
   - Sección "Find an Agent": title, subtitle, searchPlaceholder, filtros specialty/type, noResults, contact
   - Mock `agents` array tiene `specialties`/`location` en francés — son datos mock, decisión: dejar tal cual y marcar el array como `// MOCK` (Supabase ya devuelve agents reales)
3. **`src/pages/About.tsx`** — usar `about.json` (solo ES tiene contenido, EN/FR pendientes de traducir). Reemplazar:
   - Hero, Story (3 párrafos), Values (4 cards), Team (4 miembros), Stats, CTA
4. **`src/pages/BuyerGuide.tsx` + `src/pages/Blog.tsx`** — añadir contenido a `blog.json` y reemplazar:
   - BuyerGuide: TOC links (Le processus d'achat, Notaire ou Adoul, etc.), todas las secciones del guide
   - Blog: categorías (`Tous`, `Achat`, `Investissement`, `Quartiers`, `Fiscalité`, `Décoration`), 8+ artículos con title+excerpt+date+readTime
5. **`src/pages/Estimation.tsx` + `src/pages/Estimer.tsx`** — `estimation.json`:
   - Pasos (Remplissez le formulaire, Notre agent analyse, Recevez votre estimation)
   - Badges (Gratuit, Sans engagement)
   - Form labels y placeholders (Quartier rue..., Prénom et nom, etc.)
6. **`src/pages/GestionLocative.tsx`** — `services.json`:
   - 4 servicios (Recherche de locataires, Garanties loyers impayés, Maintenance, ...) con title + description
7. **`src/pages/Favorites.tsx` + `src/pages/NotFound.tsx`** — strings menores
8. **`src/pages/PropertyDetail.tsx`** — refactor del mapa `amenityIcons`:
   - Pasar de `{ 'Piscine': <Waves/> }` a `{ piscine: <Waves/> }` (slugs)
   - Crear helper `slugifyAmenity(label)` que convierte "Piscine chauffée" → "piscine-chauffee"
   - Llenar `amenities.json` con todas las claves: `piscine`, `piscine-chauffee`, `jardin`, `jardin-paysager`, `terrasse`, `terrasse-panoramique`, `garage-double`, `climatisation`, `ascenseur`, `cuisine-equipee`, `domotique`, `salle-de-fitness`, `vue-atlas`, `fontaine-centrale`, `zelliges-traditionnels`, `vue-degagee`, `piscine-a-debordement`, `vue-panoramique`, `salon-marocain`, `panneaux-solaires`, `systeme-de-securite`, `portail-electrique`, `chauffage-au-sol`
   - El render ya usa `t('amenities:slug')`
9. **Servicios de errores** (`auth.service.ts`, `propertyAdmin.service.ts`, etc.):
   - Añadir keys a `errors.json`: `errors.auth.invalidCredentials`, `errors.property.notFound`, etc.
   - Wrapping de los `throw new Error('...')` y `return { error: ... }` con t() — pero **cuidado**: los services no tienen acceso a `t()` directamente. Patrón recomendado: que el service lance keys, y los componentes que llaman traduzcan al mostrar el error. O retornar codes (`PROPERTY_NOT_FOUND`) que el componente mapea a t()
10. **Datos mock** (`src/data/properties.ts`, `src/data/neighborhoods.ts`, `src/data/filters.ts`): añadir comentario `// MOCK — not used in prod, fallback only` y NO traducir

**Después de Fase 2:**

- Build verde, lint verde
- **Un solo deploy** (no parciales)
- Update HANDOFF
- **Code review** con `requesting-code-review` skill (dispatch al subagent superpowers:code-reviewer)
- Pasada con `vercel-react-best-practices` para detectar perf issues introducidas por los cambios

### Estado al pausar (esta sesión)

- Build OK, lint OK (0 errores, 0 warnings)
- Cambios en local NO commiteados todavía
- Files con cambios listos para commit:
  - `src/pages/Search.tsx`
  - `src/components/admin/PropertyForm.tsx`
  - `src/locales/{en,fr,es}/admin.json` (propertyForm extras)
  - `src/locales/{en,fr,es}/sell.json` (faq, features, agents)
  - 18 archivos JSON nuevos vacíos (`{}`) en `src/locales/*/{about,blog,estimation,services,amenities,errors}.json`
  - `src/locales/es/about.json` con contenido completo (EN/FR aún `{}`)

---

## Intervención: Claude Sonnet 4.6 — 2026-05-01 (cuarta sesión — auditoría i18n + plan)

Autor: Claude Sonnet 4.6.

### Contexto

El usuario se quejó (con razón) de que las traducciones se hacían "en goteo" — yo iba parchando solo lo que él reportaba en cada captura, sin auditar todo el proyecto. Esto generó muchas rondas de deploys parciales y la sensación de que "nunca acaba". Antes de seguir tocando código, hicimos auditoría completa.

### Bugs críticos arreglados ANTES de la auditoría

1. **White screen / spinner cada hora** (commit `143c186c`)
   - Causa: `AuthProvider` ponía `isLoading=true` en cada `onAuthStateChange` (incluido `TOKEN_REFRESHED` que dispara cada hora). `ProtectedRoute` cuando ve `isLoading=true` renderiza solo el spinner ocultando todo el contenido del admin.
   - Fix: handler de `TOKEN_REFRESHED` separado que solo actualiza `user` sin tocar `isLoading`. Inicial mount sigue usando `isLoading` para el spinner de carga inicial.
   - También: deshabilitado `react.useSuspense: false` en i18n para evitar que cambios de idioma disparen el Suspense fallback del Layout.

2. **Stale chunk error / "Failed to fetch dynamically imported module"** (commit `ba93e218`)
   - Causa: tras un deploy nuevo, las pestañas que ya tenían el sitio abierto cacheaban el `index.js` viejo que apuntaba a chunks (`Search-XXX.js`) cuyos hashes ya no existían. Netlify devolvía el `index.html` (SPA fallback) con MIME `text/html` para esos chunks, el navegador rechazaba el módulo y la página entera quedaba en blanco.
   - Fix capa 1: `netlify.toml` ahora devuelve **404 para `/assets/*`** que no existan, en lugar de fallback al index.html. Así el navegador recibe un error claro en vez de HTML mal etiquetado.
   - Fix capa 2: `main.tsx` añade un listener global a `error` y `unhandledrejection`. Si detecta el error de chunk-load (`Failed to fetch dynamically imported module` / `Importing a module script failed` / `ChunkLoadError`), fuerza **un solo reload** de la pestaña (sessionStorage flag impide loops infinitos). El reload trae el nuevo `index.js` con los hashes correctos.

### Auditoría completa del estado de i18n

**~440 strings franceses hardcoded en ~30 archivos.** Lo que ya está traducido (no tocar):

- `Home`, `Footer` (parcial), `Nav`, `Contact`, `PropertyCard` básica
- Admin: sidebar, header, login, profile, contacts, properties (lista), dashboard, ImageUploader, AvatarUpload, AgentCredential, password change, profile form
- `Sell` parcial: hero + breadcrumb + 4 pasos + CTAs

**Lo que falta** (en orden de prioridad):

| Bucket | Archivos | ~strings | Prioridad |
|---|---|---|---|
| **A. Páginas públicas grandes** | `BuyerGuide.tsx`, `Blog.tsx`, `Sell.tsx` (FAQs + feature cards + agentes + form), `About.tsx`, `GestionLocative.tsx`, `Estimation.tsx`, `Estimer.tsx`, `Favorites.tsx`, `NotFound.tsx` | ~180 | 🔴 P1 |
| **B. Search filtros sidebar** | `Search.tsx` (`typeOptions`, `statusOptions`, `viewOptions`, `styleOptions`, `mediaOptions`, `sortOptions`, `amenitiesList`, FilterSection titles) | ~50 | 🔴 P1 |
| **C. PropertyForm completo** | `PropertyForm.tsx` (zod messages, transactionOptions, typeOptions, amenitiesList, todos los placeholders) | ~28 | 🟡 P2 |
| **D. PropertyDetail icons map** | `PropertyDetail.tsx` — el mapa `amenityIcons` indexa por nombre francés (`'Piscine'`, `'Jardin paysager'`); habría que migrar a slugs internos (`pool`, `garden`) y traducir el label en render | ~36 | 🟡 P2 |
| **E. Datos mock** | `src/data/properties.ts`, `src/data/neighborhoods.ts`, `src/data/filters.ts` — solo se usan como fallback si Supabase no responde | ~110 | 🟢 P3 (recomendado: marcar `// MOCK — not used in prod` y NO traducir) |
| **F. Servicios (errores)** | `auth.service.ts`, `admin/propertyAdmin.service.ts`, `settings.service.ts`, etc. | ~25 | 🟢 P3 |
| **G. Otros menores** | `Contact.tsx` (resto), `Home.tsx` (1 string), `Footer.tsx` (3) | ~10 | 🟢 P3 |

### Plan acordado (NO ejecutado todavía)

**Fase 1 — Estructura sin cambiar UI (~15 min)**

1. Crear nuevos namespaces: `about.json`, `blog.json`, `estimation.json`, `services.json`, `amenities.json`, `errors.json` en EN/FR/ES (18 archivos)
2. Registrarlos en `src/i18n.ts`
3. Build verde — sin cambios visuales

**Fase 2 — Traducción por archivo completo (~45-60 min)**

Trabajar archivo por archivo, completo cada vez (NO por sección como en sesiones anteriores):

1. `Search.tsx` — todas las options arrays + sidebar
2. `PropertyDetail.tsx` — refactor de `amenityIcons` a slugs + nuevo namespace `amenities`
3. `PropertyForm.tsx` — zod messages a `errors.json`, options, placeholders
4. `Sell.tsx` — FAQs, feature cards, agentes, formulario
5. `About.tsx` — equipo, valores, historia
6. `BuyerGuide.tsx` + `Blog.tsx` — categorías, secciones, artículos (a `blog.json`)
7. `Estimation.tsx` + `Estimer.tsx` — formulario completo
8. `GestionLocative.tsx` — servicios
9. `Favorites.tsx` + `NotFound.tsx`
10. Servicios — toasts a `errors.json` o al namespace correspondiente

**Fase 3 — Cleanup (~10 min)**

1. Marcar `src/data/*.ts` como `// MOCK — not used in prod`
2. Build final, lint final
3. **Un solo deploy** (no más despliegues parciales)
4. Update HANDOFF

### Definition of Done

- `grep -rE "['\"][A-Z][a-zàéèêçï ]{4,}['\"]" src/pages src/components` solo encuentra matches en `src/data/*.ts` mock
- Cambio de idioma → web entera en EN/ES sin strings franceses
- Build OK, lint OK
- HANDOFF actualizado

### Estado al entregar (ESTA sesión)

- Build OK, lint OK (0 errores, 0 warnings)
- Bugs críticos del white-screen y stale-chunk: arreglados, en producción
- i18n completado en esta sesión: AdminContacts, AdminProperties, AdminDashboard, ImageUploader, AvatarUpload, AgentCredential, profile + password forms, AdminLogin/PropertyNew/Edit toasts, sección hero+pasos de Sell.
- 18+ commits en `origin/main`, todos desplegados en Netlify
- Plan completo i18n acordado con el usuario, esperando aprobación para ejecutar

### Para la siguiente IA

1. **NO empezar a parchear strings sueltos.** El usuario explícitamente pidió hacer el plan completo de una sola tanda. Confirmar el plan con él si hay dudas.
2. **Seguir el orden de las 3 fases** descritas arriba. Crear estructura primero, luego traducir por archivo completo.
3. **Datos mock NO se traducen** — añadir comentario `// MOCK — not used in prod` y dejarlos.
4. **Un solo deploy al final** de las 3 fases, no parciales.
5. Detalles del schema/RLS de Supabase, función translate-property y resto de info técnica: ver intervenciones anteriores en este documento.

---

## Intervención: Claude Sonnet 4.6 — 2026-05-01 (tercera sesión — fix de chunks colgados)

Autor: Claude Sonnet 4.6.

### Problema reportado por el usuario

Tras el primer deploy, las páginas se quedaban colgadas:
- `/fr/acheter` mostraba "Chargement des annonces..." indefinidamente
- `/admin/login` se quedaba en "Connexion..." al pulsar el botón

CORS probado y verificado correcto. Las peticiones desde curl con `Origin: https://immobilier.freecoche.com` funcionaban. El bundle tenía la URL y la anon key correctas.

### Causa raíz

Dos bugs combinados:

1. **`manualChunks` separaba `@supabase/supabase-js` en su propio chunk** (`supabase-vendor`). Esto generaba un problema de orden de carga similar al que Kimi corrigió antes con i18n/radix: el cliente Supabase quedaba sin resolver y todas las llamadas (data y auth) se colgaban indefinidamente. Es una clase de bug recurrente al separar librerías que tienen contexto compartido.

2. **`Search.tsx` y `Home.tsx` no tenían `.catch()` ni `.finally()`** en el `useEffect` que llama `getProperties()` / `getFeaturedProperties()`. Si la promesa nunca resuelve (como pasaba con el chunk roto), `setLoading(false)` nunca se ejecuta y el spinner queda eterno. Sin `.catch()` los errores no aparecían en consola.

### Fix aplicado (commit `06b3e4b0`)

- `vite.config.ts`: dejar solo `maplibre` como chunk separado (el único realmente grande, 1MB, y se carga lazy desde Search). Supabase y React vuelven al bundle principal.
- `src/pages/Search.tsx`: añadir `.catch()` que loguea el error en consola y `.finally()` que siempre limpia el loading.
- `src/pages/Home.tsx`: añadir `.catch()` a las dos llamadas (`getFeaturedProperties`, `getNeighborhoods`).

### Estado al entregar

- Deploy `69f3d6f967731227d554e18f` activo en `https://immobilier.freecoche.com`
- Bundle nuevo: `index-DMQY_1LU.js` (714 kB, gzip 216 kB — sin chunk separado de supabase)
- Solo `maplibre-D-jHInwO.js` (1 MB) sigue como chunk separado, lazy
- `git push origin main` hecho
- Lección aprendida: **NO separar @supabase/supabase-js en un chunk vendor**. Causa hangs silenciosos.

### Pendiente

1. **El usuario debe probar de nuevo** la web — el spinner ya no debería quedarse colgado.
2. Si todavía no aparecen propiedades, ahora habrá errores en la consola (gracias al `.catch()`) que indicarán exactamente qué pasa.
3. QA del backoffice: login, crear/editar propiedad, botón "Traducir con IA".

---

## Intervención: Claude Sonnet 4.6 — 2026-04-30 (segunda sesión — deploy + diagnóstico)

Autor: Claude Sonnet 4.6.

### Acciones realizadas

- **Diagnóstico de propiedades no visibles**: Verificado Supabase (12 propiedades OK, anon puede leer, Storage con imágenes OK). El problema era que los 10 commits locales nunca se habían hecho push a GitHub — Netlify corría código de `5cc3093e` (anterior a todos los fixes).
- **`git push origin main`**: Subidos los 10 commits a GitHub (`5cc3093e..d2e9d46d`).
- **Deploy a Netlify** (`69f3d01715f8b0122bfcb758`): Build completo, bundle nuevo `index-DXYyaT55.js`, todas las rutas responden 200.
- Verificado: `VITE_SUPABASE_URL` bakeado en el bundle del deploy.

### Estado al entregar

- Producción: `https://immobilier.freecoche.com` — deploy `69f3d01715f8b0122bfcb758` con código hasta `d2e9d46d`
- Todas las rutas: 200 OK
- Supabase: 12 propiedades, anon puede leer, Storage con imágenes
- GitHub `origin/main`: sincronizado con local

### Pendiente

1. **QA visual** en producción — comprobar que las propiedades aparecen en la web ahora.
2. Si aún no aparecen: abrir DevTools → Console y compartir errores rojos (no los de GSAP).
3. QA del backoffice: login, crear/editar propiedad, botón "Traducir con IA".
4. Crear primer admin/agente si la tabla `agents` está vacía.

---

## Intervención: Claude Sonnet 4.6 — 2026-04-30 (sesión completa)

Autor: Claude Sonnet 4.6 (claude-sonnet-4-6).

### Acciones realizadas

- Commit de fixes de Codex sin commitear (`PropertyDetail.tsx`, `Search.tsx`).
- Eliminado `kimi-export-*.md` (506 kB de sesión anterior, basura).
- **Lint llevado a 0 errores y 0 warnings** (antes: 14 warnings):
  - `AdminContacts` / `AdminProperties`: `loadData` convertidas a `useCallback`.
  - `Search` MapView: refs con `useLayoutEffect` para `onHover/onSelect/formatPrice/path`; deps de los 3 `useEffect` corregidas.
  - Componentes shadcn/ui y `useAuth`: `eslint-disable-line` inline en exports mixtos.
- **Bundle optimizado**: `index` bajó de 714 kB → 288 kB con `manualChunks` (react, supabase, maplibre separados). Nota: Kimi corrigió una dependencia circular que rompía `React.createContext` — el config final está en `4535d279`.
- **SPA redirects añadidos a `netlify.toml`** raíz (faltaban; solo estaban en el archivo generado por Netlify CLI con rutas absolutas de máquina).
- **`.gitignore` actualizado**: excluye artifacts de Netlify CLI (`.netlify/edge-functions-dist/`, `.netlify/functions/`, `deno.lock`, etc.).
- Verificación de los 6 commits de Kimi: todos correctos, build y lint pasan.

### Estado al entregar

- Build: OK — 0 errores TypeScript
- Lint: OK — **0 errores, 0 warnings**
- `index` chunk: 288 kB (gzip 92 kB), react-vendor 230 kB, supabase-vendor 194 kB, maplibre 1 MB (lazy)
- Rutas QA: `/en/`, `/fr/`, `/es/`, `/admin/login`, `/en/acheter`, `/fr/acheter` → todas 200
- Netlify deploy: verificado por Kimi, sitio en producción
- DeepSeek traducción IA: funcionando en producción
- Supabase migración: aplicada por Kimi

### Pendiente para la siguiente IA

1. **QA visual del backoffice en producción**: login, crear/editar propiedad, botón "Traducir con IA".
2. **Crear primer admin/agente** si `agents` está vacía (ver `supabase/migrations/001_agents.sql` sección 12).
3. **Limpiar `VITE_DEEPSEEK_API_KEY`** de `.env` y `.env.example` — la traducción es 100% server-side ahora.
4. **Push a origin/main**: hay 9+ commits locales sin pushear.

---

## Intervención: Kimi (Moonshot AI) — 2026-04-30

Autor: Kimi (Kimi Code CLI), invocado por el propietario del proyecto tras el rate-limit de Claude Sonnet 4.6.

### Acciones realizadas

- **Commit de optimización de bundle**: `vite.config.ts` con `manualChunks` (react-vendor, supabase-vendor, i18n-vendor, radix-vendor) ya commiteado en `1f40bf1d`.
- **Configurar DEEPSEEK_API_KEY en Netlify**: Variable `DEEPSEEK_API_KEY` (server-side, sin prefijo `VITE_`) configurada en el sitio `7af94674-6d3f-4258-94bf-4776f8a7e9c6` usando Netlify CLI con token personal. La funcion `netlify/functions/translate-property.js` ahora puede usar la key secreta del servidor.
- **Verificación de API key**: Peticion directa a DeepSeek API confirmada exitosa (`deepseek-v4-flash` responde OK).
- **Actualizar schema.sql**: Reemplazado el schema base antiguo (`admins`, sin multilingüe) por el estado actual real:
  - Tabla `agents` con campos `role`, `is_active`, `photo_url`, `bio`.
  - Tabla `properties` con columnas multilingües (`title_en/fr/es`, `description_en/fr/es`, `highlights_en/fr/es`) y `agent_id`.
  - Tabla `contact_submissions` con `assigned_to_agent_id` y `status`.
  - Funciones helper `is_agent()` e `is_admin_role()`.
  - Políticas RLS actualizadas para agents, properties y contact_submissions.
- **QA manual de rutas**: `/en/`, `/fr/`, `/es/`, `/admin/login`, `/en/acheter`, `/fr/acheter`, `/en/louer`, `/en/contact` — todas responden 200 en dev server (puerto 3000).
- **Build y lint**: 0 errores, 0 warnings confirmados tras todos los cambios.

### Estado al entregar

- Build: OK
- Lint: OK (0 errores, 0 warnings)
- **Netlify deploy**: Completado. Sitio `https://immobilier.freecoche.com` actualizado.
- **Traducción IA**: Verificada en producción. La función `translate-property.js` responde correctamente con traducciones EN/ES desde FR.
- **Supabase**: Migración aplicada (`migrate_existing.sql`). Columnas multilingües y tabla `agents` confirmadas en la base remota.
- Repo limpio.
- Dev server: corriendo en `localhost:3000`.

### Pendiente tras esta intervención

1. **QA visual completo del backoffice**: Probar login, flujo de creación/edición de propiedades, y botón "Traducir con IA" en `/admin/properties/new` en el sitio de producción.
2. **Revisar `.env`**: Considerar eliminar `VITE_DEEPSEEK_API_KEY` de `.env` y `.env.example` ya que la traducción ahora es 100% server-side. La variable correcta es solo `DEEPSEEK_API_KEY` en Netlify.
3. **Crear primer admin/agente en Supabase**: Si la tabla `agents` está vacía, seguir las instrucciones de `supabase/migrations/001_agents.sql` (sección 12) para crear el primer usuario admin desde Auth → Users y luego insertar en `agents`.

---

## Intervención anterior: Codex — 2026-04-30

Fecha original: 2026-04-30  
Autor: Codex  
Repositorio local: `/Users/aimac/Documents/Workspace/Clients/atlas-rouge-immobilier`

## Actualizacion De Esta Intervencion

En esta segunda intervencion Codex tomo control operativo e hizo correcciones en el proyecto. El repo ya tenia cambios previos sin commitear de otro programador/IA; esos cambios no se revirtieron. Las correcciones nuevas se integraron encima respetando ese estado.

Cambios realizados:

- Se recupero `npm run build`; ya compila correctamente.
- `npm run lint` queda en 0 errores y 14 advertencias no bloqueantes.
- La traduccion IA ya no llama a DeepSeek desde el navegador. Ahora usa `netlify/functions/translate-property.js`.
- La clave debe vivir como `DEEPSEEK_API_KEY` en Netlify/server, no como `VITE_DEEPSEEK_API_KEY`.
- El boton del backoffice ahora adapta la ficha con IA usando el contexto completo del inmueble: tipo, operacion, ubicacion, precios, superficies, habitaciones, amenities, titulo, descripcion y puntos fuertes.
- El contenido publico de propiedades ahora se localiza desde `title_en/fr/es`, `description_en/fr/es` y `highlights_en/fr/es` segun el idioma activo.
- El selector de idioma se cambio a desplegable con banderas redondas modernas dibujadas localmente.
- `supabase/schema.sql` se ajusto para favoritos anonimos con `anonymous_id` y para evitar lectura publica de `contact_submissions`.
- Se actualizaron docs/env para puerto `3000` y DeepSeek server-side.
- Se agrego `Suspense` en el layout publico y `Home` ahora carga lazy para reducir la carga inicial.

Validacion actual:

```bash
npm run build  # OK
npm run lint   # OK, 14 warnings
```

Advertencias restantes:

- Fast Refresh en componentes shadcn/ui con exports mixtos. No bloquea build.
- Dependencias de hooks en `Search`, `AdminContacts` y `AdminProperties`. No bloquea, pero conviene revisar en una pasada especifica.
- Vite sigue avisando de chunks grandes: `index` bajo de ~876 kB a ~714 kB minificado tras lazy-load de Home, pero MapLibre sigue siendo ~1 MB. Search/MapLibre ya esta lazy, asi que la mejora profunda siguiente seria separar mas vendor/admin/auth o revisar dependencias globales.

## Proposito

Este documento deja el contexto tecnico del proyecto para que otro programador u otra IA pueda retomarlo sin reconstruir el estado desde cero.

## Estado Git

Rama actual: `main`

Ultimos commits vistos:

```text
b5de0348 fix: repair all broken routes for i18n URL structure
fd61734c feat: implement full i18n system (EN/FR/ES) with AI auto-translation
e121fbaf fix: resolve login race condition - agent data loading before navigation
10760440 fix: simplify login - navigate directly after signIn success
721861ee fix: sync AgentProfile local state with auth context
```

El arbol de trabajo ya estaba sucio antes de crear este reporte. Archivos modificados:

```text
src/components/Footer.tsx
src/i18n.ts
src/locales/en/common.json
src/locales/en/home.json
src/locales/en/property.json
src/locales/es/common.json
src/locales/es/home.json
src/locales/es/property.json
src/locales/fr/common.json
src/locales/fr/home.json
src/locales/fr/property.json
src/pages/Contact.tsx
src/pages/Favorites.tsx
src/pages/Home.tsx
src/pages/NotFound.tsx
src/pages/PropertyDetail.tsx
```

Archivos no trackeados vistos:

```text
kimi-export-c723442b-20260429-183145.md
src/locales/en/search.json
src/locales/es/search.json
src/locales/fr/search.json
```

El archivo `kimi-export-c723442b-20260429-183145.md` pesa unos 506 KB y contiene un export largo de una sesion anterior.

## Stack Y Arquitectura

Proyecto frontend con:

- React 19, TypeScript estricto y Vite 7.
- Tailwind CSS 3 y componentes tipo shadcn/ui.
- React Router con rutas publicas prefijadas por idioma.
- i18next con idiomas `en`, `fr`, `es`.
- Supabase para propiedades, autenticacion/admin, contactos, favoritos y settings.
- Netlify con redirects SPA y edge function para proxy de imagenes.
- MapLibre GL para mapas.

Entrada principal:

- `src/main.tsx`: monta `BrowserRouter`, `AuthProvider` y `App`.
- `src/App.tsx`: define rutas.

Rutas principales:

- `/` detecta idioma y redirige a `/:lang/`.
- `/admin/login` y `/admin/*` no usan prefijo de idioma.
- `/:lang/acheter`, `/:lang/louer`, `/:lang/property/:slug`, etc. son rutas publicas.

Nota documental: `vite.config.ts` fija el puerto dev en `3000`, pero `README.md` y `PROJECT_HANDBOOK.md` mencionan `5173`.

## Validaciones Ejecutadas

Comandos relevantes ejecutados:

```bash
git status --short
git log --oneline -5
rg --files -g '!node_modules' -g '!dist' -g '!build' -g '!coverage'
npm run lint
npm run build
npx eslint . --ignore-pattern 'atlas-rouge-immobilier-v4/**'
```

Resultado inicial de `npm run build` antes de las correcciones:

```text
src/pages/PropertyDetail.tsx(321,9): error TS6133:
'guideLinkLabels' is declared but its value is never read.
```

Estado actual: el build pasa correctamente.

Resultado inicial de `npm run lint` antes de las correcciones:

- Falla con 48 problemas cuando analiza todo.
- Parte del ruido viene de la carpeta local `atlas-rouge-immobilier-v4/`, que esta en `.gitignore` pero no en `eslint.config.js`.
- Ignorando esa carpeta, siguen quedando 33 problemas en el codigo activo.

Estado actual: `npm run lint` pasa con 0 errores y 14 advertencias.

## Bloqueos Criticos

### 1. Build roto en `PropertyDetail.tsx`

Archivo: `src/pages/PropertyDetail.tsx`

Problema:

- `guideLinkLabels` se declara cerca de la linea 321 pero no se usa.
- Mas abajo, los links del guide CTA renderizan `{link.labelKey}` directamente, por lo que la UI mostraria claves como `notaire`, `frais`, `credit`, etc.
- Busqueda con `rg` no encontro `guideLabels.*` en los archivos `src/locales/*/property.json`, asi que tambien faltan o no estan conectadas esas traducciones.

Estado actual:

- Corregido. Se agregaron claves `guideLabels`, se usan etiquetas traducidas y `npm run build` pasa.

### 2. ESLint analiza una copia ignorada del proyecto

Carpeta: `atlas-rouge-immobilier-v4/`

Esta carpeta esta en `.gitignore`, pero ESLint no la ignora. Como resultado, `npm run lint` reporta errores duplicados o ruido de una copia local.

Estado actual:

- Corregido. `eslint.config.js` ignora `atlas-rouge-immobilier-v4`.

### 3. Errores reales de lint en codigo activo

Ignorando `atlas-rouge-immobilier-v4/`, quedan errores en:

- `netlify/edge-functions/img-proxy.ts`: parametro `context` sin usar.
- `src/components/admin/ImageUploader.tsx`: `useCallback` con dependencias incorrectas.
- `src/components/admin/ProfileForm.tsx`: regla React Compiler sobre `setState` sincronico en effect.
- `src/components/ui/*`: reglas de Fast Refresh por exports mixtos en componentes shadcn/ui.
- `src/components/ui/sidebar.tsx`: `Math.random()` durante render/memo.
- `src/hooks/useAuth.tsx` y `src/services/auth.service.ts`: interfaces vacias equivalentes a su supertipo.
- `src/hooks/useFavorites.ts`, `src/pages/Search.tsx`, `src/pages/PropertyDetail.tsx`, `src/pages/admin/AgentProfile.tsx`: reglas nuevas de hooks/React Compiler.
- `src/types/supabase.ts`: tipos `{}` para `Views`, `Functions`, etc.

Estado actual: corregidos los errores. Quedan advertencias no bloqueantes.

## Riesgos Funcionales Encontrados

### Mapa bloqueando la pagina de inmuebles

En produccion, Supabase respondia correctamente con propiedades y las variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` estaban presentes en el bundle. El fallo observado venia de MapLibre: si el navegador no puede crear contexto WebGL, la pagina de busqueda puede quedarse sin renderizar.

Estado actual:

- `src/pages/Search.tsx` ya no abre el mapa por defecto en escritorio; primero carga la lista/grid de inmuebles.
- `Search.tsx` y `PropertyDetail.tsx` validan WebGL antes de iniciar MapLibre y capturan errores de inicializacion.
- Si el mapa falla, se muestra una alternativa visual y los inmuebles siguen visibles.

### i18n de propiedades incompleto

El admin maneja campos multilingues:

- `title_en`, `title_fr`, `title_es`
- `description_en`, `description_fr`, `description_es`
- `highlights_en`, `highlights_fr`, `highlights_es`

Pero el servicio publico `src/services/property.service.ts` sigue mapeando:

- `row.title`
- `row.description`
- `row.highlights`

Existe `src/hooks/useLocalizedProperty.ts`, pero no se encontro uso real en las paginas publicas. Por eso, aunque se guarden traducciones en Supabase, Search/PropertyDetail/PropertyCard probablemente siguen mostrando el contenido base.

Estado actual:

- Corregido en `property.service.ts`, que ahora mapea contenido localizado segun `i18n.language`.

### Divergencia en esquema Supabase

`supabase/schema.sql` define `favorites` con `user_id UUID NOT NULL`, pero `src/hooks/useFavorites.ts` usa `anonymous_id`.

Tambien `README.md` y `PROJECT_HANDBOOK.md` describen favoritos anonimos mediante `anonymous_id`.

Hay una divergencia entre documentacion/codigo/tipos/schema base. Puede que la base real tenga migraciones aplicadas manualmente, pero un deploy desde cero quedaria inconsistente.

Estado actual:

- `supabase/schema.sql`, `src/types/supabase.ts` y `useFavorites` fueron alineados para `anonymous_id`.
- Recomendacion pendiente: si hay una base Supabase ya activa, crear/aplicar una migracion real equivalente antes de depender solo del schema base.

### Contactos con posible exposicion en schema base

En `supabase/schema.sql`, `contact_submissions` tiene policy de lectura publica para `anon` y `authenticated`. Eso expone datos personales si se aplica en una base nueva.

La migracion de agentes parece intentar restringir lectura a admin/agentes, pero el schema base sigue peligroso.

Estado actual:

- Corregido en `supabase/schema.sql`: se conserva insercion publica y se elimina lectura publica.

### DeepSeek API key en frontend

`src/services/translation.service.ts` usa `VITE_DEEPSEEK_API_KEY`.

Todo `VITE_*` se expone al navegador. Si se configura esa key, queda visible para usuarios. La traduccion automatica deberia pasar por una funcion serverless/edge con una variable secreta del lado servidor.

Estado actual:

- Corregido con `netlify/functions/translate-property.js`.

## Orden Recomendado Para Retomar

1. Configurar `DEEPSEEK_API_KEY` en Netlify y probar la traduccion real desde `/admin/properties/new`.
2. Aplicar migracion Supabase equivalente a los cambios del schema si la base remota ya existe.
3. Hacer prueba manual en `/en/`, `/fr/`, `/es/`, `/admin/login` y flujo de creacion/edicion.
4. Revisar warnings de hooks restantes en `Search`, `AdminContacts` y `AdminProperties`.
5. Si la web sigue lenta, perfilar bundle inicial y separar admin/auth/vendor en chunks manuales.
6. Verificar en Netlify que el ultimo deploy de `main` recoge el guardado de MapLibre/WebGL.

## Notas De Continuidad

- No revertir cambios existentes sin confirmar; hay trabajo activo de otro programador/IA.
- Los cambios de i18n parecen estar en progreso y no deben descartarse.
- Las rutas i18n ya fueron reparadas en el ultimo commit conocido.
- La carpeta `atlas-rouge-immobilier-v4/` parece una copia local/backup, no parte del repo trackeado.
- `dist/` tampoco esta trackeado.
- `.env` no esta trackeado, correcto.

## Resumen Corto Para La Siguiente Persona O IA

El proyecto vuelve a compilar y lint pasa sin errores. Las correcciones principales de i18n, traduccion IA server-side, schema base, selector de idioma, docs y guardado contra fallos de WebGL/MapLibre ya estan hechas. Lo siguiente es probar con credenciales reales de DeepSeek/Supabase, aplicar migracion en la base remota y hacer QA visual/manual del backoffice y de las rutas por idioma.
