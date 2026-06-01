const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

const LANG_NAMES = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
}

const DEFAULT_SUPABASE_URL = 'https://slxlkbrqcjabsfuhlwdf.supabase.co'
const AUTH_TIMEOUT_MS = 5000

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

function normalizeSupabaseUrl(url) {
  return (url || DEFAULT_SUPABASE_URL).replace(/\/+$/, '')
}

function decodeJwtPayload(jwt) {
  try {
    const [, payload] = String(jwt || '').split('.')
    if (!payload) return null
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      Math.ceil(payload.length / 4) * 4,
      '=',
    )
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

function bearerToken(event) {
  const header = event.headers.authorization || event.headers.Authorization || ''
  const match = String(header).match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ''
}

function supabaseProjectRef(supabaseUrl) {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0]
  } catch {
    return ''
  }
}

function supabaseUrlForToken(token, configuredUrl) {
  const configured = normalizeSupabaseUrl(configuredUrl)
  const payload = decodeJwtPayload(token)
  if (typeof payload?.iss !== 'string') return configured

  try {
    const issuer = new URL(payload.iss)
    const trusted = new URL(DEFAULT_SUPABASE_URL)
    if (issuer.hostname === trusted.hostname && issuer.pathname.replace(/\/+$/, '') === '/auth/v1') {
      return DEFAULT_SUPABASE_URL
    }
  } catch {
    // Fall back to configured env/default URL.
  }
  return configured
}

function authApiKeys(token, anonKey, supabaseUrl) {
  const keys = []
  const ref = supabaseProjectRef(supabaseUrl)
  const anonPayload = decodeJwtPayload(anonKey)
  const anonLooksMismatched = anonPayload?.ref && ref && anonPayload.ref !== ref

  if (anonKey && !anonLooksMismatched) {
    keys.push({ label: 'anon', value: anonKey })
  }

  // Supabase's API gateway accepts a project JWT as the apikey. Trying the
  // caller's own access token as a fallback keeps the active-agent check intact
  // while surviving a stale/mismatched anon key in the Netlify runtime.
  if (token) {
    keys.push({ label: 'session', value: token })
  }

  if (anonKey && anonLooksMismatched) {
    keys.push({ label: 'anon_mismatch', value: anonKey })
  }

  return keys.filter((key, index, arr) => (
    key.value && arr.findIndex((candidate) => candidate.value === key.value) === index
  ))
}

async function fetchJsonWithTimeout(url, headers) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS)
  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    const text = await response.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = { parseError: true }
    }
    return { response, body }
  } finally {
    clearTimeout(timeout)
  }
}

async function firstSupabaseOk(url, token, apiKeys) {
  const attempts = []
  for (const apiKey of apiKeys) {
    try {
      const { response, body } = await fetchJsonWithTimeout(url, {
        apikey: apiKey.value,
        Authorization: `Bearer ${token}`,
      })
      if (response.ok) return { ok: true, body, apiKey: apiKey.label }
      attempts.push({
        apiKey: apiKey.label,
        status: response.status,
        code: body?.code || body?.error_code || body?.error || null,
      })
    } catch (error) {
      attempts.push({
        apiKey: apiKey.label,
        status: 'fetch_error',
        code: error instanceof Error ? error.name : 'unknown',
      })
    }
  }
  return { ok: false, attempts }
}

function logAuthDenied(result, supabaseUrl) {
  console.warn('[translate-property] active-agent auth denied', {
    reason: result.reason,
    supabaseHost: (() => {
      try { return new URL(supabaseUrl).hostname } catch { return 'invalid-url' }
    })(),
    userAttempts: result.userAttempts,
    agentAttempts: result.agentAttempts,
  })
}

// Authorize the caller: must hold a valid Supabase session AND be an active
// agent. The `agents` read still runs with the caller's own token, so RLS is the
// authority. Return a reason code instead of collapsing all failures to false.
async function authorizeActiveAgent(event, configuredSupabaseUrl, anonKey) {
  const token = bearerToken(event)
  if (!token) return { ok: false, reason: 'missing_authorization' }

  const supabaseUrl = supabaseUrlForToken(token, configuredSupabaseUrl)
  const apiKeys = authApiKeys(token, anonKey, supabaseUrl)
  if (apiKeys.length === 0) return { ok: false, reason: 'missing_api_key' }

  const userUrl = `${supabaseUrl}/auth/v1/user`
  const userResult = await firstSupabaseOk(userUrl, token, apiKeys)
  if (!userResult.ok) {
    return {
      ok: false,
      reason: 'session_rejected',
      supabaseUrl,
      userAttempts: userResult.attempts,
    }
  }

  const user = userResult.body
  if (!user?.id) {
    return { ok: false, reason: 'user_missing_id', supabaseUrl }
  }

  const agentUrl =
    `${supabaseUrl}/rest/v1/agents?user_id=eq.${encodeURIComponent(user.id)}&is_active=eq.true&select=id`
  const agentResult = await firstSupabaseOk(agentUrl, token, apiKeys)
  if (!agentResult.ok) {
    return {
      ok: false,
      reason: 'agent_lookup_failed',
      supabaseUrl,
      agentAttempts: agentResult.attempts,
    }
  }

  const rows = agentResult.body
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, reason: 'agent_not_active', supabaseUrl }
  }

  return { ok: true, supabaseUrl }
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
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const auth = await authorizeActiveAgent(event, supabaseUrl, anonKey)
  if (!auth.ok) {
    if (auth.reason !== 'missing_authorization') {
      logAuthDenied(auth, auth.supabaseUrl || supabaseUrl)
    }
    const status = auth.reason === 'missing_api_key' ? 500 : 401
    return json(status, {
      error: status === 500 ? 'Auth is not configured on the server' : 'Active agent session required',
      reason: auth.reason,
    })
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
