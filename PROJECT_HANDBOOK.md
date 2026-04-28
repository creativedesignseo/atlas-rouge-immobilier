# Atlas Rouge Immobilier — Project Handbook

> Documento maestro del proyecto. Incluye todo: stack, cuentas, arquitectura, estado de features y pendientes.
> **Última actualización:** 24 de abril de 2026

---

## 1. Identidad del Proyecto

| Campo | Valor |
|---|---|
| **Nombre** | Atlas Rouge Immobilier |
| **Descripción** | Agencia inmobiliaria de lujo en Marrakech, Marruecos. Clientes francófonos (principalmente Francia) |
| **URL Producción** | https://atlas-rouge-immobilier.netlify.app |
| **Repositorio GitHub** | https://github.com/creativedesignseo/atlas-rouge-immobilier |
| **Idioma del sitio** | Francés (lang="fr") |

---

## 2. Cuentas y Accesos

### 2.1 Supabase (Base de datos)

| Campo | Valor |
|---|---|
| **URL del proyecto** | https://slxlkbrqcjabsfuhlwdf.supabase.co |
| **Panel de admin** | https://app.supabase.com/project/slxlkbrqcjabsfuhlwdf |
| **Email de la cuenta** | `adspublioficial@gmail.com` |
| **Región** | AWS (por defecto de Supabase) |
| **Plan** | Free tier |

**Tablas activas:**
- `neighborhoods` — Barrios de Marrakech
- `properties` — Propiedades inmobiliarias
- `contact_submissions` — Formularios de contacto recibidos
- `favorites` — Favoritos de usuarios (anon + auth)
- `site_settings` — Configuración dinámica del sitio

**SQL de creación:** `/supabase/schema.sql`
**SQL de datos iniciales:** `/supabase/seed.sql`

### 2.2 GitHub

| Campo | Valor |
|---|---|
| **Repositorio** | https://github.com/creativedesignseo/atlas-rouge-immobilier |
| **Owner** | creativedesignseo |
| **Rama principal** | `main` |
| **Deploy automático** | Sí, vía Netlify |

### 2.3 Netlify

| Campo | Valor |
|---|---|
| **URL** | https://atlas-rouge-immobilier.netlify.app |
| **Deploy** | Automático desde GitHub `main` |
| **Variables de entorno** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

---

## 3. Stack Tecnológico Completo

### 3.1 Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI Framework |
| TypeScript | 5.7 | Tipado estático |
| Vite | 7 | Build tool & dev server |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| shadcn/ui | — | Componentes base (Button, Dialog, Command, Select, Textarea, Input) |
| React Router DOM | 7 | Enrutamiento SPA |
| Lucide React | — | Iconos SVG |
| GSAP + ScrollTrigger | — | Animaciones de scroll |
| React Hook Form | — | No usado actualmente |

### 3.2 Mapas

| Tecnología | Uso |
|---|---|
| MapLibre GL | Mapas interactivos (Search + PropertyDetail) |
| CARTO Voyager tiles | Estilo de mapa base (OSM) |

### 3.3 Backend / BaaS

| Tecnología | Uso |
|---|---|
| Supabase (PostgreSQL) | Base de datos, Auth, Realtime |
| Supabase REST API | Lectura/escritura de datos desde el frontend |
| Row Level Security (RLS) | Políticas de seguridad por tabla |

### 3.4 Hosting / CI/CD

| Servicio | Uso |
|---|---|
| Netlify | Hosting estático + CDN + deploy automático |
| GitHub Actions | No usado actualmente (deploy vía Netlify Git integration) |

### 3.5 Herramientas de desarrollo

| Herramienta | Uso |
|---|---|
| ESLint | Linting con reglas TypeScript |
| Prettier | No configurado explícitamente |
| Supabase CLI | Instalado localmente (`v2.90.0`) para gestión de BD |
| npm | Gestor de paquetes |

---

## 4. Arquitectura del Proyecto

### 4.1 Estructura de Carpetas

