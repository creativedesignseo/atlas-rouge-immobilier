const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

const LANG_NAMES = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
}

// Origins allowed to call this admin-only endpoint. Override with the
// ALLOWED_ORIGINS env var (comma-separated) if the domain changes.
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || 'https://atlasrouge.com,https://www.atlasrouge.com'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function resolveCors(event) {
  const origin = event.headers.origin || event.headers.Origin || ''
  // In dev / deploy-preview / branch-deploy, reflect any origin so previews work.
  const allowAll = process.env.CONTEXT && process.env.CONTEXT !== 'production'
  const allowed = !origin || allowAll || ALLOWED_ORIGINS.includes(origin)
  return {
    allowed,
    headers: {
      'Access-Control-Allow-Origin': allowed ? origin || ALLOWED_ORIGINS[0] : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      Vary: 'Origin',
    },
  }
}

// Best-effort per-IP rate limit. Netlify Functions are stateless across cold
// starts, so this only throttles bursts within a warm instance — a mitigation,
// not a guarantee. A robust limit (Redis/Upstash) is tracked as P1.
const rateState = new Map()
function isRateLimited(ip, limit = 20, windowMs = 60_000) {
  if (!ip) return false
  const now = Date.now()
  const entry = rateState.get(ip)
  if (!entry || now > entry.resetAt) {
    rateState.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count += 1
  return entry.count > limit
}

function clientIp(event) {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    (event.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    ''
  )
}

// Authorize the caller: must hold a valid Supabase session AND be an active
// agent. We use the caller's own token so the `agents` read is governed by the
// "Agent can read own row" RLS policy. Returns true only for active agents.
async function isActiveAgent(event, supabaseUrl, anonKey) {
  const header = event.headers.authorization || event.headers.Authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return false
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) return false
    const user = await userRes.json()
    if (!user || !user.id) return false

    const agentRes = await fetch(
      `${supabaseUrl}/rest/v1/agents?user_id=eq.${encodeURIComponent(user.id)}&is_active=eq.true&select=id`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
    )
    if (!agentRes.ok) return false
    const rows = await agentRes.json()
    return Array.isArray(rows) && rows.length > 0
  } catch {
    return false
  }
}

function makeJson(corsHeaders) {
  return (statusCode, body) => ({
    statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function cleanModelResponse(text) {
  return text
    .replace(/```(?:json)?/g, '')
    .replace(/```/g, '')
    .trim()
}

exports.handler = async (event) => {
  const cors = resolveCors(event)
  const json = makeJson(cors.headers)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors.headers, body: '' }
  }

  if (!cors.allowed) {
    return json(403, { error: 'Origin not allowed' })
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  if (isRateLimited(clientIp(event))) {
    return json(429, { error: 'Too many requests' })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return json(500, { error: 'DeepSeek API key is not configured on the server' })
  }

  // Admin-only endpoint: require a valid Supabase session. This stops anonymous
  // callers from burning the paid DeepSeek quota.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return json(500, { error: 'Auth is not configured on the server' })
  }
  if (!(await isActiveAgent(event, supabaseUrl, anonKey))) {
    return json(401, { error: 'Active agent session required' })
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const sourceLang = payload.sourceLang
  const content = payload.content || {}
  const supported = ['en', 'fr', 'es']
  if (!supported.includes(sourceLang)) {
    return json(400, { error: 'Unsupported source language' })
  }

  if (!content.title || !content.description) {
    return json(400, { error: 'Title and description are required' })
  }

  const targetLangs = supported.filter((lang) => lang !== sourceLang)
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  const prompt = `You are a senior real-estate localization editor for a luxury property agency in Marrakech.

The source listing is written in ${LANG_NAMES[sourceLang]}. Adapt it for ${targetLangs.map((lang) => LANG_NAMES[lang]).join(' and ')} audiences.

This is not a word-for-word translation. Keep the facts exact, preserve proper nouns, prices, measurements, neighborhoods and the Marrakech/Morocco context. Make the copy sound natural for each target market while keeping a luxury real-estate tone.

Full property context:
- Transaction: ${content.transaction}
- Property type: ${content.type}
- City: ${content.city}
- Neighborhood: ${content.neighborhood || 'Not specified'}
- Price EUR: ${content.priceEUR || 'Not specified'}
- Price MAD: ${content.priceMAD || 'Not specified'}
- Surface: ${content.surface || 'Not specified'} m2
- Land surface: ${content.landSurface || 'Not specified'} m2
- Rooms: ${content.rooms ?? 'Not specified'}
- Bedrooms: ${content.bedrooms ?? 'Not specified'}
- Bathrooms: ${content.bathrooms ?? 'Not specified'}
- Amenities: ${(content.amenities || []).join(' | ') || 'Not specified'}

Source title:
${content.title}

Source description:
${content.description}

Source key features:
${(content.highlights || []).join(' | ') || 'None'}

Return ONLY valid JSON, no markdown, using this exact shape:
{
${targetLangs.map((lang) => `  "${lang}": { "title": "...", "description": "...", "highlights": ["...", "..."], "amenities": [] }`).join(',\n')}
}`

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.35,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    return json(response.status, { error: `DeepSeek API error: ${response.status}` })
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) {
    return json(502, { error: 'Empty response from DeepSeek' })
  }

  try {
    return json(200, JSON.parse(cleanModelResponse(text)))
  } catch {
    return json(502, { error: 'DeepSeek returned invalid JSON' })
  }
}
