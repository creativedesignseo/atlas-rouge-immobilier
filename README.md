# Atlas Rouge Immobilier

[![Netlify Status](https://api.netlify.com/api/v1/badges/atlas-rouge-immobilier/deploy-status)](https://atlas-rouge-immobilier.netlify.app)

> Agencia inmobiliaria especializada en propiedades de lujo en Marrakech, Marruecos. Orientada a clientes francófonos (principalmente de Francia).

**URL de producción:** [https://atlas-rouge-immobilier.netlify.app](https://atlas-rouge-immobilier.netlify.app)

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI Framework |
| TypeScript | 5.7 | Tipado estático |
| Vite | 7 | Build tool & dev server |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| shadcn/ui | — | Componentes base (Button, Dialog, etc.) |
| Supabase | — | Base de datos PostgreSQL + Auth + Storage |
| MapLibre GL | — | Mapas interactivos (Search & PropertyDetail) |
| GSAP | — | Animaciones de scroll |
| React Router DOM | 7 | Enrutamiento SPA |
| Lucide React | — | Iconos |

---

## Arquitectura de Carpetas

```
src/
├── components/          # Componentes reutilizables
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── PropertyCard.tsx
│   └── SectionReveal.tsx
├── data/                # Datos mock (fallback si Supabase falla)
│   └── properties.ts
├── hooks/               # Custom React hooks
│   ├── useCurrency.ts       # Persistencia EUR/MAD en localStorage
│   ├── useFavorites.ts      # Favoritos anónimos sincronizados con Supabase
│   └── useSiteSettings.ts   # Configuración del sitio desde Supabase
├── lib/                 # Utilidades y configuración
│   ├── supabase.ts          # Cliente Supabase
│   └── utils.ts             # Helpers (cn, etc.)
├── pages/               # Páginas de la aplicación (code-splitting)
│   ├── Home.tsx
│   ├── Search.tsx           # Búsqueda con mapa MapLibre
│   ├── PropertyDetail.tsx   # Ficha de propiedad + mapa + contacto
│   ├── Contact.tsx
│   ├── About.tsx
│   ├── Sell.tsx
│   ├── Estimation.tsx
│   ├── Favorites.tsx
│   ├── BuyerGuide.tsx
│   ├── Blog.tsx
│   ├── GestionLocative.tsx
│   └── Estimer.tsx
├── services/            # Capa de acceso a datos
│   ├── property.service.ts
│   ├── neighborhood.service.ts
│   ├── contact.service.ts
│   └── settings.service.ts
├── types/               # Tipos TypeScript
│   └── supabase.ts
├── App.tsx              # Router principal con lazy loading
└── main.tsx             # Entry point
```

---

## Instalación Local

### Requisitos
- Node.js 20+
- npm

### Pasos

```bash
# 1. Clonar
git clone https://github.com/creativedesignseo/atlas-rouge-immobilier.git
cd atlas-rouge-immobilier

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase (ver abajo)

# 4. Iniciar servidor de desarrollo
npm run dev
```

El servidor corre en `http://localhost:5173`

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

> **Nota:** No usar la Service Role Key en el frontend. La Anon Key es suficiente porque todas las tablas tienen políticas RLS configuradas.

---

## Base de Datos (Supabase)

### Tablas

#### `neighborhoods`
Barrios de Marrakech. Se usa en la home y en filtros de búsqueda.

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | text | Nombre del barrio |
| `slug` | text | Identificador URL-friendly |
| `image` | text | Imagen representativa |
| `description` | text | Descripción corta |
| `subtitle` | text | Subtítulo decorativo |
| `property_count` | integer | Nº de propiedades (estadística) |

#### `properties`
Propiedades inmobiliarias. El corazón de la aplicación.

| Campo | Tipo | Descripción |
|---|---|---|
| `slug` | text | Identificador único en URL |
| `transaction` | enum | `sale` o `rent` |
| `type` | enum | `villa`, `apartment`, `riad`, `prestige`, `land`, `rooftop` |
| `neighborhood_id` | uuid | FK a `neighborhoods` |
| `city` | text | Ciudad (default: Marrakech) |
| `price_eur` | integer | Precio en euros |
| `price_mad` | integer | Precio en dirhams |
| `surface` | integer | m² construidos |
| `land_surface` | integer | m² de terreno (opcional) |
| `rooms` | integer | Nº de habitaciones totales |
| `bedrooms` | integer | Nº de dormitorios |
| `bathrooms` | integer | Nº de baños |
| `description` | text | Descripción larga |
| `highlights` | text[] | Array de puntos fuertes |
| `amenities` | text[] | Array de equipamientos |
| `images` | text[] | Array de URLs de imágenes |
| `latitude` / `longitude` | numeric | Coordenadas para el mapa |
| `is_featured` | boolean | Sale en la home |
| `is_exclusive` | boolean | Muestra badge "Exclusivité" |

#### `contact_submissions`
Formularios de contacto recibidos.

| Campo | Tipo | Descripción |
|---|---|---|
| `name`, `email`, `phone` | text | Datos del contacto |
| `subject` | text | Asunto |
| `message` | text | Mensaje |
| `property_slug` | text | Slug de la propiedad (si aplica) |

#### `favorites`
Favoritos de usuarios. Soporta usuarios autenticados y anónimos (vía `anonymous_id`).

#### `site_settings` ⭐
**Configuración dinámica del sitio.** Permite cambiar datos de contacto, agente, horarios, etc. sin modificar código.

| Campo | Tipo | Descripción |
|---|---|---|
| `key` | text | Identificador único |
| `value` | text | Valor |

**Claves configurables:**

| Key | Ejemplo | Dónde se usa |
|---|---|---|
| `company_name` | Atlas Rouge Immobilier | Footer, mapa decorativo |
| `agent_name` | Sophie Martin | Panel de contacto en PropertyDetail |
| `agent_title` | Conseillère immobilière | Panel de contacto en PropertyDetail |
| `phone` | +212 524 00 00 00 | Contact.tsx, PropertyDetail sticky bar |
| `whatsapp` | +212 600 00 00 00 | Botones de WhatsApp |
| `email` | contact@atlasrouge.immo | Formulario de contacto |
| `address` | 123 Boulevard Mohamed VI, Guéliz | Página de contacto |
| `city_postal` | 40000 Marrakech, Maroc | Página de contacto |
| `hours_weekday` | Lun – Ven : 9h – 18h | Horarios en Contact.tsx |
| `hours_saturday` | Sam : 10h – 14h | Horarios en Contact.tsx |
| `instagram_url` | # | Redes sociales |
| `facebook_url` | # | Redes sociales |

> **Cómo modificar:** Ir a Supabase → Table Editor → `site_settings` → editar el valor. El cambio se refleja inmediatamente en el sitio sin redeployar.

### Scripts SQL

Los scripts de creación y seed están en `/supabase/`:
- `schema.sql` — Creación de tablas, índices y políticas RLS
- `seed.sql` — Datos iniciales (barrios, propiedades, settings)

### Políticas RLS

| Tabla | Política |
|---|---|
| `neighborhoods` | Lectura pública |
| `properties` | Lectura pública |
| `contact_submissions` | Inserción y lectura pública |
| `favorites` | Solo el usuario autenticado puede gestionar los suyos |
| `site_settings` | Lectura pública |

---

## Features Implementadas

### Core
- [x] Listado de propiedades con filtros (tipo, barrio, precio, habitaciones)
- [x] Ficha de propiedad con galería, especificaciones, mapa y contacto
- [x] Mapa interactivo MapLibre GL en búsqueda y ficha de propiedad
- [x] Favoritos anónimos sincronizados con Supabase
- [x] Formulario de contacto conectado a Supabase
- [x] Cambio de moneda EUR / MAD con persistencia en localStorage

### UX/UI
- [x] Diseño responsive (mobile-first)
- [x] Animaciones GSAP en scroll
- [x] Lightbox de fotos en PropertyDetail
- [x] Popups ricos en el mapa de búsqueda con carrusel de imágenes
- [x] Vista grid (4 cols) / lista / mapa en búsqueda
- [x] Split 50/50 en escritorio cuando el mapa está activo

### SEO & Performance
- [x] Meta tags dinámicos por página
- [x] Open Graph tags
- [x] Sitemap.xml y robots.txt
- [x] Lazy loading de páginas con React.lazy()
- [x] Code-splitting (bundle inicial ~631 KB)

### Configuración Dinámica
- [x] Datos de contacto/agente desde Supabase (`site_settings`)

---

## Despliegue

### Netlify (producción)
El proyecto está configurado para deploy automático desde GitHub:

1. Push a la rama `main`
2. Netlify detecta el cambio y ejecuta `npm run build`
3. El sitio se actualiza automáticamente

**Variables de entorno en Netlify:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Build manual
```bash
npm run build
```
Genera la carpeta `dist/` lista para servir estáticamente.

---

## Comandos Útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar build localmente |
| `npm run lint` | Ejecutar ESLint |

---

## Notas para Desarrolladores

### Fallback a datos mock
Si Supabase no está configurado (sin variables de entorno), la aplicación usa datos mock del archivo `src/data/properties.ts`. Esto permite desarrollar localmente sin conexión a la base de datos.

### Código de moneda
La moneda seleccionada (EUR/MAD) se guarda en `localStorage` bajo la clave `currency`. El hook `useCurrency` se encarga de formatear los precios según la moneda activa.

### Favoritos anónimos
Se genera un `anonymous_id` vía `crypto.randomUUID()` y se guarda en `localStorage`. Los favoritos se sincronizan con Supabase usando este ID, permitiendo que persistan entre sesiones del mismo navegador.

### Code-splitting
Todas las páginas excepto Home y NotFound se cargan con `React.lazy()` para reducir el bundle inicial. El chunk de MapLibre GL (~1 MB) solo se carga cuando se visita Search o PropertyDetail.

---

## Créditos

- **Diseño y desarrollo:** [Atlas Rouge Immobilier](https://atlas-rouge-immobilier.netlify.app)
- **Mapas:** [MapLibre GL](https://maplibre.org/) + [CARTO Voyager](https://carto.com/basemaps/) tiles
- **Backend:** [Supabase](https://supabase.com/)
- **Hosting:** [Netlify](https://netlify.com/)
