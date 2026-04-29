const BUCKET_NAME = 'property-images'
const SUPABASE_URL = 'https://slxlkbrqcjabsfuhlwdf.supabase.co'

export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number
  resize?: 'cover' | 'contain' | 'fill'
}

/**
 * Detecta si estamos en desarrollo local (localhost/127.0.0.1)
 */
function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

/**
 * Genera una URL de imagen.
 *
 * En producción: usa el proxy /img/ bajo el dominio propio (oculta Supabase)
 * En local: usa Supabase Storage directamente
 */
export function getImageUrl(
  filename: string,
  options?: ImageTransformOptions
): string {
  // Remove leading slash if present
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename

  // En desarrollo local, ir directo a Supabase (no hay edge function local)
  if (isLocalDev()) {
    const params = new URLSearchParams()
    if (options?.width) params.set('width', String(options.width))
    if (options?.height) params.set('height', String(options.height))
    if (options?.quality) params.set('quality', String(options.quality))
    if (options?.resize) params.set('resize', options.resize)

    if (params.toString()) {
      return `${SUPABASE_URL}/storage/v1/render/image/public/${BUCKET_NAME}/${cleanFilename}?${params.toString()}`
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanFilename}`
  }

  // En producción: usar proxy /img/ bajo dominio propio
  const params = new URLSearchParams()
  if (options?.width) params.set('width', String(options.width))
  if (options?.height) params.set('height', String(options.height))
  if (options?.quality) params.set('quality', String(options.quality))
  if (options?.resize) params.set('resize', options.resize)

  const query = params.toString() ? `?${params.toString()}` : ''
  return `/img/${cleanFilename}${query}`
}

/**
 * Genera URLs para un array de imágenes de propiedad.
 */
export function getPropertyImageUrls(
  filenames: string[],
  options?: ImageTransformOptions
): string[] {
  return filenames.map(f => getImageUrl(f, options))
}