```
atlas-rouge-immobilier/
├── public/                    # Imágenes estáticas (actualmente TODAS las fotos)
│   ├── apart-gueliz-*.jpg
│   ├── blog-*.jpg
│   ├── domaine-fes-*.jpg
│   ├── guide-buyer.jpg
│   ├── hero-marrakech.jpg
│   ├── neighborhood-*.jpg
│   ├── prestige-hivernage-*.jpg
│   ├── property-*.jpg
│   ├── riad-medina-*.jpg
│   ├── terrain-ourika-*.jpg
│   ├── villa-golf-*.jpg
│   ├── villa-minimaliste-*.jpg
│   └── villa-palmeraie-*.jpg
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Layout.tsx
│   │   ├── NeighborhoodCard.tsx
│   │   ├── PropertyCard.tsx       # Grid, List, Compact variants
│   │   ├── SectionReveal.tsx
│   │   ├── ServiceCard.tsx
│   │   └── ui/                    # shadcn/ui components
│   ├── data/                  # Datos mock (fallback offline)
│   │   └── properties.ts
│   ├── hooks/                 # Custom React hooks
│   │   ├── useCurrency.ts         # EUR/MAD con localStorage
│   │   ├── useFavorites.ts        # Favoritos anónimos + Supabase sync
│   │   └── useSiteSettings.ts     # Config dinámica desde Supabase
│   ├── lib/                   # Utilidades y config
│   │   ├── supabase.ts            # Cliente Supabase
│   │   └── utils.ts               # cn(), helpers
│   ├── pages/                 # Páginas (lazy-loaded except Home/NotFound)
│   │   ├── Home.tsx
│   │   ├── Search.tsx             # Búsqueda + mapa MapLibre
│   │   ├── PropertyDetail.tsx     # Ficha + galería + contacto
│   │   ├── Contact.tsx
│   │   ├── About.tsx
│   │   ├── Sell.tsx
│   │   ├── Estimation.tsx
│   │   ├── Estimer.tsx
│   │   ├── Favorites.tsx
│   │   ├── BuyerGuide.tsx
│   │   ├── Blog.tsx
│   │   ├── GestionLocative.tsx
│   │   └── NotFound.tsx
│   ├── services/              # Capa de acceso a datos
│   │   ├── property.service.ts
│   │   ├── neighborhood.service.ts
│   │   ├── contact.service.ts
│   │   └── settings.service.ts
│   ├── types/                 # Tipos TypeScript
│   │   └── supabase.ts
│   ├── App.tsx                # Router + lazy loading + Suspense
│   ├── main.tsx               # Entry point
│   └── index.css / App.css    # Estilos globales
├── supabase/
│   ├── schema.sql             # DDL de todas las tablas
│   └── seed.sql               # Datos iniciales
├── index.html                 # HTML entry (lang="fr", meta tags SEO)
├── vite.config.ts             # Config Vite + aliases
├── tailwind.config.js         # Config Tailwind + tokens de color
├── tsconfig.json              # Config TypeScript
├── package.json               # Dependencias
└── README.md                  # Documentación general
```

### 4.2 Enrutamiento

| Ruta | Página | Lazy? |
|---|---|---|
| `/` | Home | No |
| `/acheter` | Search (transaction=sale) | Sí |
| `/louer` | Search (transaction=rent) | Sí |
| `/property/:slug` | PropertyDetail | Sí |
| `/contact` | Contact | Sí |
| `/about` | About | Sí |
| `/vendre` | Sell | Sí |
| `/estimation` | Estimation | Sí |
| `/estimer` | Estimer | Sí |
| `/favoris` | Favorites | Sí |
| `/guide-achat-maroc` | BuyerGuide | Sí |
| `/blog` | Blog | Sí |
| `/gestion-locative` | GestionLocative | Sí |
| `*` | NotFound | No |

---

## 5. Base de Datos (Supabase)

### 5.1 Diagrama de Tablas

```
neighborhoods (1) ───────< (N) properties

contact_submissions       favorites
(site_settings es standalone key-value)
```

### 5.2 Tablas Detalladas

#### `neighborhoods`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | Auto |
| `name` | text | Ej: "Guéliz" |
| `slug` | text UNIQUE | URL-friendly |
| `image` | text | Ruta en `public/` |
| `description` | text | Texto descriptivo |
| `subtitle` | text | Ej: "Le cœur moderne" |
| `property_count` | int | Estadística visual |
| `created_at` | timestamptz | Auto |

