import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MapPin, X, ChevronDown, Grid3X3, List, Map,
  Bed, Bath, Maximize, Home, Heart, Check,
  Camera, Sliders, Bell
} from 'lucide-react'
import { getProperties } from '@/services/property.service'
import { getNeighborhoods } from '@/services/neighborhood.service'

import { useFavorites } from '@/hooks/useFavorites'
import { useCurrency } from '@/hooks/useCurrency'
import { useLang } from '@/hooks/useLang'
import { getImageUrl } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { Property } from '@/data/properties'

import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

/* ───────────────────── types ───────────────────── */

type ViewMode = 'grid' | 'list' | 'map'
type Transaction = 'sale' | 'rent'

interface Filters {
  transaction: Transaction
  searchQuery: string
  neighborhoods: string[]
  types: string[]
  priceMin: string
  priceMax: string
  surfaceMin: string
  surfaceMax: string
  landMin: string
  landMax: string
  roomsMin: string
  roomsMax: string
  bedroomsMin: string
  bedroomsMax: string
  radius: string
  statuses: string[]
  views: string[]
  styles: string[]
  amenities: string[]
  media: string[]
}

/* ───────────────────── constants ───────────────────── */

// Filter options reference i18n keys; labels resolved at render via t().
const typeOptions = [
  { key: 'villa', i18nKey: 'types.villa' },
  { key: 'apartment', i18nKey: 'types.apartment' },
  { key: 'riad', i18nKey: 'types.riad' },
  { key: 'prestige', i18nKey: 'types.prestige' },
  { key: 'land', i18nKey: 'types.land' },
  { key: 'rooftop', i18nKey: 'types.rooftop' },
]

