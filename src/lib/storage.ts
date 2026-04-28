const BUCKET_NAME = 'property-images'

export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number
  resize?: 'cover' | 'contain' | 'fill'
}

/**
 * Genera una URL de Supabase Storage para una imagen.
 */
export function getImageUrl(
  filename: string,
  options?: ImageTransformOptions
): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  // Remove leading slash if present (database stores bare filenames)
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename

  if (options && (options.width || options.height || options.quality)) {
    // Transform URL: auto WebP, resize, quality
    const params = new URLSearchParams()
    if (options.width) params.set('width', String(options.width))
    if (options.height) params.set('height', String(options.height))
    if (options.quality) params.set('quality', String(options.quality))
    if (options.resize) params.set('resize', options.resize)

    return `${supabaseUrl}/storage/v1/render/image/public/${BUCKET_NAME}/${cleanFilename}?${params.toString()}`
  }

  // Public URL (original quality)
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${cleanFilename}`
}

/**
 * Genera URLs para un array de imágenes de propiedad.
 * Útil para galerías y carruseles.
 */
export function getPropertyImageUrls(
  filenames: string[],
  options?: ImageTransformOptions
): string[] {
  return filenames.map(f => getImageUrl(f, options))
}