#### `properties`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | Auto |
| `slug` | text UNIQUE | URL-friendly |
| `title` | text | Título de la propiedad |
| `transaction` | enum | `sale` \| `rent` |
| `type` | enum | `villa` \| `apartment` \| `riad` \| `prestige` \| `land` \| `rooftop` |
| `neighborhood_id` | uuid FK → neighborhoods | Nullable |
| `city` | text | Default: "Marrakech" |
| `price_eur` | int | Precio en euros |
| `price_mad` | int | Precio en dirhams |
| `surface` | int | m² construidos |
| `land_surface` | int | m² terreno (nullable) |
| `rooms` | int | Habitaciones totales |
| `bedrooms` | int | Dormitorios |
| `bathrooms` | int | Baños |
| `price_per_sqm` | int | €/m² calculado |
| `description` | text | Descripción larga |
| `highlights` | text[] | Array de puntos fuertes |
| `amenities` | text[] | Array de equipamientos |
| `images` | text[] | Array de rutas de imágenes |
| `latitude` / `longitude` | numeric(10,6) | Coordenadas GPS |
| `is_featured` | bool | Sale en Home |
| `is_exclusive` | bool | Badge "Exclusivité" |
| `has_video` | bool | Indicador visual |
| `has_3d_tour` | bool | Indicador visual |
| `created_at` | timestamptz | Auto |

#### `contact_submissions`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | Auto |
| `name` | text | Nombre del contacto |
| `email` | text | Email |
| `phone` | text | Teléfono (nullable) |
| `subject` | text | Asunto |
| `message` | text | Mensaje |
| `property_slug` | text | Propiedad relacionada (nullable) |
| `created_at` | timestamptz | Auto |

#### `favorites`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | Auto |
| `user_id` | uuid | Para usuarios autenticados |
| `anonymous_id` | text | Para usuarios anónimos (localStorage) |
| `property_slug` | text | Slug de la propiedad |
| `created_at` | timestamptz | Auto |

#### `site_settings` ⭐
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | Auto |
| `key` | text UNIQUE | Identificador |
| `value` | text | Valor |
| `updated_at` | timestamptz | Auto |

**Claves configurables:**

| Key | Valor por defecto | Dónde se usa |
|---|---|---|
| `company_name` | Atlas Rouge Immobilier | Footer, mapa decorativo |
| `agent_name` | Sophie Martin | PropertyDetail panel contacto |
| `agent_title` | Conseillère immobilière | PropertyDetail panel contacto |
| `phone` | +212 524 00 00 00 | Contact, PropertyDetail sticky |
| `whatsapp` | +212 600 00 00 00 | Botones WhatsApp |
| `email` | contact@atlasrouge.immo | Links mailto |
| `address` | 123 Boulevard Mohamed VI, Guéliz | Página contacto |
| `city_postal` | 40000 Marrakech, Maroc | Página contacto |
| `hours_weekday` | Lun – Ven : 9h – 18h | Horarios contacto |
| `hours_saturday` | Sam : 10h – 14h | Horarios contacto |
| `instagram_url` | # | Redes sociales |
| `facebook_url` | # | Redes sociales |

### 5.3 Políticas RLS

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `neighborhoods` | Público | — | — | — |
| `properties` | Público | — | — | — |
| `contact_submissions` | Público | Público | — | — |
| `favorites` | Usuario propio | Usuario propio | Usuario propio | Usuario propio |
| `site_settings` | Público | — | — | — |

---

## 6. Variables de Entorno

