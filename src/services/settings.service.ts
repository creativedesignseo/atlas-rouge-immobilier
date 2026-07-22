import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { INSTAGRAM_URL, PHONE_NUMBER_DISPLAY, TIKTOK_URL, WHATSAPP_NUMBER } from '@/lib/contact'

export type SiteSettings = Record<string, string>

const defaultSettings: SiteSettings = {
  company_name: 'Atlas Rouge Immobilier',
  agent_name: 'Sophie Martin',
  agent_title: 'Conseillère immobilière',
  phone: PHONE_NUMBER_DISPLAY,
  whatsapp: `+${WHATSAPP_NUMBER}`,
  email: 'contact@atlasrouge.immo',
  address: '123 Boulevard Mohamed VI, Guéliz',
  city_postal: '40000 Marrakech, Maroc',
  hours_weekday: 'Lun – Ven : 9h – 18h',
  hours_saturday: 'Sam : 10h – 14h',
  instagram_url: INSTAGRAM_URL,
  tiktok_url: TIKTOK_URL,
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return defaultSettings

  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')

  if (error || !data) {
    console.warn('Failed to load site settings from Supabase, using defaults:', error?.message)
    return defaultSettings
  }

  const settings: SiteSettings = { ...defaultSettings }
  for (const row of data) {
    settings[row.key] = row.value
  }
  return settings
}