const radiusOptions = [
  { value: '0', label: '0 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '20', label: '20 km' },
  { value: '50', label: '50 km' },
]

const statusOptions = [
  { key: 'neuf', i18nKey: 'status.new' },
  { key: 'ancien', i18nKey: 'status.old' },
  { key: 'exclusivite', i18nKey: 'status.exclusive' },
  { key: 'baisse', i18nKey: 'status.priceDrop' },
  { key: 'recent', i18nKey: 'status.recent' },
]

const viewOptions = [
  { key: 'atlas', i18nKey: 'views.atlas' },
  { key: 'jardin', i18nKey: 'views.garden' },
  { key: 'piscine', i18nKey: 'views.pool' },
  { key: 'medina', i18nKey: 'views.medina' },
  { key: 'golf', i18nKey: 'views.golf' },
]

const styleOptions = [
  { key: 'contemporain', i18nKey: 'styles.contemporary' },
  { key: 'marocain-moderne', i18nKey: 'styles.moroccanModern' },
  { key: 'riad-traditionnel', i18nKey: 'styles.traditionalRiad' },
  { key: 'minimaliste', i18nKey: 'styles.minimalist' },
  { key: 'domaine-prive', i18nKey: 'styles.privateEstate' },
]

const amenitiesList = [
  'Piscine', 'Jardin', 'Terrasse', 'Rooftop', 'Hammam',
  'Jacuzzi', 'Salle de sport', 'Climatisation', 'Cheminée',
  'Garage', 'Parking', 'Sécurité', 'Conciergerie',
  'Cuisine équipée', 'Meublé', 'Non meublé',
]

const mediaOptions = [
  { key: 'photos', i18nKey: 'media.photos' },
  { key: 'video', i18nKey: 'media.video' },
  { key: '3d', i18nKey: 'media.3d' },
]

// Sort options reference i18n keys; labels resolved at render via t().
const sortOptions = [
  { value: 'recommande', labelKey: 'sort.recommended' },
  { value: 'price-asc', labelKey: 'sort.priceAsc' },
  { value: 'price-desc', labelKey: 'sort.priceDesc' },
  { value: 'surface-asc', labelKey: 'sort.surfaceAsc' },
  { value: 'surface-desc', labelKey: 'sort.surfaceDesc' },
  { value: 'prix-m2-asc', labelKey: 'sort.pricePerSqmAsc' },
  { value: 'prix-m2-desc', labelKey: 'sort.pricePerSqmDesc' },
  { value: 'recent', labelKey: 'sort.recent' },
] as const

const defaultFilters: Filters = {
  transaction: 'sale',
  searchQuery: '',
  neighborhoods: [],
  types: [],
  priceMin: '',
  priceMax: '',
  surfaceMin: '',
  surfaceMax: '',
  landMin: '',
  landMax: '',
  roomsMin: '',
  roomsMax: '',
  bedroomsMin: '',
  bedroomsMax: '',
  radius: '0',
  statuses: [],
  views: [],
  styles: [],
  amenities: [],
  media: [],
}

// Fallback list when Supabase is unreachable. Source of truth is the
// `neighborhoods` table in Supabase (loaded via getNeighborhoods()).
const nbhdFallback = ['Guéliz', 'Hivernage', 'Palmeraie', 'Médina', 'Agdal', 'Targa', 'Amelkis', "Route de l'Ourika", 'Route de Fès', "Route d'Amizmiz", 'Route de Tahannaout', 'M Avenue', 'Chrifia']

/* ───────────────────── helper functions ───────────────────── */

function canUseWebGL() {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return Boolean(
    canvas.getContext('webgl2') ||
    canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl')
  )
}

function getActiveFilterChips(
  filters: Filters,
  t: (key: string) => string,
): { key: string; label: string; onRemove: () => void }[] {
  const chips: { key: string; label: string; onRemove: () => void }[] = []
  if (filters.searchQuery) chips.push({ key: 'search', label: `${t('filters.search')}: ${filters.searchQuery}`, onRemove: () => { } })
  filters.neighborhoods.forEach(n => chips.push({ key: `nbhd-${n}`, label: n, onRemove: () => { } }))
  filters.types.forEach(typeKey => {
    const opt = typeOptions.find(o => o.key === typeKey)
    chips.push({ key: `type-${typeKey}`, label: opt ? t(opt.i18nKey) : typeKey, onRemove: () => { } })
  })
  if (filters.priceMin || filters.priceMax) chips.push({ key: 'price', label: `${t('filters.budget')}: ${filters.priceMin || '0'} - ${filters.priceMax || '∞'} €`, onRemove: () => { } })
  if (filters.surfaceMin || filters.surfaceMax) chips.push({ key: 'surface', label: `${t('filters.surfaceLiving')}: ${filters.surfaceMin || '0'} - ${filters.surfaceMax || '∞'} m²`, onRemove: () => { } })
  if (filters.bedroomsMin || filters.bedroomsMax) chips.push({ key: 'bedrooms', label: `${t('filters.bedrooms')}: ${filters.bedroomsMin || '0'} - ${filters.bedroomsMax || '∞'}`, onRemove: () => { } })
  if (filters.roomsMin || filters.roomsMax) chips.push({ key: 'rooms', label: `${t('filters.rooms')}: ${filters.roomsMin || '0'} - ${filters.roomsMax || '∞'}`, onRemove: () => { } })
  filters.statuses.forEach(s => {
    const opt = statusOptions.find(o => o.key === s)
    chips.push({ key: `status-${s}`, label: opt ? t(opt.i18nKey) : s, onRemove: () => { } })
  })
  filters.amenities.forEach(a => chips.push({ key: `amenity-${a}`, label: a, onRemove: () => { } }))
  filters.media.forEach(m => {
    const opt = mediaOptions.find(o => o.key === m)
    chips.push({ key: `media-${m}`, label: opt ? t(opt.i18nKey) : m, onRemove: () => { } })
  })
  return chips
}

/* ───────────────────── accordion component ───────────────────── */

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border-warm pb-4 mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left mb-2">
        <span className="font-inter text-[14px] font-semibold text-midnight">{title}</span>
        <ChevronDown size={16} className={cn('text-text-secondary transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

/* ───────────────────── Property card (list view) ───────────────────── */

function PropertyCardList({ property }: { property: Property }) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const { formatPrice } = useCurrency()
  const { path } = useLang()
  const { t } = useTranslation('search')
  const priceDisplay = formatPrice(property.priceEUR)
  const image = getImageUrl(property.images[0] || 'property-01.jpg', { width: 400, height: 300, resize: 'cover' })
  const transactionLabel = property.transaction === 'sale' ? t('card.forSale') : t('card.forRent')

  return (
    <div className="bg-white rounded-card border border-border-warm shadow-card hover:shadow-card-hover transition-all duration-250 overflow-hidden group flex flex-col sm:flex-row">
      <Link to={path(`/property/${property.slug}`)} className="relative sm:w-[40%] aspect-[3/2] sm:aspect-auto overflow-hidden flex-shrink-0">
        <img src={image} alt={property.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400" loading="lazy" />
        <span className="absolute top-3 left-3 bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded">
          {transactionLabel}
        </span>
        {property.isExclusive && (
          <span className="absolute top-3 left-[70px] bg-gold text-midnight text-[11px] font-semibold px-2 py-1 rounded">Exclusivité</span>
        )}
      </Link>
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between">
            <p className="text-terracotta font-inter text-[20px] font-semibold">{priceDisplay}</p>
            <button
              onClick={() => toggleFavorite(property.slug)}
              className="w-9 h-9 border border-border-warm rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Heart size={18} className={isFavorite(property.slug) ? 'fill-terracotta text-terracotta' : 'text-text-secondary'} />
            </button>
          </div>
          <p className="text-text-secondary text-[13px] font-inter">{property.neighborhood}, {property.city}</p>
          <Link to={path(`/property/${property.slug}`)}>
            <h3 className="font-playfair text-[18px] font-medium text-midnight mt-1 mb-2 hover:text-terracotta transition-colors">{property.title}</h3>
          </Link>
          <p className="text-text-secondary text-[14px] font-inter line-clamp-2 mb-3">{property.description}</p>
          <div className="flex items-center gap-5 text-text-secondary text-[13px] font-inter mb-3">
            <span className="flex items-center gap-1"><Maximize size={15} />{property.surface} m²</span>
            {property.bedrooms > 0 && <span className="flex items-center gap-1"><Bed size={15} />{property.bedrooms}</span>}
            <span className="flex items-center gap-1"><Bath size={15} />{property.bathrooms}</span>
            <span className="flex items-center gap-1"><Home size={15} />{property.rooms} pièces</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {property.amenities.slice(0, 4).map(a => (
            <span key={a} className="bg-cream-warm text-text-secondary text-[11px] px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   MapView — MapLibre GL con tiles OSM reales
   streets style + popup interactivo
   ════════════════════════════════════════ */

function MapView({ properties, hoveredId, onHover, onSelect }: { properties: Property[]; hoveredId: string | null; onHover: (id: string | null) => void; onSelect?: (slug: string) => void }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const popupsRef = useRef<maplibregl.Popup[]>([])
  const [mapError, setMapError] = useState(false)
  const { formatPrice } = useCurrency()
  const { path } = useLang()

  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)
  const formatPriceRef = useRef(formatPrice)
  const pathRef = useRef(path)
  useLayoutEffect(() => {
    onHoverRef.current = onHover
    onSelectRef.current = onSelect
    formatPriceRef.current = formatPrice
    pathRef.current = path
  })

  useEffect(() => {
    if (!mapContainer.current) return
    if (!canUseWebGL()) {
      setMapError(true)
      return
    }

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [-7.98, 31.62],
        zoom: 11.5,
        interactive: true,
        attributionControl: false,
      })
    } catch (error) {
      console.error('Failed to initialize property map:', error)
      setMapError(true)
      map.current = null
      return
    }

    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.current.on('error', (event) => {
      console.error('Property map error:', event.error)
    })

    return () => {
      markersRef.current.forEach(m => m.remove())
      popupsRef.current.forEach(p => p.remove())
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || properties.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    properties.forEach(p => bounds.extend([p.longitude, p.latitude]))
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 })
    }
  }, [properties])

  useEffect(() => {
    if (!map.current) return
    markersRef.current.forEach(m => m.remove())
    popupsRef.current.forEach(p => p.remove())
    markersRef.current = []
    popupsRef.current = []

    // Close any open popup when clicking on map background
    const closeAllPopups = () => {
      popupsRef.current.forEach(p => p.remove())
    }
    map.current.on('click', closeAllPopups)

    properties.forEach(p => {
      const isHovered = hoveredId === p.slug
      const priceLabel = (p.priceEUR / 1000).toFixed(0) + 'k €'

      const el = document.createElement('div')
      el.style.cursor = 'pointer'
      el.innerHTML = `<div style="
        background: ${isHovered ? '#315C45' : '#B5533A'};
        color: white; padding: 5px 12px; border-radius: 20px;
        font-size: 12px; font-weight: 700; white-space: nowrap;
        box-shadow: 0 2px 10px rgba(0,0,0,0.25);
        font-family: Inter, sans-serif; letter-spacing: -0.2px;
        border: 2px solid white;
        transform: ${isHovered ? 'scale(1.15) translateY(-2px)' : 'scale(1)'}
        transition: all 0.2s ease;
      ">${priceLabel}</div>`

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, 4] })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map.current!)

      // Build rich popup with image carousel
      const popupContainer = document.createElement('div')
      popupContainer.style.fontFamily = 'Inter, sans-serif'
      popupContainer.style.width = '280px'
      popupContainer.style.cursor = 'default'

      const imgs = p.images.length > 0 ? p.images : ['property-01.jpg']
      let currentImg = 0

      const renderPopup = () => {
        const hasMultiple = imgs.length > 1
        popupContainer.innerHTML = `
          <div style="position:relative;border-radius:10px 10px 0 0;overflow:hidden;height:160px;background:#f5f5f5;">
            <img src="${getImageUrl(imgs[currentImg], { width: 560, height: 320, resize: 'cover' })}" style="width:100%;height:100%;object-fit:cover;display:block;" />
            ${hasMultiple ? `
              <button class="popup-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:#333;box-shadow:0 2px 6px rgba(0,0,0,0.15);">&#8249;</button>
              <button class="popup-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:#333;box-shadow:0 2px 6px rgba(0,0,0,0.15);">&#8250;</button>
              <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:4px;">
                ${imgs.map((_, i) => `<div style="width:6px;height:6px;border-radius:50%;background:${i === currentImg ? 'white' : 'rgba(255,255,255,0.5)'};"></div>`).join('')}
              </div>
            ` : ''}
            <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.6);color:white;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;display:flex;align-items:center;gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              ${imgs.length}
            </div>
          </div>
          <div style="padding:12px;background:white;border-radius:0 0 10px 10px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <p style="color:#B5533A;font-size:16px;font-weight:700;margin:0;flex:1;">${formatPriceRef.current(p.priceEUR)}</p>
              ${p.isExclusive ? '<span style="background:#315C45;color:white;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;">Exclusivité</span>' : ''}
            </div>
            <p style="color:#1E1E1E;font-size:14px;font-weight:600;margin:0 0 2px 0;">${p.title}</p>
            <p style="color:#6E6259;font-size:12px;margin:0 0 8px 0;">${p.neighborhood}, Marrakech</p>
            <p style="color:#6E6259;font-size:12px;margin:0 0 12px 0;">${p.surface} m² · ${p.rooms} pièces · ${p.bedrooms} chambres</p>
            <a href="${pathRef.current(`/property/${p.slug}`)}" style="display:block;width:100%;text-align:center;background:#B5533A;color:white;font-size:13px;font-weight:600;padding:8px 0;border-radius:8px;text-decoration:none;">Voir le bien</a>
          </div>
        `

        // Attach carousel listeners
        const prevBtn = popupContainer.querySelector('.popup-prev')
        const nextBtn = popupContainer.querySelector('.popup-next')
        if (prevBtn) {
          prevBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            currentImg = (currentImg - 1 + imgs.length) % imgs.length
            renderPopup()
          })
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            currentImg = (currentImg + 1) % imgs.length
            renderPopup()
          })
        }
      }

      renderPopup()

      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, offset: 18, maxWidth: '300px' })
        .setDOMContent(popupContainer)

      el.addEventListener('mouseenter', () => {
        onHoverRef.current(p.slug)
        if (!onSelectRef.current) {
          // Desktop: show popup on hover
          popupsRef.current.forEach(pop => pop.remove())
          popup.setLngLat([p.longitude, p.latitude]).addTo(map.current!)
        }
      })
      el.addEventListener('click', (e: Event) => {
        e.stopPropagation()
        if (onSelectRef.current) {
          // Mobile: call onSelect instead of showing popup
          onSelectRef.current(p.slug)
          // Center map on selected property
          map.current?.easeTo({ center: [p.longitude, p.latitude], zoom: Math.max(map.current.getZoom(), 14), duration: 300 })
        } else {
          // Desktop: show popup on click
          popupsRef.current.forEach(pop => pop.remove())
          popup.setLngLat([p.longitude, p.latitude]).addTo(map.current!)
        }
      })

      markersRef.current.push(marker)
      popupsRef.current.push(popup)
    })

    return () => {
      map.current?.off('click', closeAllPopups)
    }
  }, [properties, hoveredId])

  useEffect(() => {
    if (!map.current || !hoveredId) return
    const target = properties.find(p => p.slug === hoveredId)
    if (target) map.current.easeTo({ center: [target.longitude, target.latitude], zoom: Math.max(map.current.getZoom(), 13), duration: 400 })
  }, [hoveredId, properties])

  if (mapError) {
    return (
      <div className="w-full h-full min-h-[320px] bg-cream-warm flex items-center justify-center p-6 text-center">
        <div>
          <MapPin size={36} className="mx-auto text-terracotta mb-3" />
          <p className="font-inter text-[15px] font-semibold text-midnight">Carte indisponible</p>
          <p className="font-inter text-[13px] text-text-secondary mt-1 max-w-xs">
            Votre navigateur ne peut pas initialiser la carte. Les biens restent disponibles dans la liste.
          </p>
        </div>
      </div>
    )
  }

  return <div ref={mapContainer} className="w-full h-full" />
}

