import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Home as HomeIcon, MapPin, Search, X } from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { getNeighborhoods } from '@/services/neighborhood.service'
import { cn } from '@/lib/utils'

const TYPE_KEYS = ['villa', 'apartment', 'riad', 'prestige', 'land', 'rooftop'] as const
type TypeKey = typeof TYPE_KEYS[number]

const PANEL_ANIM = 'animate-in fade-in slide-in-from-top-2 duration-150'

/**
 * Hero search bar shown on the home page.
 *
 * - Free-text input with live autocomplete (neighborhoods + property types).
 * - Property-type dropdown that doubles as a quick filter.
 * - Submit button — and Enter on the input — navigate to /comprar with the
 *   selected filters serialized as URL params (q, type, neighborhood).
 *
 * Both panels close on outside click and on Esc.
 */
export default function HeroSearch() {
  const navigate = useNavigate()
  const { path } = useLang()
  const { t } = useTranslation(['home', 'search', 'common'])

  const [query, setQuery] = useState('')
  const [type, setType] = useState<TypeKey | null>(null)
  const [neighborhoodList, setNeighborhoodList] = useState<string[]>([])

  const [searchOpen, setSearchOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const typeRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load neighborhoods once for autocomplete; failure is silent (suggestions
  // simply won't include neighborhoods, the rest of the bar still works).
  useEffect(() => {
    getNeighborhoods()
      .then((rows) => setNeighborhoodList(rows.map((n) => n.name)))
      .catch(() => {})
  }, [])

  // Outside click + Esc close both panels.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false)
      if (typeRef.current && !typeRef.current.contains(target)) setTypeOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setTypeOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Filter suggestions against the current query. When the input is empty
  // we still show a few popular options so the panel feels useful from the
  // first focus.
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return {
        neighborhoods: neighborhoodList.slice(0, 6),
        types: TYPE_KEYS.slice(0, 4) as readonly TypeKey[],
      }
    }
    return {
      neighborhoods: neighborhoodList
        .filter((n) => n.toLowerCase().includes(q))
        .slice(0, 6),
      types: TYPE_KEYS.filter((k) => t(`search:types.${k}`).toLowerCase().includes(q)),
    }
  }, [query, neighborhoodList, t])

  const buildUrl = (overrides?: { q?: string; type?: TypeKey | null; neighborhood?: string }) => {
    const params = new URLSearchParams()
    const finalQ = overrides?.q !== undefined ? overrides.q : query.trim()
    const finalType = overrides && 'type' in overrides ? overrides.type : type
    const finalNbhd = overrides?.neighborhood
    if (finalQ) params.set('q', finalQ)
    if (finalType) params.set('type', finalType)
    if (finalNbhd) params.set('neighborhood', finalNbhd)
    const qs = params.toString()
    return path('/buy') + (qs ? `?${qs}` : '')
  }

  const submit = () => navigate(buildUrl())

  const pickNeighborhood = (name: string) => {
    setSearchOpen(false)
    navigate(buildUrl({ neighborhood: name }))
  }

  const pickTypeFromSuggestion = (k: TypeKey) => {
    setType(k)
    setSearchOpen(false)
    inputRef.current?.focus()
  }

  const hasSuggestions =
    suggestions.neighborhoods.length > 0 || suggestions.types.length > 0

  return (
    <div className="bg-white rounded-card shadow-search p-2 max-w-[720px] mx-auto relative">
      <div className="flex flex-col md:flex-row items-stretch gap-2">
        {/* ─── Search input + autocomplete ─── */}
        <div ref={searchRef} className="flex-1 relative">
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 bg-cream rounded-lg min-h-[48px] transition-shadow',
              searchOpen && 'ring-2 ring-terracotta/30',
            )}
          >
            <MapPin size={18} className="text-text-secondary shrink-0" />
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
                <X size={14} />
              </button>
            )}
          </div>

          {searchOpen && hasSuggestions && (
            <div
              className={cn(
                'absolute top-full left-0 right-0 mt-2 bg-white rounded-card shadow-xl border border-border-warm z-30 overflow-hidden text-left',
                PANEL_ANIM,
              )}
            >
              {suggestions.neighborhoods.length > 0 && (
                <div className="p-2">
                  <p className="text-text-secondary text-[10px] font-inter font-semibold uppercase tracking-wider px-3 py-1.5">
                    {t('search:filters.location')}
                  </p>
                  {suggestions.neighborhoods.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickNeighborhood(n)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-cream rounded-lg text-left text-[14px] font-inter text-text-primary transition-colors"
                    >
                      <MapPin size={14} className="text-text-secondary shrink-0" />
                      <span className="truncate">{n}</span>
                    </button>
                  ))}
                </div>
              )}

              {suggestions.types.length > 0 && (
                <div
                  className={cn(
                    'p-2',
                    suggestions.neighborhoods.length > 0 && 'border-t border-border-warm',
                  )}
                >
                  <p className="text-text-secondary text-[10px] font-inter font-semibold uppercase tracking-wider px-3 py-1.5">
                    {t('search:filters.type')}
                  </p>
                  {suggestions.types.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickTypeFromSuggestion(k)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-cream rounded-lg text-left text-[14px] font-inter text-text-primary transition-colors"
                    >
                      <HomeIcon size={14} className="text-text-secondary shrink-0" />
                      <span className="truncate">{t(`search:types.${k}`)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Type dropdown ─── */}
        <div ref={typeRef} className="relative md:min-w-[180px]">
          <button
            type="button"
            onClick={() => setTypeOpen((o) => !o)}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-2 bg-cream rounded-lg min-h-[48px] transition-colors hover:bg-[#ebe5d9]',
              typeOpen && 'bg-[#ebe5d9] ring-2 ring-terracotta/30',
            )}
          >
            <HomeIcon size={18} className="text-text-secondary shrink-0" />
            <span
              className={cn(
                'text-[14px] font-inter flex-1 text-left truncate',
                type ? 'text-text-primary font-medium' : 'text-text-secondary',
              )}
            >
              {type ? t(`search:types.${type}`) : t('common:filter')}
            </span>
            <ChevronDown
              size={16}
              className={cn('text-text-secondary transition-transform shrink-0', typeOpen && 'rotate-180')}
            />
          </button>

          {typeOpen && (
            <div
              className={cn(
                'absolute top-full left-0 right-0 md:left-auto md:right-0 md:min-w-[220px] mt-2 bg-white rounded-card shadow-xl border border-border-warm z-30 overflow-hidden p-1.5 text-left',
                PANEL_ANIM,
              )}
            >
              {type && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setType(null)
                      setTypeOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cream rounded-lg text-left text-[13px] font-inter text-text-secondary transition-colors"
                  >
                    <X size={14} />
                    {t('search:filters.resetAll')}
                  </button>
                  <div className="my-1 border-t border-border-warm" />
                </>
              )}
              {TYPE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setType(k)
                    setTypeOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-cream rounded-lg text-left text-[14px] font-inter transition-colors',
                    type === k ? 'text-terracotta font-semibold' : 'text-text-primary',
                  )}
                >
                  <span>{t(`search:types.${k}`)}</span>
                  {type === k && <Check size={14} className="text-terracotta" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Submit ─── */}
        <button
          type="button"
          onClick={submit}
          className="bg-terracotta text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform min-h-[48px]"
        >
          <Search size={16} />
          {t('common:search')}
        </button>
      </div>
    </div>
  )
}
