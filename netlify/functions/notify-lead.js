// netlify/functions/notify-lead.js
// ----------------------------------------------------------------------------
// Recibe un payload de lead (contact / estimation / property_inquiry) y dispara
// notificaciones:
//   1) Email al agente vía Resend (si RESEND_API_KEY está en env)
//   2) Telegram (si TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID están en env)
//   3) Fallback: log a stdout (Netlify lo captura en function logs)
//
// El frontend la llama DESPUÉS de insertar en Supabase. Si esta función falla,
// el lead ya está guardado en BD — Sofia lo verá en /admin/contacts.
//
// Endpoint: POST /.netlify/functions/notify-lead
// Body JSON:
// {
//   "type": "contact" | "estimation" | "property_inquiry",
//   "name": "...",
//   "email": "...",
//   "phone": "...",
//   "subject": "...",     // opcional
//   "message": "...",     // opcional
//   "propertySlug": "...",// opcional
//   "lang": "fr"|"es"|"en"
// }
// ----------------------------------------------------------------------------

const TO_EMAIL = process.env.AGENT_NOTIFY_EMAIL || 'info@atlasrouge.ma'
const FROM_EMAIL =
  process.env.AGENT_NOTIFY_FROM || 'Atlas Rouge <noreply@atlasrouge.ma>'

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildEmail(lead) {
  const rows = [
    ['Tipo', lead.type],
    ['Nombre', lead.name],
    ['Email', lead.email],
    ['Teléfono', lead.phone],
    ['Asunto', lead.subject],
    ['Mensaje', lead.message],
    ['Propiedad', lead.propertySlug],
    ['Idioma', lead.lang],
  ].filter(([, v]) => v != null && v !== '')

  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1A1A1A;max-width:560px">
      <h2 style="color:#B5533A;border-bottom:1px solid #eee;padding-bottom:8px">
        Nuevo lead — Atlas Rouge
      </h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([k, v]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f3f3;font-weight:600;width:120px">${escapeHtml(k)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f3f3">${escapeHtml(v)}</td>
          </tr>`,
          )
          .join('')}
      </table>
      <p style="margin-top:24px;color:#666;font-size:12px">
        Recibido por la web. Puedes responder al cliente directamente
        contestando este email (configura reply-to si quieres).
      </p>
    </div>`
  return html
}

async function sendEmailViaResend(lead) {
  if (!process.env.RESEND_API_KEY) return { skipped: 'no RESEND_API_KEY' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      reply_to: lead.email || undefined,
      subject: `🏠 Atlas Rouge — nuevo lead (${lead.type}) de ${lead.name || 'anónimo'}`,
      html: buildEmail(lead),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend ${res.status}: ${text}`)
  }
  return res.json()
}

async function sendTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return { skipped: 'no TELEGRAM env' }

  const text = [
    `🏠 *Nuevo lead Atlas Rouge*`,
    `*Tipo:* ${lead.type}`,
    lead.name && `*Nombre:* ${lead.name}`,
    lead.email && `*Email:* ${lead.email}`,
    lead.phone && `*Teléfono:* ${lead.phone}`,
    lead.subject && `*Asunto:* ${lead.subject}`,
    lead.message && `\n${lead.message.slice(0, 300)}`,
    lead.propertySlug && `*Propiedad:* ${lead.propertySlug}`,
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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }
  let lead
  try {
    lead = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  // Validación mínima — al menos un canal de contacto y un tipo
  if (!lead.type || (!lead.email && !lead.phone)) {
    return { statusCode: 400, body: 'Missing type or contact (email/phone)' }
  }

  console.log('[notify-lead]', { type: lead.type, name: lead.name, email: lead.email })

  const results = await Promise.allSettled([
    sendEmailViaResend(lead),
    sendTelegram(lead),
  ])

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      channels: results.map((r) =>
        r.status === 'fulfilled' ? { ok: true, info: r.value } : { ok: false, error: String(r.reason) },
      ),
    }),
  }
}
