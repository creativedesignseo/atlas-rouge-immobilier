# 2026-06-05 — Blindar la primera carga ("cargar siempre a la primera")

## Objetivo
El owner reportaba que en la primera visita la web a veces no cargaba / quedaba
en blanco o con secciones vacías y había que recargar a mano (efecto "web hecha
con IA"). Hacer que cada fallo de la primera carga se auto-recupere o muestre
un estado explícito con reintento, y que el owner se entere vía beacon.

## Diagnóstico (tres causas, ninguna se auto-recuperaba)
1. Guard de stale-chunk en `main.tsx` recargaba 1 sola vez y nunca reseteaba el
   flag → 2º fallo en la sesión = blanco permanente.
2. `neighborhood.service.ts` sin `withTimeout` → cuelgue infinito. Ningún
   servicio reintentaba → un blip dejaba la sección vacía. `Home.tsx` sin
   loading/error/retry → fallo silencioso.
3. `LangDetector` (`App.tsx`) `return null` durante una race async (1500ms) →
   blanco en `/`.

## Archivos nuevos
- `src/lib/staleChunk.ts` — `isStaleChunkError` compartido (regex ampliada
  Safari/Firefox), rompe la duplicación main.tsx/ErrorBoundary.
- `src/lib/retry.ts` — `withTimeout` (extraído) + `withRetry` (backoff+jitter,
  timeout por intento, `isTransientError` no reintenta 4xx/PGRST116).
- `src/lib/reportError.ts` — beacon best-effort (sendBeacon, no PII: solo
  pathname+hash, throttle+dedupe, nunca lanza).
- `netlify/functions/report-error.js` — registra el error en function logs
  (+Telegram opcional), valida/trunca, rechaza payloads >4KB. Sin BD, sin PII.

## Archivos modificados
- `src/services/neighborhood.service.ts` — withTimeout+withRetry; fetch lanza en
  error transitorio; PGRST116 → null.
- `src/services/property.service.ts` — `withTimeout` extraído; helper `resilient`
  (retry + fallback mock solo en DEV); getters rechazan en prod tras reintentos.
- `src/services/blog.service.ts` — withRetry interno; contrato no-rechazante
  (blog es secundario, oculto si vacío).
- `src/main.tsx` — guard por timestamp (cooldown 10s) anti-bucle y anti-atasco;
  beacon en listeners globales.
- `src/components/ErrorBoundary.tsx` — usa `isStaleChunkError` compartido +
  beacon en componentDidCatch.
- `src/App.tsx` — LangDetector síncrono (sin blanco); quitados imports muertos
  (`useState`, `resolveInitialLanguage`).
- `src/pages/Home.tsx` — estado loading/error por sección (featured +
  neighborhoods) con `SectionFallback` (spinner→error+retry) y `reloadKey`.
- `src/pages/PropertyDetail.tsx` — separa 404 (null) de error de red
  (loadError → retry).
- `src/components/admin/PropertyForm.tsx` — `.catch` en getNeighborhoods (ahora
  puede rechazar).
- `src/locales/{fr,es,en}/home.json` + `property.json` — bloque `error.*`.

## Decisiones
- `withRetry` envuelve el FETCHER dentro de `refetch`, nunca `refetch` → la
  deduplicación in-flight del queryCache se preserva (no se tocó queryCache.ts).
- Criticidad diferenciada: property/neighborhood getters rechazan (UI de error);
  blog getters no rechazan (sección secundaria).
- Guard de chunk por timestamp en vez de flag one-shot: resuelve a la vez el
  bucle infinito y el atasco permanente.

## Verificación (verify.sh verde + runtime con preview prod + Playwright)
- Happy path: properties/neighborhoods/blog 200, 0 errores consola, redirect
  `/`→`/es/` instantáneo (sin blanco).
- Fallo total (abort de supabase): Home muestra error+retry (2 botones), no
  hueco mudo; neighborhoods no cuelga.
- Recuperación: click Reintentar tras desbloquear → ambas secciones cargan.
- Retry transitorio: 2 fallos + éxito al 3º intento → el usuario NUNCA ve error
  (auto-cura — la cura directa del bug reportado).
- GSAP: 35/35 tarjetas a opacidad completa (sin invisibles).
- Beacon: `sendBeacon` dispara a `/.netlify/functions/report-error` en error.

## Riesgos abiertos / pendiente
- La Netlify Function `report-error` solo se ejecuta en prod (vite preview no
  sirve functions); verificada estáticamente. Confirmar en prod que aparece en
  los function logs y, si se quiere ping a Telegram, setear `TELEGRAM_BOT_TOKEN`
  + `TELEGRAM_CHAT_ID` en Netlify env.
- `geoLanguage.ts` queda con exports sin uso (no rompe nada); limpieza opcional.
- Sin commit ni deploy — pendiente OK del owner (Netlify auto-deploya en push).

## Próximo paso
Owner revisa el diff y decide commit. Al desplegar, vigilar function logs para
ver si aparecen reportes `[client-error]`.

---

## ADENDA (mismo día) — CAUSA RAÍZ real encontrada en prod

Tras desplegar lo anterior, el owner (logueado en /admin) seguía viendo el fallo:
los 3 fetches del Home daban **TIMEOUT** tras agotar los reintentos. Evidencia en
consola: `Failed to load neighborhoods/featured/blog: Error: TIMEOUT`.

**Diagnóstico definitivo:** no era un blip de red — era `supabase-js` colgándose.
El cliente principal `supabase` lleva la sesión del agente logueado; en la primera
carga intenta **refrescar el token** y, mientras ese refresh se atasca, TODAS las
lecturas PostgREST esperan al token → TIMEOUT. Por eso solo le pasaba al owner
(con sesión) y nunca a un visitante anónimo (los tests en navegador limpio
pasaban). Es el mismo patrón ya documentado en el admin (`adminRest.ts` /
feedback memory: "supabase-js se cuelga").

**Cura:** cliente anónimo dedicado `supabasePublic` en `src/lib/supabase.ts`
(`persistSession:false`, `autoRefreshToken:false`, `detectSessionInUrl:false`).
Las lecturas públicas no necesitan la sesión (RLS permite `anon`), así que no
esperan a nada. Cambiados a `supabasePublic`:
- `property.service.ts` (alias), `neighborhood.service.ts` (alias),
- `blog.service.ts` (solo las 3 lecturas; las escrituras siguen en `supabase`),
- `hooks/useFavorites.tsx` (favoritos son anónimos por anon_id).

Los reintentos/UI de error anteriores se quedan como red de seguridad.

**Verificación (reproducción exacta del bug):** preview prod + Playwright,
sembrando una sesión de admin CADUCADA y colgando `/auth/v1/**` (el refresh).
Resultado: `authRefreshAttempted:true` (el refresh se intenta y cuelga) pero los
datos cargan igual (35 tarjetas, sin error UI). Antes esto habría dado TIMEOUT.
`verify.sh` + `tsc` verdes.
