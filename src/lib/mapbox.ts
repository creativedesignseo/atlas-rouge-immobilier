import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

/**
 * Centralised Mapbox configuration.
 *
 * The public token is browser-safe by design (it is restricted by URL in the
 * Mapbox account), so it ships in the bundle via a `VITE_`-prefixed env var —
 * unlike server-only secrets such as DEEPSEEK_API_KEY.
 *
 * Map components import the configured `mapboxgl` from here so the access
 * token is set exactly once, and they share the same style + WebGL check.
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export const hasMapboxToken = MAPBOX_TOKEN.length > 0

if (hasMapboxToken) {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

/**
 * Mapbox Standard — modern 2D cartography. Used flat (pitch 0); 3D buildings
 * are not relied upon (sparse OSM coverage in Marrakech). See the migration
 * plan for the rationale.
 */
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/standard'

/**
 * Mapbox GL JS v3 requires WebGL2 (not WebGL1). Probe specifically for the
 * `webgl2` context; if it is unavailable the caller should fall back to the
 * static placeholder instead of trying to instantiate a map.
 */
export function canUseWebGL(): boolean {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return Boolean(canvas.getContext('webgl2'))
}

export default mapboxgl
