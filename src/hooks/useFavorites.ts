import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured, getAnonymousId } from '@/lib/supabase'

const STORAGE_KEY = 'atlas-rouge-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)

  // Load from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const anonId = getAnonymousId()
    supabase
      .from('favorites')
      .select('property_slug')
      .eq('anonymous_id', anonId)
      .then(({ data, error }) => {
        if (!error && data) {
          const slugs = data.map((r) => r.property_slug)
          setFavorites(slugs)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
        }
        setLoading(false)
      })
  }, [])

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = useCallback(
    async (slug: string) => {
      const isAdding = !favorites.includes(slug)

      // Optimistic local update
      setFavorites((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      )

      // Sync with Supabase
      if (isSupabaseConfigured) {
        const anonId = getAnonymousId()
        if (isAdding) {
          const { error } = await supabase.from('favorites').insert({
            anonymous_id: anonId,
            property_slug: slug,
          } as never)
          if (error) {
            console.error('Failed to add favorite:', error)
            // Revert on error
            setFavorites((prev) => prev.filter((s) => s !== slug))
          }
        } else {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('anonymous_id', anonId)
            .eq('property_slug', slug)
          if (error) {
            console.error('Failed to remove favorite:', error)
            // Revert on error
            setFavorites((prev) =>
              prev.includes(slug) ? prev : [...prev, slug]
            )
          }
        }
      }
    },
    [favorites]
  )

  const isFavorite = useCallback(
    (slug: string): boolean => favorites.includes(slug),
    [favorites]
  )

  return { favorites, toggleFavorite, isFavorite, loading }
}
