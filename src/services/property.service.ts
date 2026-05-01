import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getCached, refetch } from '@/lib/queryCache'
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'
import { properties as mockProperties } from '@/data/properties'
import type { Property } from '@/data/properties'

export interface PropertyFilters {
  transaction?: 'sale' | 'rent'
  types?: string[]
  neighborhoods?: string[]
  priceMin?: number
  priceMax?: number
  surfaceMin?: number
  surfaceMax?: number
  bedroomsMin?: number
  bedroomsMax?: number
  searchQuery?: string
  sort?: string
}

function getCurrentLanguage(): SupportedLanguage {
  const lang = i18n.language?.slice(0, 2) as SupportedLanguage
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en'
}

function localizedString(row: Record<string, unknown>, field: 'title' | 'description', lang: SupportedLanguage): string {
  const localized = row[`${field}_${lang}`]
  const french = row[`${field}_fr`]
  if (typeof localized === 'string' && localized.trim()) return localized
  if (typeof french === 'string' && french.trim()) return french
  return (row[field] as string) || ''
}

function localizedArray(row: Record<string, unknown>, field: 'highlights', lang: SupportedLanguage): string[] {
  const localized = row[`${field}_${lang}`]
  const french = row[`${field}_fr`]
  if (Array.isArray(localized) && localized.length > 0) return localized as string[]
  if (Array.isArray(french) && french.length > 0) return french as string[]
  return (row[field] as string[]) || []
}

function mapDbToProperty(row: Record<string, unknown>, lang = getCurrentLanguage()): Property {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: localizedString(row, 'title', lang),
    transaction: row.transaction as 'sale' | 'rent',
    type: row.type as Property['type'],
    neighborhood: (row.neighborhood_name as string) || '',
    city: (row.city as string) || 'Marrakech',
    priceEUR: row.price_eur as number,
    priceMAD: row.price_mad as number,
    surface: row.surface as number,
    landSurface: row.land_surface as number | undefined,
    rooms: row.rooms as number,
    bedrooms: row.bedrooms as number,
    bathrooms: row.bathrooms as number,
    pricePerSqm: row.price_per_sqm as number,
    description: localizedString(row, 'description', lang),
    highlights: localizedArray(row, 'highlights', lang),
    amenities: (row.amenities as string[]) || [],
    images: (row.images as string[]) || [],
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    isFeatured: row.is_featured as boolean,
    isExclusive: row.is_exclusive as boolean,
    hasVideo: row.has_video as boolean,
    has3DTour: row.has_3d_tour as boolean,
    createdAt: row.created_at as string,
  }
}

async function fetchProperties(filters: PropertyFilters): Promise<Property[]> {
  if (!isSupabaseConfigured) return applyMockFilters(mockProperties, filters)

  let query = supabase.from('properties').select(`*, neighborhoods(name)`)
  if (filters.transaction) query = query.eq('transaction', filters.transaction)
  if (filters.types && filters.types.length > 0) query = query.in('type', filters.types as Property['type'][])
  if (filters.priceMin !== undefined) query = query.gte('price_eur', filters.priceMin)
  if (filters.priceMax !== undefined) query = query.lte('price_eur', filters.priceMax)
  if (filters.surfaceMin !== undefined) query = query.gte('surface', filters.surfaceMin)
  if (filters.surfaceMax !== undefined) query = query.lte('surface', filters.surfaceMax)
  if (filters.bedroomsMin !== undefined) query = query.gte('bedrooms', filters.bedroomsMin)
  if (filters.bedroomsMax !== undefined) query = query.lte('bedrooms', filters.bedroomsMax)
  if (filters.searchQuery) {
    const q = filters.searchQuery
    query = query.or([
      `title.ilike.%${q}%`,
      `description.ilike.%${q}%`,
      `title_en.ilike.%${q}%`,
      `title_fr.ilike.%${q}%`,
      `title_es.ilike.%${q}%`,
      `description_en.ilike.%${q}%`,
      `description_fr.ilike.%${q}%`,
      `description_es.ilike.%${q}%`,
    ].join(','))
  }
  switch (filters.sort) {
    case 'price-asc': query = query.order('price_eur', { ascending: true }); break
    case 'price-desc': query = query.order('price_eur', { ascending: false }); break
    case 'surface-asc': query = query.order('surface', { ascending: true }); break
    case 'surface-desc': query = query.order('surface', { ascending: false }); break
    case 'recent': query = query.order('created_at', { ascending: false }); break
    default: query = query.order('is_featured', { ascending: false })
  }

  const { data, error } = await query
  if (error) {
    console.error('Supabase error:', error)
    return applyMockFilters(mockProperties, filters)
  }
  return (data || []).map((row: Record<string, unknown>) => {
    const neighborhoodName = row.neighborhoods && typeof row.neighborhoods === 'object'
      ? (row.neighborhoods as Record<string, unknown>).name as string
      : ''
    return mapDbToProperty({ ...row, neighborhood_name: neighborhoodName })
  })
}

