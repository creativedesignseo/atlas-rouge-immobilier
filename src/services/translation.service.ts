const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-v4-flash'

// API key stored in env var — never hardcode in source
const getApiKey = () => import.meta.env.VITE_DEEPSEEK_API_KEY

export interface TranslatableContent {
  title: string
  description: string
  highlights: string[]
}

export interface TranslationResult {
  en: TranslatableContent
  fr: TranslatableContent
  es: TranslatableContent
}

type Lang = 'en' | 'fr' | 'es'

const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
}

export async function autoTranslateProperty(
  content: TranslatableContent,
  sourceLang: Lang
): Promise<Omit<TranslationResult, typeof sourceLang>> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('DeepSeek API key not configured')

  const targetLangs = (['en', 'fr', 'es'] as Lang[]).filter((l) => l !== sourceLang)

  const prompt = `You are a professional real estate translator specializing in luxury properties in Morocco.
Translate the following property listing from ${LANG_NAMES[sourceLang]} to ${targetLangs.map((l) => LANG_NAMES[l]).join(' and ')}.

Use natural, professional real estate language appropriate for luxury properties. Preserve proper nouns (neighborhood names, city names like Marrakech, Palmeraie, Médina, etc.).

Source content (${LANG_NAMES[sourceLang]}):
Title: ${content.title}
Description: ${content.description}
Key features: ${content.highlights.join(' | ')}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  ${targetLangs.map((l) => `"${l}": { "title": "...", "description": "...", "highlights": ["...", "..."] }`).join(',\n  ')}
}`

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content

  if (!text) throw new Error('Empty response from translation API')

  // Strip markdown code blocks if present
  const clean = text.replace(/```(?:json)?\n?/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('Invalid JSON response from translation API')
  }
}
