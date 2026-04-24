import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { neighborhoods as mockNeighborhoods } from '@/data/neighborhoods'
import type { Neighborhood } from '@/data/neighborhoods'

function mapDbToNeighborhood(row: Record<string, unknown>): Neighborhood {
  return {
    name: row.name as string,
    slug: row.slug as string,
    image: row.image as string,
    description: row.description as string,
    subtitle: row.subtitle as string,
    propertyCount: row.property_count as number,
  }
}

export async function getNeighborhoods(): Promise<Neighborhood[]> {
  if (!isSupabaseConfigured) {
    return mockNeighborhoods
  }

  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .order('property_count', { ascending: false })

  if (error || !data) {
    console.error('Supabase error:', error)
    return mockNeighborhoods
  }

  return data.map(mapDbToNeighborhood)
}

export async function getNeighborhoodBySlug(slug: string): Promise<Neighborhood | null> {
  if (!isSupabaseConfigured) {
    return mockNeighborhoods.find((n) => n.slug === slug) || null
  }

  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Supabase error:', error)
    return mockNeighborhoods.find((n) => n.slug === slug) || null
  }

  return mapDbToNeighborhood(data)
}
