import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { supabase, isSupabaseConfigured, getAnonymousId } from '@/lib/supabase'

const STORAGE_KEY = 'atlas-rouge-favorites'

interface FavoritesContextValue {
  favorites: string[]
  toggleFavorite: (slug: string) => Promise<void>
  isFavorite: (slug: string) => boolean
  loading: boolean
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

/**
 * Provider que se monta UNA VEZ en App.tsx.
 * Antes: cada PropertyCard montaba su propio useFavorites() y disparaba
 * una query a Supabase → 12 propiedades = 12 fetches duplicados.
 * Ahora: 1 fetch al montar la app, estado compartido.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)

  // Load from Supabase on mount (UNA VEZ por toda la app)
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
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
      )

      if (!isSupabaseConfigured) return

      const anonId = getAnonymousId()
      if (isAdding) {
        const { error } = await supabase.from('favorites').insert({
          user_id: null,
          anonymous_id: anonId,
          property_slug: slug,
        })
        if (error) {
          console.error('Failed to add favorite:', error)
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
          setFavorites((prev) => (prev.includes(slug) ? prev : [...prev, slug]))
        }
      }
    },
    [favorites],
  )

  const isFavorite = useCallback(
    (slug: string): boolean => favorites.includes(slug),
    [favorites],
  )

  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite, loading }),
    [favorites, toggleFavorite, isFavorite, loading],
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

/**
 * Hook público — sigue la misma firma que antes para no romper consumidores.
 * Si se llama fuera del Provider (caso degenerado), cae a un estado vacío
 * en vez de tirar — evita pantallazo blanco en componentes mal anidados.
 */
export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.warn(
        '[useFavorites] called outside FavoritesProvider — devolviendo stub',
      )
    }
    return {
      favorites: [],
      toggleFavorite: async () => {},
      isFavorite: () => false,
      loading: false,
    }
  }
  return ctx
}
