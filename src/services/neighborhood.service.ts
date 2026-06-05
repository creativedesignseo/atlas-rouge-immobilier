// Public reads use the anonymous client so they never wait on the logged-in
// agent's token refresh (that stall is what made the first load hang).
import { supabasePublic as supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getCached, refetch } from '@/lib/queryCache'
import { withRetry } from '@/lib/retry'
import { neighborhoods as mockNeighborhoods } from '@/data/neighborhoods'
import type { Neighborhood } from '@/data/neighborhoods'

function mapDbToNeighborhood(row: Record<string, unknown>): Neighborhood {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    image: row.image as string,
    description: row.description as string,
    subtitle: row.subtitle as string,
    propertyCount: row.property_count as number,
    isActive: (row.is_active as boolean) ?? true,
  }
}

async function fetchNeighborhoods(): Promise<Neighborhood[]> {
  // No env vars (local dev) → mock is the expected dataset, not a failure.
  if (!isSupabaseConfigured) return mockNeighborhoods
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('is_active', true)
    .order('property_count', { ascending: false })
  // Throw on a real error so withRetry can retry a transient blip. Returning
  // mock here would mask production failures AND defeat the retry.
  if (error) throw error
  return (data || []).map(mapDbToNeighborhood)
}

export async function getNeighborhoods(): Promise<Neighborhood[]> {
  const cached = getCached<Neighborhood[]>('neighborhoods')
  // withRetry wraps the fetcher INSIDE refetch, so queryCache's in-flight
  // dedupe still holds (one shared "fetch-with-retries" promise per key).
  const fresh = refetch('neighborhoods', () => withRetry(fetchNeighborhoods))
  if (cached !== undefined) {
    fresh.catch(() => {})
    return cached
  }
  return fresh
}

export async function getNeighborhoodBySlug(slug: string): Promise<Neighborhood | null> {
  if (!isSupabaseConfigured) {
    return mockNeighborhoods.find((n) => n.slug === slug) || null
  }

  try {
    // withRetry applies a per-attempt timeout internally — no extra withTimeout.
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .eq('slug', slug)
        .single()
      // `.single()` with 0 rows is a legitimate "not found", not a transient
      // failure: resolve null (isTransientError won't retry it anyway).
      if (error) {
        if ((error as { code?: string }).code === 'PGRST116') return null
        throw error
      }
      return data ? mapDbToNeighborhood(data) : null
    })
  } catch (err) {
    console.error('[neighborhood.service] getNeighborhoodBySlug failed:', err)
    return null
  }
}
