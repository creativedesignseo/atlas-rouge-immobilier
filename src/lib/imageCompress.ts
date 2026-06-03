// Compress ANY browser-decodable image (JPG/PNG/WebP/AVIF) to WebP using the
// browser's NATIVE decoder. Mirrors the logic in ImageUploader so single-image
// admin forms (e.g. neighborhood photo) can reuse it without pulling in the
// whole multi-image uploader. We avoid browser-image-compression on purpose:
// it can't decode AVIF and loads a worker script from a CDN our CSP blocks.
// createImageBitmap handles AVIF + EXIF orientation; canvas.toBlob re-encodes.

const MAX_SIDE = 2560
const WEBP_QUALITY = 0.82

export async function compressToWebp(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height)) // never upscale
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
  )
  if (!blob) throw new Error('WebP encoding failed')
  return blob
}