### Local (`.env`)
```
VITE_SUPABASE_URL=https://slxlkbrqcjabsfuhlwdf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Netlify (producción)
Mismas variables configuradas en el panel de Netlify → Site Settings → Environment Variables.

---

## 7. Estado de Features por Página

### ✅ Completamente funcional (conectado a Supabase)

| Página | Feature | Estado |
|---|---|---|
| **Home** | Listado de barrios | ✅ Supabase |
| **Home** | Propiedades destacadas | ✅ Supabase |
| **Search** | Filtros + búsqueda | ✅ Supabase |
| **Search** | Mapa MapLibre | ✅ Funcional |
| **Search** | Grid/List/Map views | ✅ Funcional |
| **PropertyDetail** | Datos de propiedad | ✅ Supabase |
| **PropertyDetail** | Galería + Lightbox | ✅ Funcional |
| **PropertyDetail** | Mapa de ubicación | ✅ MapLibre |
| **PropertyDetail** | Formulario de contacto | ✅ Guarda en Supabase |
| **PropertyDetail** | Favoritos | ✅ Supabase (anónimo) |
| **Favorites** | Listado de favoritos | ✅ Supabase + localStorage |
| **Contact** | Formulario de contacto | ✅ Guarda en Supabase |

### ⚠️ Parcialmente funcional (fallback a mock/estático)

| Página | Feature | Estado | Nota |
|---|---|---|---|
| **Search** | Popups del mapa (desktop) | ✅ | HTML string crudo en MapLibre |
| **Search** | Bottom sheet (mobile) | ✅ | Green Acres style implementado |
| **Contact** | Datos de contacto | ✅ Supabase | Via `site_settings` |
| **PropertyDetail** | Datos de agente | ✅ Supabase | Via `site_settings` |

### ❌ No conectado a Supabase (contenido estático)

| Página | Qué falta | Prioridad |
|---|---|---|
| **Blog** | Todo el contenido es estático | Media |
| **Sell** | Datos de agentes hardcodeados | Media |
| **Sell** | Formulario de venta no guarda en BD | Alta |
| **Estimation** | Formulario no guarda en BD | Alta |
| **Estimer** | Probablemente estático/duplicado | Baja |
| **GestionLocative** | Contenido estático | Baja |
| **BuyerGuide** | Contenido estático (es un guide, puede quedar así) | Baja |
| **About** | Contenido estático | Baja |

---

## 8. Decisiones Técnicas Tomadas

### 8.1 Moneda dual (EUR / MAD)
- Se implementó un hook `useCurrency()` que formatea precios según la moneda seleccionada
- La preferencia se guarda en `localStorage` bajo la clave `currency`
- Default: EUR

### 8.2 Favoritos anónimos
- Se genera un `anonymous_id` vía `crypto.randomUUID()`
- Se guarda en `localStorage`
- Se sincroniza con Supabase tabla `favorites`
- **Limitación:** No persiste entre dispositivos/navegadores

### 8.3 Fallback a datos mock
- Si Supabase no está configurado (sin env vars), la app usa `src/data/properties.ts`
- Esto permite desarrollar offline

### 8.4 Code-splitting
- Todas las páginas excepto Home y NotFound usan `React.lazy()`
- MapLibre GL se carga solo en Search y PropertyDetail
- Bundle inicial: ~631 KB (antes era 1.9 MB)

### 8.5 Imágenes en `public/`
- **Decisión actual:** Todas las fotos están en la carpeta `public/`
- **Problema:** No se sirven desde CDN ni están optimizadas
- **Futuro:** Migrar a Supabase Storage con transformaciones automáticas

### 8.6 SEO
- `BrowserRouter` con `lang="fr"`
- Meta tags dinámicos en `index.html` (no SSR, solo SPA)
- Sitemap.xml generado estáticamente
- robots.txt configurado
- Open Graph tags básicos
- **Falta:** Schema.org JSON-LD para rich snippets

---

## 9. Problemas Conocidos (Bugs & Deuda Técnica)

### 🔴 Alta prioridad

| # | Problema | Dónde | Impacto |
|---|---|---|---|
| 1 | **Formularios Sell/Estimation no guardan** | Sell.tsx, Estimation.tsx | Pérdida de leads |
| 2 | **Links rotos en Footer** | Footer.tsx (href="#") | UX mala, SEO penalizado |
| 3 | **Console.log en producción** | Varios archivos | Datos expuestos en DevTools |
| 4 | **Sin rate limiting** | Todos los formularios | Riesgo de spam |

### 🟡 Media prioridad

| # | Problema | Dónde | Impacto |
|---|---|---|---|
| 5 | **27 errores ESLint** | `supabase.ts` (empty object types) | Calidad de código |
| 6 | **Imágenes en `public/` sin optimización** | Todo el sitio | Performance, LCP lento |
| 7 | **Blog estático** | Blog.tsx | No se puede editar sin código |
| 8 | **Datos de agentes hardcodeados** | Sell.tsx | No se puede cambiar sin deploy |
| 9 | **Sin Schema.org** | Todas las páginas | SEO rich snippets |
| 10 | **Favoritos no cross-device** | useFavorites.ts | UX inconsistente |

### 🟢 Baja prioridad (nice to have)

| # | Problema | Dónde |
|---|---|---|
| 11 | Sin PWA (instalable) | Global |
| 12 | Sin scroll infinito | Search.tsx |
| 13 | Sin skeleton loaders personalizados | Global |
| 14 | Lightbox no cierra con Escape | PropertyDetail.tsx |
| 15 | Bottom sheet no es arrastrable | Search.tsx (mobile map) |
| 16 | Sin CAPTCHA | Formularios |

---

## 10. Guía para Nuevos Desarrolladores

### 10.1 Setup inicial

```bash
git clone https://github.com/creativedesignseo/atlas-rouge-immobilier.git
cd atlas-rouge-immobilier
npm install
```

Crear `.env`:
```
VITE_SUPABASE_URL=https://slxlkbrqcjabsfuhlwdf.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

