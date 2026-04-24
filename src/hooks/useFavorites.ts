import { useState, useEffect, useCallback } from 'react'

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }, [])

  const isFavorite = useCallback(
    (slug: string): boolean => favorites.includes(slug),
    [favorites]
  )

  return { favorites, toggleFavorite, isFavorite }
}
