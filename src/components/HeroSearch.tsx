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

// Common search aliases per type and language. Lets users find a property
// type using the words they actually say in their region (e.g. Spanish
// users typing "piso" or "casa" instead of the canonical labels).
const TYPE_SYNONYMS: Record<TypeKey, Record<string, string[]>> = {
  villa:     { fr: ['maison'],                       es: ['casa', 'chalet'],            en: ['house'] },
  apartment: { fr: ['appart', 'appartement', 'flat'], es: ['piso', 'departamento'],      en: ['flat', 'apt'] },
  riad:      { fr: [],                                es: [],                            en: [] },
  prestige:  { fr: ['luxe', 'haut de gamme'],         es: ['lujo', 'prestigio'],         en: ['luxury'] },
  land:      { fr: ['terrain', 'parcelle'],           es: ['terreno', 'parcela', 'solar'], en: ['plot', 'lot'] },
  rooftop:   { fr: ['terrasse', 'penthouse'],         es: ['atico', 'terraza', 'penthouse'], en: ['penthouse'] },
}

// Strip diacritics so "atico" matches "ático", "gueliz" matches "Guéliz", etc.
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

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
  const { t, i18n } = useTranslation(['home', 'search', 'common'])
  const lang = (i18n.language?.slice(0, 2) || 'en') as 'fr' | 'es' | 'en'

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
  // we show ALL neighborhoods (scrollable) and all types so the user can
  // browse the full catalog at a glance.
  //
  // Matching is accent-insensitive AND uses per-language synonyms — so a
  // Spanish visitor typing "piso" matches Apartamento, "casa" matches Villa,
  // "atico" matches Ático/Rooftop, and so on.
  const suggestions = useMemo(() => {
    const q = normalize(query)
    if (!q) {
      return {
        neighborhoods: neighborhoodList,
        types: TYPE_KEYS as readonly TypeKey[],
      }
    }
    const matchesType = (k: TypeKey) => {
      const label = normalize(t(`search:types.${k}`))
      const synonyms = (TYPE_SYNONYMS[k][lang] || []).map(normalize)
      return [label, ...synonyms].some((s) => s.includes(q))
    }
    return {
      neighborhoods: neighborhoodList.filter((n) => normalize(n).includes(q)),
      types: TYPE_KEYS.filter(matchesType),
    }
  }, [query, neighborhoodList, t, lang])

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
    <div className="group relative max-w-[720px] mx-auto">
      {/* Soft glow that lights up the whole bar on hover/focus — terracotta
          tinted to match brand. The halo sits behind everything via -inset-2
          so it's clearly visible all around the pill. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-3xl md:rounded-full bg-gradient-to-r from-terracotta/40 via-terracotta/25 to-terracotta/40 opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-90 group-focus-within:opacity-100"
      />

      {/* Outer pill — rounded-full on desktop, rounded-3xl on mobile (stack).
          Border deepens to terracotta on hover so the whole bar feels active,
          not just the field you're touching. */}
      <div
        className={cn(
          'relative bg-white/95 backdrop-blur-md p-1.5 rounded-3xl md:rounded-full',
          'shadow-[0_10px_40px_-15px_rgba(23,32,51,0.25)] border-2 border-white/70',
          'transition-all duration-300',
          'group-hover:border-terracotta/40 group-hover:shadow-[0_20px_60px_-10px_rgba(204,123,80,0.45)]',
          'group-focus-within:border-terracotta/60 group-focus-within:shadow-[0_20px_60px_-10px_rgba(204,123,80,0.55)]',
        )}
      >
        <div className="flex flex-col md:flex-row items-stretch gap-1.5">
          {/* ─── Search input + autocomplete ─── */}
          <div ref={searchRef} className="flex-1 relative">
            <div
              className={cn(
                'flex items-center gap-2.5 px-5 min-h-[48px] rounded-2xl md:rounded-full transition-all duration-200',
                searchOpen
                  ? 'bg-cream-warm ring-2 ring-terracotta/40'
                  : 'bg-cream/60 hover:bg-cream',
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
                  'absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(23,32,51,0.25)] border border-border-warm/60 z-50 overflow-hidden text-left max-h-[420px] flex flex-col',
                  PANEL_ANIM,
                )}
              >
                {/* Scrollable inner area so the panel never grows past max-h */}
                <div className="overflow-y-auto overscroll-contain">
                  {suggestions.neighborhoods.length > 0 && (
                    <div className="p-2">
                      <p className="text-text-secondary text-[10px] font-inter font-semibold uppercase tracking-wider px-3 py-1.5 sticky top-0 bg-white">
                        {t('search:filters.location')}
                      </p>
                      {suggestions.neighborhoods.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickNeighborhood(n)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-cream-warm rounded-xl text-left text-[14px] font-inter text-text-primary transition-colors"
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
                        suggestions.neighborhoods.length > 0 && 'border-t border-border-warm/60',
                      )}
                    >
                      <p className="text-text-secondary text-[10px] font-inter font-semibold uppercase tracking-wider px-3 py-1.5 sticky top-0 bg-white">
                        {t('search:filters.type')}
                      </p>
                      {suggestions.types.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickTypeFromSuggestion(k)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-cream-warm rounded-xl text-left text-[14px] font-inter text-text-primary transition-colors"
                        >
                          <HomeIcon size={14} className="text-text-secondary shrink-0" />
                          <span className="truncate">{t(`search:types.${k}`)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Type dropdown ─── */}
          <div ref={typeRef} className="relative md:min-w-[180px]">
            <button
              type="button"
              onClick={() => setTypeOpen((o) => !o)}
              className={cn(
                'w-full flex items-center gap-2.5 px-5 min-h-[48px] rounded-2xl md:rounded-full transition-all duration-200',
                typeOpen
                  ? 'bg-cream-warm ring-2 ring-terracotta/40'
                  : 'bg-cream/60 hover:bg-cream',
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
                className={cn(
                  'text-text-secondary transition-transform shrink-0',
                  typeOpen && 'rotate-180',
                )}
              />
            </button>

            {typeOpen && (
              <div
                className={cn(
                  'absolute top-full left-0 right-0 md:left-auto md:right-0 md:min-w-[220px] mt-3 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(23,32,51,0.25)] border border-border-warm/60 z-50 overflow-hidden p-1.5 text-left',
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
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cream-warm rounded-xl text-left text-[13px] font-inter text-text-secondary transition-colors"
                    >
                      <X size={14} />
                      {t('search:filters.resetAll')}
                    </button>
                    <div className="my-1 border-t border-border-warm/60" />
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
                      'w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-cream-warm rounded-xl text-left text-[14px] font-inter transition-colors',
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
            className={cn(
              'bg-terracotta text-white font-inter text-[14px] font-semibold px-7 min-h-[48px] rounded-2xl md:rounded-full',
              'flex items-center justify-center gap-2',
              'shadow-[0_4px_14px_rgba(204,123,80,0.4)]',
              'transition-all duration-200',
              'hover:shadow-[0_8px_24px_rgba(204,123,80,0.55)] hover:-translate-y-px hover:bg-[#b8694a]',
              'active:translate-y-0 active:shadow-[0_2px_8px_rgba(204,123,80,0.4)]',
            )}
          >
            <Search size={16} />
            {t('common:search')}
          </button>
        </div>
      </div>
    </div>
  )
}
