import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { PropertyRow, PropertyInsert } from '@/types/supabase'

export interface PropertyFormData {
  slug: string
  title: string
  transaction: 'sale' | 'rent'
  type: 'villa' | 'apartment' | 'riad' | 'prestige' | 'land' | 'rooftop'
  neighborhood_id: string | null
  city: string
  price_eur: number
  price_mad: number
  surface: number
  land_surface: number | null
  rooms: number
  bedrooms: number
  bathrooms: number
  price_per_sqm: number
  description: string
  highlights: string[]
  amenities: string[]
  images: string[]
  latitude: number
  longitude: number
  is_featured: boolean
  is_exclusive: boolean
  has_video: boolean
  has_3d_tour: boolean
}

function toDbInsert(data: PropertyFormData, agentId?: string): PropertyInsert {
  return {
    slug: data.slug,
    title: data.title,
    transaction: data.transaction,
    type: data.type,
    neighborhood_id: data.neighborhood_id,
    city: data.city,
    price_eur: data.price_eur,
    price_mad: data.price_mad,
    surface: data.surface,
    land_surface: data.land_surface,
    rooms: data.rooms,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    price_per_sqm: data.price_per_sqm,
    description: data.description,
    highlights: data.highlights,
    amenities: data.amenities,
    images: data.images,
    latitude: data.latitude,
    longitude: data.longitude,
    is_featured: data.is_featured,
    is_exclusive: data.is_exclusive,
    has_video: data.has_video,
    has_3d_tour: data.has_3d_tour,
    agent_id: agentId || null,
  }
}

export async function getAdminProperties(
  agentId: string,
  isAdmin: boolean
): Promise<PropertyRow[]> {
  if (!isSupabaseConfigured) return []

  let query = supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.eq('agent_id', agentId)
  }

  const { data, error } = await query

  if (error) {
    console.error('getAdminProperties error:', error)
    throw error
  }

  return (data || []) as PropertyRow[]
}

export async function createProperty(data: PropertyFormData, agentId?: string): Promise<PropertyRow> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  
  const { data: result, error } = await supabase
    .from('properties')
    .insert(toDbInsert(data, agentId))
    .select()
    .single()

  if (error) throw error
  return result as PropertyRow
}

export async function updateProperty(slug: string, data: PropertyFormData, agentId?: string): Promise<PropertyRow> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  
  const { data: result, error } = await supabase
    .from('properties')
    .update(toDbInsert(data, agentId))
    .eq('slug', slug)
    .select()
    .single()

  if (error) throw error
  return result as PropertyRow
}

export async function deleteProperty(slug: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('slug', slug)

  if (error) throw error
}

export async function uploadImage(file: File): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  
  const { error } = await supabase.storage
    .from('property-images')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error
  return filename
}

export async function deleteImage(filename: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  
  const { error } = await supabase.storage
    .from('property-images')
    .remove([filename])

  if (error) throw error
}

export async function getPropertyForEdit(slug: string): Promise<PropertyFormData | null> {
  if (!isSupabaseConfigured) return null
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  
  const row = data as PropertyRow
  return {
    slug: row.slug,
    title: row.title,
    transaction: row.transaction,
    type: row.type,
    neighborhood_id: row.neighborhood_id,
    city: row.city,
    price_eur: row.price_eur,
    price_mad: row.price_mad,
    surface: row.surface,
    land_surface: row.land_surface,
    rooms: row.rooms,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    price_per_sqm: row.price_per_sqm,
    description: row.description,
    highlights: row.highlights || [],
    amenities: row.amenities || [],
    images: row.images || [],
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    is_featured: row.is_featured,
    is_exclusive: row.is_exclusive,
    has_video: row.has_video,
    has_3d_tour: row.has_3d_tour,
  }
}
