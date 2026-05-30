# 2026-05-30 — Migración de mapas MapLibre GL → Mapbox GL JS

## Objetivo
El owner reportó que el mapa "se rompió" y decidió pasar a Mapbox oficial
(mejor estética, control de marca, lo que usan las grandes inmobiliarias).
Tras investigación + decisiones del owner: usar **Mapbox Standard en 2D plano**
(sin 3D, porque en Marrakech los edificios/casas no tienen cobertura 3D en OSM).

## Investigación (resumen)
- Mapbox lo usan Zillow, RocketHomes, HomeLight, HouseCanary… (clientes
  inmobiliarios confirmados por Mapbox).
- Precio: 50k cargas de mapa/mes gratis (vs ~28.5k de Google), overage más
  barato. Para el tráfico actual → 0 €.
- Standard 3D descartado: en Marrakech no hay footprints/landmarks 3D útiles.
  Se usa Standard por su cartografía moderna 2D.

## Diagnóstico de la "rotura"
- CartoCDN (`voyager-gl-style`) respondía HTTP 200 — el estilo gratuito NO
  estaba caído a nivel servidor. La causa visible pudo ser transitoria/WebGL.
- El historial confirma que **nunca hubo Mapbox real**; los `@mapbox/*` del
  lockfile eran deps internas de MapLibre.

## Archivos cambiados
- `package.json` — fuera `maplibre-gl`, dentro `mapbox-gl ^3.24` +
  `@types/mapbox-gl` (dev).
- `src/lib/mapbox.ts` (NUEVO) — config central: `accessToken` desde
  `VITE_MAPBOX_TOKEN`, `MAPBOX_STYLE = mapbox://styles/mapbox/standard`,
  `hasMapboxToken`, `canUseWebGL()` (ahora exige contexto `webgl2`, requisito
  de GL JS v3). Re-exporta el `mapboxgl` configurado.
- `src/components/property/LocationMap.tsx` — usa `@/lib/mapbox`, `style` +
  `pitch: 0`, guard `!hasMapboxToken → mapError`. Tipos y constructores
  `maplibregl.* → mapboxgl.*`.
- `src/pages/Search.tsx` (`MapView`) — idem: import central, quita el
  `canUseWebGL` local duplicado, `style` + `pitch: 0` + guard, tipos/refs y
  `Marker/Popup/LngLatBounds` → `mapboxgl`.
- `src/vite-env.d.ts` (NUEVO) — tipa `VITE_MAPBOX_TOKEN` + `VITE_SUPABASE_*`.
- `.env.example` — documenta `VITE_MAPBOX_TOKEN`.

## Comandos
- `npm uninstall maplibre-gl && npm install mapbox-gl && npm i -D @types/mapbox-gl`
- `bash scripts/verify.sh` → **verde** (lint OK, build OK, tsc OK).

## Resultado de verificación
- Build/lint/typecheck en verde.
- ⚠️ Bundle: el chunk `mapbox-*.js` pesa ~1.8 MB (gzip ~497 kB), más que el de
  maplibre (~1 MB). Va en su propio chunk (no en el `index` principal), se carga
  solo en Search/PropertyDetail. Aceptable, anotado para posible polish.

### Verificación EN VIVO (Playwright, dev server con token real)
- Token del owner `atlasrouge v2` (`pk.…5cVdeYm92F2LSp2E94Lsvw`, usuario
  `adspubli`) validado: `TokenValid`. El `style.json`, `iconset.pbf` y **los
  pines de precio se renderizan** sobre `/acheter`.
- En `localhost` los tiles daban **403** — pero NO era un problema de cuenta ni
  de código. **El token está restringido por URL a `atlasrouge.com`** (en el
  dashboard, columna URLs = 1). Confirmado con curl:
  - `Referer: https://atlasrouge.com/` → tile **200** ✅
  - `Referer: https://www.atlasrouge.com/` → tile **200** ✅
  - `Referer: http://localhost:3000/` → tile **403** ❌
- (Descartada mi hipótesis inicial errónea de "falta método de pago": la cuenta
  sirve tiles sin problema — otro proyecto del owner, taxi-luxride, usa Mapbox
  gratis en la misma cuenta.)
- **Conclusión: el código es correcto y EN PRODUCCIÓN el mapa funcionará tal
  cual** (el token está bien restringido a atlasrouge.com). El 403 era solo el
  artefacto de probar desde localhost.

## Estado: ✅ DESPLEGADO Y VERIFICADO EN PRODUCCIÓN (2026-05-30)
- Commit `70af4956` (solo Mapbox, sin Phase 0). Push a `main` → Netlify deploy
  OK (40s). `VITE_MAPBOX_TOKEN` añadido a Netlify env (all contexts).
- CSP en `netlify.toml` actualizada: `connect-src` + `api.mapbox.com`/
  `events.mapbox.com`, `worker-src 'self' blob:`.
- **Verificación en vivo** (Playwright sobre https://atlasrouge.com/fr/acheter
  → vista Carte): tiles `api.mapbox.com/v4` y raster → **HTTP 200**, **0 errores
  de consola**, basemap Mapbox Standard renderiza con los pines de precio.
- Sin token, ambos mapas degradan al placeholder (guard `hasMapboxToken`).
- LocationMap (ficha de propiedad) usa el mismo `@/lib/mapbox` → mismo resultado.

## Pendiente menor (opcional, no bloquea prod)
1. (Solo dev LOCAL) owner añade `http://localhost:3000`/`:5173` a las URLs del
   token `atlasrouge v2`, o usa el "Default public token", y pone
   `VITE_MAPBOX_TOKEN` en su `.env.local`. En prod ya funciona.
2. Polish opcional: el chunk `mapbox` pesa ~1.8 MB; se podría code-splitear más.

## Alternativas a Mapbox (no necesarias, registradas por si acaso)
MapTiler (100k/mes gratis, MapLibre, sin tarjeta — la mejor), Stadia Maps,
Protomaps (self-host), CARTO (lo previo), Google Maps (requiere tarjeta).
