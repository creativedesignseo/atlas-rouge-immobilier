const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

const LANG_NAMES = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

function cleanModelResponse(text) {
  return text
    .replace(/```(?:json)?/g, '')
    .replace(/```/g, '')
    .trim()
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY
  if (!apiKey) {
    return json(500, { error: 'DeepSeek API key is not configured on the server' })
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
