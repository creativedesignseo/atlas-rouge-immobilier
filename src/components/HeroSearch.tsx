import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Search, X } from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { getNeighborhoods } from '@/services/neighborhood.service'
import { cn } from '@/lib/utils'

type Transaction = 'sale' | 'rent' | 'new'

const PANEL_ANIM = 'animate-in fade-in slide-in-from-top-2 duration-150'

// Strip diacritics so "atico" matches "ático", "gueliz" matches "Guéliz", etc.
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

// Transaction tab pill (Comprar / Alquilar / Obra nueva). Extracted so it
// isn't recreated on every parent render.
function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-[14px] font-inter font-medium transition-all duration-200',
        active
          ? 'bg-terracotta/15 text-terracotta font-semibold shadow-sm'
          : 'text-text-secondary hover:bg-cream-warm/60 hover:text-text-primary',
      )}
    >
      {label}
    </button>
  )
}

/**
 * Hero search bar shown on the home page. Fotocasa-inspired:
 *
 *   [Comprar][Alquilar][Obra nueva] │ [search by neighborhood] [🔍 Buscar]
 *
 * - Tabs choose the transaction (sale/rent/new) without navigating yet.
 * - Free-text input has live autocomplete with the full list of barrios
 *   from the Supabase `neighborhoods` table, accent-insensitive.
 * - Submit (button or Enter) navigates to /comprar or /alquilar in the
 *   active language with q, neighborhood, and (for "Obra nueva")
 *   status=neuf as URL params so Search.tsx picks them up.
 */
export default function HeroSearch() {
  const navigate = useNavigate()
  const { path } = useLang()
  const { t } = useTranslation(['home', 'search', 'common'])

  const [transaction, setTransaction] = useState<Transaction>('sale')
  const [query, setQuery] = useState('')
  const [neighborhoodList, setNeighborhoodList] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getNeighborhoods()
      .then((rows) => setNeighborhoodList(rows.map((n) => n.name)))
      .catch(() => {})
  }, [])

  // Outside click + Esc close the suggestions panel.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Filter neighborhoods accent-insensitively. Empty query → full list.
  const suggestions = useMemo(() => {
    const q = normalize(query)
    if (!q) return neighborhoodList
    return neighborhoodList.filter((n) => normalize(n).includes(q))
  }, [query, neighborhoodList])

  // 'rent' goes to /alquilar; 'sale' and 'new' both go to /comprar (with
  // 'new' adding a status=neuf URL param so the Search page picks it up).
  const targetRouteKey = transaction === 'rent' ? 'rent' : 'buy'

  const buildUrl = (overrides?: { q?: string; neighborhood?: string }) => {
    const params = new URLSearchParams()
    const finalQ = overrides?.q !== undefined ? overrides.q : query.trim()
    const finalNbhd = overrides?.neighborhood
    if (finalQ) params.set('q', finalQ)
    if (finalNbhd) params.set('neighborhood', finalNbhd)
    if (transaction === 'new') params.set('status', 'neuf')
    const qs = params.toString()
    return path('/' + targetRouteKey) + (qs ? `?${qs}` : '')
  }

  const submit = () => navigate(buildUrl())

  const pickNeighborhood = (name: string) => {
    setSearchOpen(false)
    navigate(buildUrl({ neighborhood: name }))
  }

  return (
    <div className="group relative max-w-[960px] mx-auto">
      {/* Soft brand-tinted glow that lights up the whole bar on interaction */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-[28px] bg-gradient-to-r from-terracotta/40 via-terracotta/25 to-terracotta/40 opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-90 group-focus-within:opacity-100"
      />

      <div
        className={cn(
          'relative bg-white/95 backdrop-blur-md rounded-[26px] p-2',
          'shadow-[0_10px_40px_-15px_rgba(23,32,51,0.25)] border-2 border-white/70',
          'transition-all duration-300',
          'group-hover:border-terracotta/40 group-hover:shadow-[0_20px_60px_-10px_rgba(204,123,80,0.45)]',
          'group-focus-within:border-terracotta/60 group-focus-within:shadow-[0_20px_60px_-10px_rgba(204,123,80,0.55)]',
        )}
      >
        {/* Single row on lg+ (Fotocasa-style), stacked on smaller screens */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          {/* ─── Filter tabs (no navigation, just transaction state) ─── */}
          <div className="flex items-center gap-1 px-1 overflow-x-auto lg:overflow-visible scrollbar-hide shrink-0">
            <TabButton
              active={transaction === 'sale'}
              onClick={() => setTransaction('sale')}
              label={t('search:filters.buy')}
            />
            <TabButton
              active={transaction === 'rent'}
              onClick={() => setTransaction('rent')}
              label={t('search:filters.rent')}
            />
            <TabButton
              active={transaction === 'new'}
              onClick={() => setTransaction('new')}
              label={t('search:filters.newBuild')}
            />
          </div>

          {/* Vertical separator on desktop only */}
          <div className="hidden lg:block self-stretch w-px bg-border-warm/40 my-1.5 mx-1 shrink-0" />

          {/* ─── Search input + Buscar (single neighborhood field) ─── */}
          <div className="flex items-stretch gap-1.5 bg-cream/70 rounded-2xl p-1.5 flex-1">
            <div ref={searchRef} className="flex-1 relative">
              <div
                className={cn(
                  'flex items-center gap-2.5 px-4 min-h-[48px] rounded-xl transition-all duration-200',
                  searchOpen
                    ? 'bg-white shadow-sm ring-2 ring-terracotta/30'
                    : 'bg-white hover:shadow-sm',
                )}
              >
                <MapPin size={18} strokeWidth={1.5} className="text-text-secondary shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t('home:hero.searchPlaceholder')}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    if (!searchOpen) setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit()
                  }}
                  className="bg-transparent text-text-primary text-[14px] font-inter w-full outline-none placeholder:text-text-secondary/60"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      inputRef.current?.focus()
                    }}
                    className="text-text-secondary hover:text-terracotta transition-colors"
                    aria-label="Clear"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {searchOpen && suggestions.length > 0 && (
                <div
                  className={cn(
                    'absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(23,32,51,0.25)] border border-border-warm/60 z-50 overflow-hidden text-left max-h-[420px] flex flex-col',
                    PANEL_ANIM,
                  )}
                >
                  <div className="overflow-y-auto overscroll-contain">
                    <div className="p-2">
                      <p className="text-text-secondary text-[10px] font-inter font-semibold uppercase tracking-wider px-3 py-1.5 sticky top-0 bg-white">
                        {t('search:filters.location')}
                      </p>
                      {suggestions.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickNeighborhood(n)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream rounded-xl text-left text-[14px] font-inter text-text-primary transition-colors"
                        >
                          <MapPin size={15} strokeWidth={1.5} className="text-text-secondary shrink-0" />
                          <span className="truncate">{n}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={submit}
              className={cn(
                'bg-terracotta text-white font-inter text-[14px] font-semibold px-7 min-h-[48px] rounded-xl',
                'flex items-center justify-center gap-2',
                'shadow-[0_4px_14px_rgba(204,123,80,0.4)]',
                'transition-all duration-200',
                'hover:shadow-[0_8px_24px_rgba(204,123,80,0.55)] hover:-translate-y-px hover:bg-[#b8694a]',
                'active:translate-y-0 active:shadow-[0_2px_8px_rgba(204,123,80,0.4)]',
              )}
            >
              <Search size={16} strokeWidth={2} />
              {t('common:search')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
