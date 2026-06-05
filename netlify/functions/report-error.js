// netlify/functions/report-error.js
// ----------------------------------------------------------------------------
// Recibe un reporte de error del cliente (vía navigator.sendBeacon) y lo
// registra en los function logs de Netlify, para que el owner pueda ver qué
// falló en producción SIN depender de que un usuario abra DevTools.
//
//   - source 'chunk'    → import dinámico stale tras un deploy
//   - source 'data'     → una carga de datos agotó los reintentos
//   - source 'render'   → error global no controlado
//   - source 'boundary' → React error boundary atrapó un render
//
// SIN base de datos, SIN datos personales: el cliente envía solo pathname+hash
// (sin query string), nunca el cuerpo de un formulario.
//
// Endpoint: POST /.netlify/functions/report-error  (mismo origen → sin CORS real)
// ----------------------------------------------------------------------------

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || 'https://atlasrouge.com,https://www.atlasrouge.com'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function resolveCors(event) {
  const origin = event.headers.origin || event.headers.Origin || ''
  const allowAll = process.env.CONTEXT && process.env.CONTEXT !== 'production'
  // sendBeacon is same-origin here and may omit Origin → treat empty as allowed.
  const allowed = !origin || allowAll || ALLOWED_ORIGINS.includes(origin)
  return {
    allowed,
    headers: {
      'Access-Control-Allow-Origin': allowed ? origin || ALLOWED_ORIGINS[0] : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      Vary: 'Origin',
    },
  }
}

const SOURCES = ['chunk', 'data', 'render', 'boundary']
const truncate = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '')

async function sendTelegram(report) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return { skipped: 'no TELEGRAM env' }

  const text = [
    `⚠️ *Atlas Rouge — error en cliente*`,
    `*Origen:* ${report.source}`,
    report.url && `*Ruta:* ${report.url}`,
    report.lang && `*Idioma:* ${report.lang}`,
    report.message && `\n${report.message}`,
  ]
    .filter(Boolean)
    .join('\n')

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'Markdown' }),
  })
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`)
  return res.json()
}

exports.handler = async (event) => {
  const cors = resolveCors(event)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors.headers, body: '' }
  }
  if (!cors.allowed) {
    return { statusCode: 403, headers: cors.headers, body: 'Origin not allowed' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors.headers, body: 'Method not allowed' }
  }
  // Reject oversized payloads (anti-abuse): a legit report is well under 4 KB.
  if ((event.body || '').length > 4096) {
    return { statusCode: 413, headers: cors.headers, body: 'Payload too large' }
  }

  let raw
  try {
    raw = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: cors.headers, body: 'Invalid JSON' }
  }

  const source = SOURCES.includes(raw.source) ? raw.source : 'render'
  // Re-build the object server-side from a fixed allowlist of fields, all
  // truncated. Nothing else from the payload is logged.
  const report = {
    source,
    message: truncate(raw.message, 500),
    url: truncate(raw.url, 300),
    lang: truncate(raw.lang, 8),
    userAgent: truncate(raw.userAgent, 300),
    ts: truncate(raw.ts, 40),
  }

  console.error('[client-error]', JSON.stringify(report))

  // Best-effort Telegram ping; never fail the request over it.
  try {
    await sendTelegram(report)
  } catch (err) {
    console.error('[report-error] telegram failed:', String(err))
  }

  return {
    statusCode: 204,
    headers: cors.headers,
    body: '',
  }
}