/* ════════════════════════════════════════
   PropertyCardCompact — para modo Carte
   ════════════════════════════════════════ */

function PropertyCardCompact({ property, isHovered = false }: { property: Property; isHovered?: boolean }) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const { formatPrice } = useCurrency()
  const { path } = useLang()
  const { t } = useTranslation('search')
  const image = getImageUrl(property.images[0] || 'property-01.jpg', { width: 400, height: 300, resize: 'cover' })
  const transactionLabel = property.transaction === 'sale' ? t('card.forSale') : t('card.forRent')

  return (
    <Link to={path(`/property/${property.slug}`)} className={cn(
      "flex gap-3 bg-white rounded-xl border border-border-warm p-2 hover:shadow-md transition-all duration-200 cursor-pointer",
      isHovered && "border-terracotta shadow-md ring-1 ring-terracotta/20"
    )}>
      <div className="relative w-[100px] h-[80px] flex-shrink-0 rounded-lg overflow-hidden">
        <img src={image} alt={property.title} className="w-full h-full object-cover" loading="lazy" />
        <span className="absolute top-1 left-1 bg-palm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">{transactionLabel}</span>
        {property.isExclusive && <span className="absolute top-5 left-1 bg-gold text-midnight text-[9px] font-semibold px-1.5 py-0.5 rounded">Excl.</span>}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-terracotta font-inter text-[14px] font-bold leading-tight">{formatPrice(property.priceEUR)}</p>
        <p className="text-text-primary text-[12px] font-medium truncate mt-0.5">{property.title}</p>
        <p className="text-text-secondary text-[11px] mt-0.5">{property.neighborhood}, Marrakech</p>
        <div className="flex items-center gap-2 text-text-secondary text-[11px] mt-1">
          <span className="flex items-center gap-0.5"><Maximize size={11} />{property.surface} m²</span>
          {property.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed size={11} />{property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath size={11} />{property.bathrooms}</span>}
        </div>
      </div>
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(property.slug) }} className="self-start mt-1 w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream transition-colors flex-shrink-0">
        <Heart size={14} className={isFavorite(property.slug) ? 'fill-terracotta text-terracotta' : 'text-text-secondary'} />
      </button>
    </Link>
  )
}