```bash
npm run dev  # http://localhost:5173
```

### 10.2 Comandos útiles

```bash
npm run dev      # Dev server
npm run build    # Build de producción
npm run preview  # Previsualizar build
npm run lint     # ESLint
```

### 10.3 Cómo agregar una nueva página

1. Crear archivo en `src/pages/MiPagina.tsx`
2. Agregar lazy import en `src/App.tsx`
3. Agregar ruta en `<Routes>`
4. Agregar link en Navbar si aplica

### 10.4 Cómo modificar datos de contacto

No tocar código. Ir a Supabase → Table Editor → `site_settings` → editar el valor.

### 10.5 Cómo agregar una propiedad

1. Ir a Supabase → Table Editor → `properties`
2. Insertar nueva fila con todos los campos
3. Asegurar que el `slug` sea único y URL-friendly
4. Subir fotos a `public/` o Supabase Storage
5. Actualizar el array `images` con las rutas

---

## 11. Changelog Resumido

| Fecha | Commit | Qué se hizo |
|---|---|---|
| Abr 2026 | `cd29ec35` | MVP inicial |
| Abr 2026 | `976629c4` | SEO overhaul, BrowserRouter, sitemap, robots, 404 |
| Abr 2026 | `e90db4c4` | Integración Supabase (services, schema, seed) |
| Abr 2026 | `4da8c3d4` | Mapas MapLibre GL reales |
| Abr 2026 | `694317f3` | Code-splitting, PropertyDetail form → Supabase, favorites sync |
| Abr 2026 | `1053fa03` | Expand map view desktop |
| Abr 2026 | `23fd9f7e` | 50/50 split layout desktop |
| Abr 2026 | `8a5e752b` | Hide filters sidebar cuando mapa está activo |
| Abr 2026 | `50aa82e4` | Grid 4 cols default, auto-switch a list con mapa |
| Abr 2026 | `4cd7a754` | Rich map popups con carrusel de imágenes |
| Abr 2026 | `c16f0015` | Spec icons elegantes (círculo crema + icono terracota), lightbox clickable |
| Abr 2026 | `28a5c8f6` | Configuración dinámica desde Supabase (`site_settings`) |
| Abr 2026 | `6c29ccf8` | Swipe táctil en galería móvil y lightbox |
| Abr 2026 | `46c9c995` | Experiencia mapa móvil estilo Green Acres (bottom sheet) |
| Abr 2026 | `b0156d59` | README completo documentado |

---

## 12. Contacto / Soporte

| Rol | Contacto |
|---|---|
| **Cuenta Supabase** | adspublioficial@gmail.com |
| **Repositorio** | https://github.com/creativedesignseo/atlas-rouge-immobilier |
| **Producción** | https://atlas-rouge-immobilier.netlify.app |

---

> **Nota para el equipo:** Este documento debe actualizarse cada vez que se agregue una nueva dependencia, tabla de BD, variable de entorno, o cuenta de servicio.
