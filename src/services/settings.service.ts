import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type SiteSettings = Record<string, string>

const defaultSettings: SiteSettings = {
  company_name: 'Atlas Rouge Immobilier',
  agent_name: 'Sophie Martin',
  agent_title: 'Conseillère immobilière',
  phone: '+212 524 00 00 00',
  whatsapp: '+212 600 00 00 00',
  email: 'contact@atlasrouge.immo',
  address: '123 Boulevard Mohamed VI, Guéliz',
  city_postal: '40000 Marrakech, Maroc',
  hours_weekday: 'Lun – Ven : 9h – 18h',
  hours_saturday: 'Sam : 10h – 14h',
  instagram_url: '#',
  facebook_url: '#',
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