/* ───────────────────── Property Card (grid) ───────────────────── */

function PropertyCardGrid({ property, isHovered = false }: { property: Property; isHovered?: boolean }) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const { formatPrice } = useCurrency()
  const { path } = useLang()
  const { t } = useTranslation('search')
  const priceDisplay = formatPrice(property.priceEUR)
  const image = getImageUrl(property.images[0] || 'property-01.jpg', { width: 400, height: 300, resize: 'cover' })
  const transactionLabel = property.transaction === 'sale' ? t('card.forSale') : t('card.forRent')

  return (
    <div className={cn(
      "bg-white rounded-card border border-border-warm shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-250 overflow-hidden group",
      isHovered && "border-terracotta shadow-card-hover -translate-y-1"
    )}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={path(`/property/${property.slug}`)}>
          <img src={image} alt={property.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400" loading="lazy" />
        </Link>
        <span className="absolute top-3 left-3 bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded">
          {transactionLabel}
        </span>
        {property.isExclusive && (
          <span className="absolute top-3 left-[70px] bg-gold text-midnight text-[11px] font-semibold px-2 py-1 rounded">Exclusivité</span>
        )}
        <span className="absolute top-3 right-14 bg-black/50 text-white text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1">
          <Camera size={12} /> {property.images.length}
        </span>
        <button
          onClick={() => toggleFavorite(property.slug)}
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"
        >
          <Heart size={18} className={isFavorite(property.slug) ? 'fill-terracotta text-terracotta' : 'text-text-secondary'} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-terracotta font-inter text-[18px] font-semibold mb-1">{priceDisplay}</p>
        <p className="text-text-secondary text-[13px] font-inter mb-1">{property.neighborhood}, {property.city}</p>
        <Link to={path(`/property/${property.slug}`)}>
          <h3 className="font-playfair text-[16px] font-medium text-text-primary truncate mb-3 hover:text-terracotta transition-colors">{property.title}</h3>
        </Link>
        <div className="flex items-center gap-4 text-text-secondary text-[13px] font-inter">
          <span className="flex items-center gap-1"><Maximize size={15} />{property.surface} m²</span>
          {property.bedrooms > 0 && <span className="flex items-center gap-1"><Bed size={15} />{property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={15} />{property.bathrooms}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {property.amenities.slice(0, 3).map(a => (
            <span key={a} className="bg-cream-warm text-text-secondary text-[11px] px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>
        {property.surface > 0 && (
          <p className="text-text-secondary text-[12px] font-inter mt-3">
            {new Intl.NumberFormat('fr-FR').format(property.pricePerSqm)} €/m²
          </p>
        )}
        <Link to={path(`/property/${property.slug}`)} className="inline-block mt-3 text-terracotta text-[14px] font-inter font-medium hover:underline">
          {t('viewProperty')} →
        </Link>
      </div>
    </div>
  )
}

/* ───────────────────── Mobile filter drawer ───────────────────── */

function MobileFilterDrawer({ filters, setFilters, onApply, onReset, resultCount, nbhdList }: {
  filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>; onApply: () => void; onReset: () => void; resultCount: number; nbhdList: string[]
}) {
  const { t } = useTranslation('search')
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters(f => ({ ...f, [key]: value }))

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-warm">
        <button onClick={onReset} className="text-text-secondary text-[14px]">{t('mobile.reset')}</button>
        <span className="font-inter text-[16px] font-semibold text-midnight">{t('mobile.filters')}</span>
        <button onClick={onApply}><X size={24} className="text-text-primary" /></button>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Transaction */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.transaction')}</label>
          <div className="flex border border-border-warm rounded-lg overflow-hidden">
            <button onClick={() => update('transaction', 'sale')} className={cn('flex-1 py-2 text-[14px] font-medium', filters.transaction === 'sale' ? 'bg-terracotta text-white' : 'bg-white text-text-primary')}>{t('filters.buy')}</button>
            <button onClick={() => update('transaction', 'rent')} className={cn('flex-1 py-2 text-[14px] font-medium', filters.transaction === 'rent' ? 'bg-terracotta text-white' : 'bg-white text-text-primary')}>{t('filters.rent')}</button>
          </div>
        </div>
        {/* Localisation */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.location')}</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text" placeholder={t('filters.locationPlaceholder')}
              value={filters.searchQuery} onChange={e => update('searchQuery', e.target.value)}
              className="w-full h-12 pl-10 pr-4 border border-border-warm rounded-lg text-[14px] focus:border-terracotta focus:outline-none"
            />
          </div>
          <div className="mt-2 space-y-1">
            {nbhdList.map(n => (
              <label key={n} className="flex items-center gap-2 py-1 cursor-pointer">
                <div className={cn('w-4 h-4 border rounded flex items-center justify-center', filters.neighborhoods.includes(n) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
                  {filters.neighborhoods.includes(n) && <Check size={10} className="text-white" />}
                </div>
                <span className="text-[14px] text-text-primary">{n}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Type */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.type')}</label>
          <div className="space-y-2">
            {typeOptions.map(opt => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <div className={cn('w-4 h-4 border rounded flex items-center justify-center', filters.types.includes(opt.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
                  {filters.types.includes(opt.key) && <Check size={10} className="text-white" />}
                </div>
                <span className="text-[14px] text-text-primary">{t(opt.i18nKey)}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Budget */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.budget')}</label>
          <div className="flex gap-2">
            <input type="number" placeholder={t('filters.min')} value={filters.priceMin} onChange={e => update('priceMin', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px] focus:border-terracotta focus:outline-none" />
            <input type="number" placeholder={t('filters.max')} value={filters.priceMax} onChange={e => update('priceMax', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px] focus:border-terracotta focus:outline-none" />
          </div>
        </div>
        {/* Surface */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.surfaceLiving')}</label>
          <div className="flex gap-2">
            <input type="number" placeholder={t('filters.min')} value={filters.surfaceMin} onChange={e => update('surfaceMin', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px] focus:border-terracotta focus:outline-none" />
            <input type="number" placeholder={t('filters.max')} value={filters.surfaceMax} onChange={e => update('surfaceMax', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px] focus:border-terracotta focus:outline-none" />
          </div>
        </div>
        {/* Pièces */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.rooms')}</label>
          <div className="flex gap-2">
            <select value={filters.roomsMin} onChange={e => update('roomsMin', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px]">
              <option value="">Min</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
            </select>
            <select value={filters.roomsMax} onChange={e => update('roomsMax', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px]">
              <option value="">Max</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>8</option><option>10</option><option>12</option>
            </select>
          </div>
        </div>
        {/* Chambres */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.bedrooms')}</label>
          <div className="flex gap-2">
            <select value={filters.bedroomsMin} onChange={e => update('bedroomsMin', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px]">
              <option value="">Min</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
            </select>
            <select value={filters.bedroomsMax} onChange={e => update('bedroomsMax', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px]">
              <option value="">Max</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option>
            </select>
          </div>
        </div>
        {/* Statut */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.status')}</label>
          {statusOptions.map(s => (
            <label key={s.key} className="flex items-center gap-2 py-1 cursor-pointer">
              <div className={cn('w-4 h-4 border rounded flex items-center justify-center', filters.statuses.includes(s.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
                {filters.statuses.includes(s.key) && <Check size={10} className="text-white" />}
              </div>
              <span className="text-[14px] text-text-primary">{t(s.i18nKey)}</span>
            </label>
          ))}
        </div>
        {/* Équipements */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.amenities')}</label>
          <div className="grid grid-cols-2 gap-2">
            {amenitiesList.map(a => (
              <label key={a} className="flex items-center gap-2 cursor-pointer">
                <div className={cn('w-4 h-4 border rounded flex items-center justify-center', filters.amenities.includes(a) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
                  {filters.amenities.includes(a) && <Check size={10} className="text-white" />}
                </div>
                <span className="text-[13px] text-text-primary">{a}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Médias */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">{t('filters.media')}</label>
          {mediaOptions.map(m => (
            <label key={m.key} className="flex items-center gap-2 py-1 cursor-pointer">
              <div className={cn('w-4 h-4 border rounded flex items-center justify-center', filters.media.includes(m.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
                {filters.media.includes(m.key) && <Check size={10} className="text-white" />}
              </div>
              <span className="text-[14px] text-text-primary">{t(m.i18nKey)}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Sticky footer */}
      <div className="border-t border-border-warm p-4">
        <button onClick={onApply} className="w-full h-12 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.02] transition-transform">
          {t('mobile.results', { count: resultCount })}
        </button>
      </div>
    </div>
  )
}

/* ───────────────────── main Search component ───────────────────── */

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { path } = useLang()
  const { t } = useTranslation('search')
  const isRentRoute = location.pathname.endsWith('/louer')

  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    transaction: isRentRoute ? 'rent' : 'sale',
  }))
  const [sort, setSort] = useState('recommande')
  const [view, setView] = useState<ViewMode>('grid')
  const [mapVisible, setMapVisible] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [hoveredMapSlug, setHoveredMapSlug] = useState<string | null>(null)
  const [selectedMapSlug, setSelectedMapSlug] = useState<string | null>(null)
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [nbhdList, setNbhdList] = useState<string[]>(nbhdFallback)

  // Load neighborhoods from Supabase (fallback to hardcoded list on failure).
  useEffect(() => {
    getNeighborhoods()
      .then(rows => {
        if (rows.length > 0) setNbhdList(rows.map(n => n.name))
      })
      .catch(err => console.error('Failed to load neighborhoods:', err))
  }, [])

  // Update transaction when route changes
  useEffect(() => {
    setFilters(f => ({ ...f, transaction: isRentRoute ? 'rent' : 'sale' }))
  }, [isRentRoute])

  useEffect(() => {
    // Only flash the spinner on the first load; keep showing previous results
    // when filters change so the list doesn't blink to empty.
    if (allProperties.length === 0) setLoading(true)

    getProperties({
      transaction: filters.transaction,
      types: filters.types,
      neighborhoods: filters.neighborhoods,
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      surfaceMin: filters.surfaceMin ? Number(filters.surfaceMin) : undefined,
      surfaceMax: filters.surfaceMax ? Number(filters.surfaceMax) : undefined,
      bedroomsMin: filters.bedroomsMin ? Number(filters.bedroomsMin) : undefined,
      bedroomsMax: filters.bedroomsMax ? Number(filters.bedroomsMax) : undefined,
      searchQuery: filters.searchQuery,
      sort,
    }).then((data) => {
      setAllProperties(data)
    }).catch((err) => {
      console.error('Failed to load properties:', err)
      setAllProperties([])
    }).finally(() => {
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort])

  const filtered = allProperties

  const activeChips = useMemo(() => getActiveFilterChips(filters, t), [filters, t])

  const resetFilters = useCallback(() => {
    setFilters({ ...defaultFilters, transaction: filters.transaction })
  }, [filters.transaction])

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(f => ({ ...f, [key]: value }))
  }, [])

  const toggleArrayValue = useCallback(<K extends keyof Filters>(key: K, value: string) => {
    setFilters(f => {
      const arr = (f[key] as string[])
      const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      return { ...f, [key]: newArr }
    })
  }, [])

  const resultsLabel = filters.transaction === 'sale'
    ? t('resultsForSale', { count: filtered.length })
    : t('resultsForRent', { count: filtered.length })

  const pageTitle = filters.transaction === 'sale' ? t('pageTitle.buy') : t('pageTitle.rent')

  // Handle map pin hover syncing
  const handleMapHover = useCallback((slug: string | null) => {
    setHoveredMapSlug(slug)
  }, [])

  // Handle map pin select (mobile)
  const handleMapSelect = useCallback((slug: string) => {
    setSelectedMapSlug(slug)
  }, [])

  return (
    <div className="min-h-[100dvh] bg-cream">
      {/* ─── Sticky Top Bar ─── */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-border-warm shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          {/* Breadcrumb + controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-2">
            {/* Breadcrumb + count */}
            <div>
              <p className="hidden lg:block text-[13px] text-text-secondary mb-1">
                {t('breadcrumb.home')} &gt; {pageTitle} &gt; {t('city')}
              </p>
              <p className="font-inter text-[16px] font-medium text-midnight">{resultsLabel}</p>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sort} onChange={e => setSort(e.target.value)}
                  className="h-9 pl-3 pr-8 border border-border-warm rounded-lg text-[13px] font-inter bg-white appearance-none cursor-pointer focus:border-terracotta focus:outline-none"
                >
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" />
              </div>

              {/* View toggle */}
              <div className="flex border border-border-warm rounded-lg overflow-hidden">
                <button onClick={() => setView('grid')} className={cn('w-9 h-9 flex items-center justify-center', view === 'grid' ? 'bg-terracotta text-white' : 'bg-white text-text-secondary hover:bg-cream')} title="Galerie">
                  <Grid3X3 size={16} />
                </button>
                <button onClick={() => setView('list')} className={cn('w-9 h-9 flex items-center justify-center', view === 'list' ? 'bg-terracotta text-white' : 'bg-white text-text-secondary hover:bg-cream')} title="Liste">
                  <List size={16} />
                </button>
                <button onClick={() => setView('map')} className={cn('w-9 h-9 flex items-center justify-center lg:hidden', view === 'map' ? 'bg-terracotta text-white' : 'bg-white text-text-secondary hover:bg-cream')} title="Carte">
                  <Map size={16} />
                </button>
                <button onClick={() => { setMapVisible(!mapVisible); if (!mapVisible) setView('list'); else setView('grid'); }} className={cn('hidden lg:flex w-9 h-9 items-center justify-center', mapVisible ? 'bg-terracotta text-white' : 'bg-white text-text-secondary hover:bg-cream')} title="Carte">
                  <Map size={16} />
                </button>
              </div>

              {/* Alert button */}
              <button className="hidden md:flex items-center gap-1.5 h-9 px-3 border border-border-warm rounded-lg text-[13px] font-medium text-text-primary hover:border-terracotta transition-colors">
                <Bell size={14} />
                <span>{t('createAlert')}</span>
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex items-center gap-2 pb-3 overflow-x-auto">
              {activeChips.map(chip => (
                <span key={chip.key} className="flex items-center gap-1 bg-palm/10 text-palm text-[12px] font-medium px-3 py-1 rounded-pill whitespace-nowrap">
                  {chip.label}
                  <button onClick={() => {
                    if (chip.key === 'search') updateFilter('searchQuery', '')
                    else if (chip.key.startsWith('nbhd-')) toggleArrayValue('neighborhoods', chip.key.replace('nbhd-', ''))
                    else if (chip.key.startsWith('type-')) toggleArrayValue('types', chip.key.replace('type-', ''))
                    else if (chip.key === 'price') { updateFilter('priceMin', ''); updateFilter('priceMax', '') }
                    else if (chip.key === 'surface') { updateFilter('surfaceMin', ''); updateFilter('surfaceMax', '') }
                    else if (chip.key.startsWith('status-')) toggleArrayValue('statuses', chip.key.replace('status-', ''))
                    else if (chip.key.startsWith('amenity-')) toggleArrayValue('amenities', chip.key.replace('amenity-', ''))
                    else if (chip.key.startsWith('media-')) toggleArrayValue('media', chip.key.replace('media-', ''))
                  }} className="hover:opacity-70">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button onClick={resetFilters} className="text-text-secondary text-[12px] font-medium hover:text-terracotta whitespace-nowrap">
                {t('filters.resetAll')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Content Area ─── */}
      <div className={cn("mx-auto flex", mapVisible ? "max-w-none" : "max-w-[1600px]")}>
        {/* Filter Sidebar — desktop only, hidden when map is active */}
        <aside className={cn("hidden lg:block w-[300px] flex-shrink-0 bg-white border-r border-border-warm sticky top-[calc(72px+80px)] h-[calc(100dvh-152px)] overflow-y-auto", mapVisible && "lg:hidden")}>
          <div className="p-5">
            {/* Transaction toggle */}
            <div className="mb-5">
              <div className="flex border border-border-warm rounded-lg overflow-hidden">
                <button
                  onClick={() => { updateFilter('transaction', 'sale'); navigate(path('/acheter')) }}
                  className={cn('flex-1 py-2 text-[14px] font-medium transition-colors', filters.transaction === 'sale' ? 'bg-terracotta text-white' : 'bg-white text-text-primary')}
                >{t('filters.buy')}</button>
                <button
                  onClick={() => { updateFilter('transaction', 'rent'); navigate(path('/louer')) }}
                  className={cn('flex-1 py-2 text-[14px] font-medium transition-colors', filters.transaction === 'rent' ? 'bg-terracotta text-white' : 'bg-white text-text-primary')}
                >{t('filters.rent')}</button>
              </div>
            </div>

            {/* Localisation */}
            <FilterSection title={t('filters.location')}>
              <div className="relative mb-3">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text" placeholder={t('filters.locationPlaceholder')}
                  value={filters.searchQuery} onChange={e => updateFilter('searchQuery', e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-border-warm rounded-lg text-[14px] focus:border-terracotta focus:outline-none"
                />
              </div>
              <div className="space-y-1 max-h-[180px] overflow-y-auto">
                {nbhdList.map(n => (
                  <label key={n} className="flex items-center gap-2 py-0.5 cursor-pointer">
                    <div
                      onClick={() => toggleArrayValue('neighborhoods', n)}
                      className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer transition-colors', filters.neighborhoods.includes(n) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                    >
                      {filters.neighborhoods.includes(n) && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-[13px] text-text-primary">{n}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <select value={filters.radius} onChange={e => updateFilter('radius', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none">
                  {radiusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </FilterSection>

            {/* Type de bien */}
            <FilterSection title={t('filters.type')}>
              {typeOptions.map(opt => (
                <label key={opt.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('types', opt.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.types.includes(opt.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.types.includes(opt.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{t(opt.i18nKey)}</span>
                </label>
              ))}
            </FilterSection>

            {/* Budget */}
            <FilterSection title={t('filters.budget')}>
              <div className="flex gap-2">
                <input type="number" placeholder={t('filters.min')} value={filters.priceMin} onChange={e => updateFilter('priceMin', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
                <input type="number" placeholder={t('filters.max')} value={filters.priceMax} onChange={e => updateFilter('priceMax', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
              </div>
            </FilterSection>

            {/* Surface habitable */}
            <FilterSection title={t('filters.surfaceLiving')}>
              <div className="flex gap-2">
                <input type="number" placeholder={t('filters.min')} value={filters.surfaceMin} onChange={e => updateFilter('surfaceMin', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
                <input type="number" placeholder={t('filters.max')} value={filters.surfaceMax} onChange={e => updateFilter('surfaceMax', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
              </div>
            </FilterSection>

            {/* Surface terrain */}
            <FilterSection title={t('filters.surfaceLand')}>
              <div className="flex gap-2">
                <input type="number" placeholder={t('filters.min')} value={filters.landMin} onChange={e => updateFilter('landMin', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
                <input type="number" placeholder={t('filters.max')} value={filters.landMax} onChange={e => updateFilter('landMax', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
              </div>
            </FilterSection>

            {/* Pièces */}
            <FilterSection title={t('filters.rooms')}>
              <div className="flex gap-2">
                <select value={filters.roomsMin} onChange={e => updateFilter('roomsMin', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-2 text-[13px]">
                  <option value="">Min</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
                </select>
                <select value={filters.roomsMax} onChange={e => updateFilter('roomsMax', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-2 text-[13px]">
                  <option value="">Max</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>8</option><option>10</option><option>12</option>
                </select>
              </div>
            </FilterSection>

            {/* Chambres */}
            <FilterSection title={t('filters.bedrooms')}>
              <div className="flex gap-2">
                <select value={filters.bedroomsMin} onChange={e => updateFilter('bedroomsMin', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-2 text-[13px]">
                  <option value="">Min</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
                </select>
                <select value={filters.bedroomsMax} onChange={e => updateFilter('bedroomsMax', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-2 text-[13px]">
                  <option value="">Max</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option>
                </select>
              </div>
            </FilterSection>

            {/* Statut */}
            <FilterSection title={t('filters.status')} defaultOpen={false}>
              {statusOptions.map(s => (
                <label key={s.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('statuses', s.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.statuses.includes(s.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.statuses.includes(s.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{t(s.i18nKey)}</span>
                </label>
              ))}
            </FilterSection>

            {/* Vue */}
            <FilterSection title={t('filters.view')} defaultOpen={false}>
              {viewOptions.map(v => (
                <label key={v.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('views', v.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.views.includes(v.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.views.includes(v.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{t(v.i18nKey)}</span>
                </label>
              ))}
            </FilterSection>

            {/* Style */}
            <FilterSection title={t('filters.style')} defaultOpen={false}>
              {styleOptions.map(s => (
                <label key={s.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('styles', s.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.styles.includes(s.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.styles.includes(s.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{t(s.i18nKey)}</span>
                </label>
              ))}
            </FilterSection>

            {/* Équipements */}
            <FilterSection title={t('filters.amenities')} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {amenitiesList.map(a => (
                  <label key={a} className="flex items-center gap-1.5 py-0.5 cursor-pointer">
                    <div
                      onClick={() => toggleArrayValue('amenities', a)}
                      className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer flex-shrink-0', filters.amenities.includes(a) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                    >
                      {filters.amenities.includes(a) && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-[12px] text-text-primary">{a}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Médias */}
            <FilterSection title={t('filters.media')} defaultOpen={false}>
              {mediaOptions.map(m => (
                <label key={m.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('media', m.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.media.includes(m.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.media.includes(m.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{t(m.i18nKey)}</span>
                </label>
              ))}
            </FilterSection>

            {/* Footer */}
            <div className="mt-6 space-y-2">
              <button onClick={resetFilters} className="w-full h-10 text-text-secondary text-[13px] font-medium hover:text-terracotta transition-colors">
                {t('filters.reset')}
              </button>
            </div>
          </div>
        </aside>

        {/* Center: Results */}
        <main className={cn("min-w-0 p-4 lg:p-6 transition-all duration-300", mapVisible ? "lg:w-1/2 lg:flex-shrink-0" : "flex-1")}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
              <p className="text-text-secondary mt-4">{t('loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MapPin size={64} className="text-sand/60 mb-4" />
              <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-2">{t('noResults')}</h3>
              <p className="text-text-secondary text-[15px] font-inter max-w-md mb-6">
                Essayez d'élargir votre recherche ou de modifier vos filtres pour trouver plus de résultats.
              </p>
              <button onClick={resetFilters} className="h-11 px-6 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.02] transition-transform">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              {/* Desktop map mode — list view alongside map (50/50) */}
              {mapVisible && (
                <div className="hidden lg:block space-y-4">
                  {filtered.map(p => (
                    <div key={p.slug} onMouseEnter={() => handleMapHover(p.slug)} onMouseLeave={() => handleMapHover(null)}>
                      <PropertyCardList property={p} />
                    </div>
                  ))}
                </div>
              )}

              {/* Grid view */}
              {view === 'grid' && (
                <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", mapVisible && "lg:hidden")}>
                  {filtered.map(p => (
                    <div key={p.slug} onMouseEnter={() => handleMapHover(p.slug)} onMouseLeave={() => handleMapHover(null)}>
                      <PropertyCardGrid property={p} isHovered={hoveredMapSlug === p.slug} />
                    </div>
                  ))}
                </div>
              )}

              {/* List view */}
              {view === 'list' && (
                <div className={cn("space-y-4", mapVisible && "lg:hidden")}>
                  {filtered.map(p => (
                    <div key={p.slug} onMouseEnter={() => handleMapHover(p.slug)} onMouseLeave={() => handleMapHover(null)}>
                      <PropertyCardList property={p} />
                    </div>
                  ))}
                </div>
              )}

              {/* Map view (mobile) */}
              {view === 'map' && (
                <div className="lg:hidden fixed inset-0 top-[136px] z-20 bg-midnight">
                  <button onClick={() => { setView('grid'); setSelectedMapSlug(null) }} className="absolute top-4 right-4 z-30 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center">
                    <X size={20} />
                  </button>
                  <MapView properties={filtered} hoveredId={hoveredMapSlug} onHover={handleMapHover} onSelect={handleMapSelect} />
                  {/* Bottom sheet — Green Acres style */}
                  <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
                    <div className="w-10 h-1 bg-border-warm rounded-full mx-auto mt-3 mb-1" />
                    {selectedMapSlug ? (
                      /* Selected property card */
                      <div className="p-4">
                        <button
                          onClick={() => setSelectedMapSlug(null)}
                          className="mb-2 text-[13px] text-text-secondary font-inter flex items-center gap-1 hover:text-terracotta"
                        >
                          <ChevronDown size={14} className="rotate-90" /> Retour à la liste
                        </button>
                        {(() => {
                          const p = filtered.find(x => x.slug === selectedMapSlug)
                          if (!p) return null
                          return <PropertyCardCompact property={p} isHovered={true} />
                        })()}
                      </div>
                    ) : (
                      /* Horizontal carousel of all properties */
                      <div className="p-4">
                        <p className="text-[12px] text-text-secondary font-inter mb-2 uppercase tracking-wide">{filtered.length} bien{filtered.length > 1 ? 's' : ''}</p>
                        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {filtered.map(p => (
                            <div
                              key={p.slug}
                              className="snap-start flex-shrink-0 w-[260px]"
                              onClick={() => setSelectedMapSlug(p.slug)}
                            >
                              <PropertyCardCompact property={p} isHovered={hoveredMapSlug === p.slug} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right: Map (desktop) */}
        {mapVisible && (
          <aside className="hidden lg:block lg:w-1/2 flex-shrink-0 sticky top-[calc(72px+80px)] h-[calc(100dvh-152px)] border-l border-border-warm transition-all duration-300">
            <MapView properties={filtered} hoveredId={hoveredMapSlug} onHover={handleMapHover} />
          </aside>
        )}
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-warm flex">
        <button onClick={() => setMobileFiltersOpen(true)} className="flex-1 flex items-center justify-center gap-2 h-14 text-[14px] font-medium text-text-primary">
          <Sliders size={18} />
          Filtres
        </button>
        <button onClick={() => setView(view === 'map' ? 'grid' : 'map')} className="flex-1 flex items-center justify-center gap-2 h-14 text-[14px] font-medium text-text-primary border-l border-border-warm">
          <Map size={18} />
          {view === 'map' ? 'Liste' : 'Carte'}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden">
          <MobileFilterDrawer
            filters={filters}
            setFilters={setFilters}
            onApply={() => setMobileFiltersOpen(false)}
            onReset={resetFilters}
            resultCount={filtered.length}
            nbhdList={nbhdList}
          />
        </div>
      )}
    </div>
  )
}
