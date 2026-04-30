import type { Config } from '@netlify/edge-functions'

const SUPABASE_URL = 'https://slxlkbrqcjabsfuhlwdf.supabase.co'
const BUCKET_NAME = 'property-images'

export default async function handler(request: Request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Extract image path after /img/
  const imagePath = pathname.replace(/^\/img\//, '')
  if (!imagePath || imagePath.includes('..')) {
    return new Response('Not found', { status: 404 })
  }

  // Build Supabase Storage URL with transformations
  const params = url.searchParams
  const transformParams = new URLSearchParams()

  if (params.has('width')) transformParams.set('width', params.get('width')!)
  if (params.has('height')) transformParams.set('height', params.get('height')!)
  if (params.has('quality')) transformParams.set('quality', params.get('quality')!)
  if (params.has('resize')) transformParams.set('resize', params.get('resize')!)

  const hasTransform = transformParams.toString().length > 0

  let supabaseUrl: string
  if (hasTransform) {
    supabaseUrl = `${SUPABASE_URL}/storage/v1/render/image/public/${BUCKET_NAME}/${imagePath}?${transformParams.toString()}`
  } else {
    supabaseUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${imagePath}`
  }

  // Fetch image from Supabase
  const response = await fetch(supabaseUrl, {
    method: 'GET',
    headers: {
      // Forward accept header for WebP detection
      'Accept': request.headers.get('Accept') || 'image/*',
    },
  })

  if (!response.ok) {
    return new Response('Image not found', { status: 404 })
  }

  // Build response with cache headers
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('Vary', 'Accept')

  return new Response(response.body, {
    status: 200,
    headers,
  })
}

export const config: Config = {
  path: '/img/*',
}