export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  // Cache key includes the active language so a /en visitor and a /fr visitor
  // each get their own localized snapshot. Filter object is serialized so
  // identical filter combos hit the cache.
  const key = `publicProperties:${getCurrentLanguage()}:${JSON.stringify(filters)}`
  const cached = getCached<Property[]>(key)
  const fresh = refetch(key, () => fetchProperties(filters))
  if (cached !== undefined) {
    fresh.catch(() => {})
    return cached
  }
  return fresh
}

async function fetchPropertyBySlug(slug: string): Promise<Property | null> {
  if (!isSupabaseConfigured) {
    return mockProperties.find((p) => p.slug === slug) || null
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`*, neighborhoods(name)`)
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Supabase error:', error)
    return mockProperties.find((p) => p.slug === slug) || null
  }

  const row = data as Record<string, unknown>
  const neighborhoodName = row.neighborhoods && typeof row.neighborhoods === 'object'
    ? (row.neighborhoods as Record<string, unknown>).name as string
    : ''
  return mapDbToProperty({ ...row, neighborhood_name: neighborhoodName })
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const key = `property:${slug}:${getCurrentLanguage()}`
  const cached = getCached<Property | null>(key)
  const fresh = refetch(key, () => fetchPropertyBySlug(slug))
  if (cached !== undefined) {
    fresh.catch(() => {})
    return cached
  }
  return fresh
}

async function fetchFeaturedProperties(limit: number): Promise<Property[]> {
  if (!isSupabaseConfigured) {
    return mockProperties.filter((p) => p.isFeatured).slice(0, limit)
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`*, neighborhoods(name)`)
    .eq('is_featured', true)
    .limit(limit)

  if (error || !data) {
    console.error('Supabase error:', error)
    return mockProperties.filter((p) => p.isFeatured).slice(0, limit)
  }

  return data.map((row: Record<string, unknown>) => {
    const neighborhoodName = row.neighborhoods && typeof row.neighborhoods === 'object'
      ? (row.neighborhoods as Record<string, unknown>).name as string
      : ''
    return mapDbToProperty({ ...row, neighborhood_name: neighborhoodName })
  })
}

export async function getFeaturedProperties(limit = 3): Promise<Property[]> {
  const key = `featuredProperties:${getCurrentLanguage()}:${limit}`
  const cached = getCached<Property[]>(key)
  const fresh = refetch(key, () => fetchFeaturedProperties(limit))
  if (cached !== undefined) {
    fresh.catch(() => {})
    return cached
  }
  return fresh
}

export async function getSimilarProperties(property: Property, limit = 3): Promise<Property[]> {
  if (!isSupabaseConfigured) {
    return mockProperties
      .filter((p) => p.slug !== property.slug && (p.type === property.type || p.neighborhood === property.neighborhood))
      .slice(0, limit)
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`*, neighborhoods(name)`)
    .neq('slug', property.slug)
    .or(`type.eq.${property.type},neighborhoods.name.eq.${property.neighborhood}`)
    .limit(limit)

  if (error || !data) {
    return mockProperties
      .filter((p) => p.slug !== property.slug && (p.type === property.type || p.neighborhood === property.neighborhood))
      .slice(0, limit)
  }

  return data.map((row: Record<string, unknown>) => {
    const neighborhoodName = row.neighborhoods && typeof row.neighborhoods === 'object'
      ? (row.neighborhoods as Record<string, unknown>).name as string
      : ''
    return mapDbToProperty({ ...row, neighborhood_name: neighborhoodName })
  })
}

function applyMockFilters(properties: Property[], filters: PropertyFilters): Property[] {
  let result = [...properties]

  if (filters.transaction) {
    result = result.filter((p) => p.transaction === filters.transaction)
  }
  if (filters.types && filters.types.length > 0) {
    result = result.filter((p) => filters.types!.includes(p.type))
  }
  if (filters.priceMin !== undefined) {
    result = result.filter((p) => p.priceEUR >= filters.priceMin!)
  }
  if (filters.priceMax !== undefined) {
    result = result.filter((p) => p.priceEUR <= filters.priceMax!)
  }
  if (filters.surfaceMin !== undefined) {
    result = result.filter((p) => p.surface >= filters.surfaceMin!)
  }
  if (filters.surfaceMax !== undefined) {
    result = result.filter((p) => p.surface <= filters.surfaceMax!)
  }
  if (filters.bedroomsMin !== undefined) {
    result = result.filter((p) => p.bedrooms >= filters.bedroomsMin!)
  }
  if (filters.bedroomsMax !== undefined) {
    result = result.filter((p) => p.bedrooms <= filters.bedroomsMax!)
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase()
    result = result.filter((p) =>
      p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    )
  }

  // Sort
  switch (filters.sort) {
    case 'price-asc':
      result.sort((a, b) => a.priceEUR - b.priceEUR)
      break
    case 'price-desc':
      result.sort((a, b) => b.priceEUR - a.priceEUR)
      break
    case 'surface-asc':
      result.sort((a, b) => a.surface - b.surface)
      break
    case 'surface-desc':
      result.sort((a, b) => b.surface - a.surface)
      break
    case 'recent':
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
  }

  return result
}
