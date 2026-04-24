import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, X, ChevronDown, Grid3X3, List, Map,
  Bed, Bath, Maximize, Home, Heart, Check,
  Camera, Sliders, Bell
} from 'lucide-react'
import { getProperties } from '@/services/property.service'

import { useFavorites } from '@/hooks/useFavorites'
import { useCurrency } from '@/hooks/useCurrency'
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

const typeOptions = [
  { key: 'villa', label: 'Villa' },
  { key: 'apartment', label: 'Appartement' },
  { key: 'riad', label: 'Riad' },
  { key: 'prestige', label: 'Maison de prestige' },
  { key: 'land', label: 'Terrain' },
  { key: 'rooftop', label: 'Rooftop' },
]

const radiusOptions = [
  { value: '0', label: '0 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '20', label: '20 km' },
  { value: '50', label: '50 km' },
]

const statusOptions = [
  { key: 'neuf', label: 'Neuf' },
  { key: 'ancien', label: 'Ancien' },
  { key: 'exclusivite', label: 'Exclusivité' },
  { key: 'baisse', label: 'Baisse de prix' },
  { key: 'recent', label: "Moins d'un mois" },
]

const viewOptions = [
  { key: 'atlas', label: 'Atlas' },
  { key: 'jardin', label: 'Jardin' },
  { key: 'piscine', label: 'Piscine' },
  { key: 'medina', label: 'Médina' },
  { key: 'golf', label: 'Golf' },
]

const styleOptions = [
  { key: 'contemporain', label: 'Contemporain' },
  { key: 'marocain-moderne', label: 'Marocain moderne' },
  { key: 'riad-traditionnel', label: 'Riad traditionnel rénové' },
  { key: 'minimaliste', label: 'Villa minimaliste' },
  { key: 'domaine-prive', label: 'Domaine privé' },
]

const amenitiesList = [
  'Piscine', 'Jardin', 'Terrasse', 'Rooftop', 'Hammam',
  'Jacuzzi', 'Salle de sport', 'Climatisation', 'Cheminée',
  'Garage', 'Parking', 'Sécurité', 'Conciergerie',
  'Cuisine équipée', 'Meublé', 'Non meublé',
]

const mediaOptions = [
  { key: 'photos', label: 'Avec photos' },
  { key: 'video', label: 'Avec vidéo' },
  { key: '3d', label: 'Visite 3D' },
]

const sortOptions = [
  { value: 'recommande', label: 'Recommandé' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'surface-asc', label: 'Surface croissante' },
  { value: 'surface-desc', label: 'Surface décroissante' },
  { value: 'prix-m2-asc', label: 'Prix au m² croissant' },
  { value: 'prix-m2-desc', label: 'Prix au m² décroissant' },
  { value: 'recent', label: 'Plus récent' },
]

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

const nbhdList = ['Guéliz', 'Hivernage', 'Palmeraie', 'Médina', 'Agdal', 'Targa', 'Amelkis', 'Route de l\'Ourika', 'Route de Fès', 'Route d\'Amizmiz', 'M Avenue']

/* ───────────────────── helper functions ───────────────────── */

function getActiveFilterChips(filters: Filters): { key: string; label: string; onRemove: () => void }[] {
  const chips: { key: string; label: string; onRemove: () => void }[] = []
  if (filters.searchQuery) chips.push({ key: 'search', label: `Recherche: ${filters.searchQuery}`, onRemove: () => { } })
  filters.neighborhoods.forEach(n => chips.push({ key: `nbhd-${n}`, label: n, onRemove: () => { } }))
  filters.types.forEach(t => chips.push({ key: `type-${t}`, label: t, onRemove: () => { } }))
  if (filters.priceMin || filters.priceMax) chips.push({ key: 'price', label: `Prix: ${filters.priceMin || '0'} - ${filters.priceMax || '∞'} €`, onRemove: () => { } })
  if (filters.surfaceMin || filters.surfaceMax) chips.push({ key: 'surface', label: `Surface: ${filters.surfaceMin || '0'} - ${filters.surfaceMax || '∞'} m²`, onRemove: () => { } })
  if (filters.bedroomsMin || filters.bedroomsMax) chips.push({ key: 'bedrooms', label: `Chambres: ${filters.bedroomsMin || '0'} - ${filters.bedroomsMax || '∞'}`, onRemove: () => { } })
  if (filters.roomsMin || filters.roomsMax) chips.push({ key: 'rooms', label: `Pièces: ${filters.roomsMin || '0'} - ${filters.roomsMax || '∞'}`, onRemove: () => { } })
  filters.statuses.forEach(s => chips.push({ key: `status-${s}`, label: statusOptions.find(o => o.key === s)?.label || s, onRemove: () => { } }))
  filters.amenities.forEach(a => chips.push({ key: `amenity-${a}`, label: a, onRemove: () => { } }))
  filters.media.forEach(m => chips.push({ key: `media-${m}`, label: mediaOptions.find(o => o.key === m)?.label || m, onRemove: () => { } }))
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
  const priceDisplay = formatPrice(property.priceEUR)
  const image = property.images[0] || '/property-01.jpg'

  return (
    <div className="bg-white rounded-card border border-border-warm shadow-card hover:shadow-card-hover transition-all duration-250 overflow-hidden group flex flex-col sm:flex-row">
      <Link to={`/property/${property.slug}`} className="relative sm:w-[40%] aspect-[3/2] sm:aspect-auto overflow-hidden flex-shrink-0">
        <img src={image} alt={property.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400" loading="lazy" />
        <span className="absolute top-3 left-3 bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded">
          {property.transaction === 'sale' ? 'À vendre' : 'À louer'}
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
          <Link to={`/property/${property.slug}`}>
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

function MapView({ properties, hoveredId, onHover }: { properties: Property[]; hoveredId: string | null; onHover: (id: string | null) => void }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const popupsRef = useRef<maplibregl.Popup[]>([])
  const navigate = useNavigate()
  const { formatPrice } = useCurrency()

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [-7.98, 31.62],
      zoom: 11.5,
      interactive: true,
      attributionControl: false,
    })

    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

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
  }, [properties.length === 0 ? 0 : properties[0].slug])

  useEffect(() => {
    if (!map.current) return
    markersRef.current.forEach(m => m.remove())
    popupsRef.current.forEach(p => p.remove())
    markersRef.current = []
    popupsRef.current = []

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

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 18, maxWidth: '280px' })
        .setHTML(`<div style="font-family:Inter,sans-serif;cursor:pointer;" onclick="window.location.href='/property/${p.slug}'">
          <img src="${p.images[0]}" style="width:100%;height:120px;object-fit:cover;border-radius:10px 10px 0 0;display:block;" />
          <div style="padding:12px;background:white;border-radius:0 0 10px 10px;">
            <p style="color:#B5533A;font-size:15px;font-weight:700;margin:0 0 4px 0;">${formatPrice(p.priceEUR)}</p>
            <p style="color:#1E1E1E;font-size:13px;font-weight:600;margin:0 0 2px 0;">${p.neighborhood}, Marrakech</p>
            <p style="color:#6E6259;font-size:12px;margin:0 0 6px 0;">${p.surface} m² · ${p.rooms} pièces · ${p.bedrooms} chambres</p>
          </div>
        </div>`)

      el.addEventListener('mouseenter', () => { onHover(p.slug); popup.setLngLat([p.longitude, p.latitude]).addTo(map.current!) })
      el.addEventListener('mouseleave', () => { onHover(null); popup.remove() })
      el.addEventListener('click', (e: Event) => { e.stopPropagation(); navigate(`/property/${p.slug}`) })

      markersRef.current.push(marker)
      popupsRef.current.push(popup)
    })
  }, [properties, hoveredId])

  useEffect(() => {
    if (!map.current || !hoveredId) return
    const target = properties.find(p => p.slug === hoveredId)
    if (target) map.current.easeTo({ center: [target.longitude, target.latitude], zoom: Math.max(map.current.getZoom(), 13), duration: 400 })
  }, [hoveredId])

  return <div ref={mapContainer} className="w-full h-full" />
}

/* ════════════════════════════════════════
   PropertyCardCompact — para modo Carte
   ════════════════════════════════════════ */

function PropertyCardCompact({ property, isHovered = false }: { property: Property; isHovered?: boolean }) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const { formatPrice } = useCurrency()
  const image = property.images[0] || '/property-01.jpg'

  return (
    <Link to={`/property/${property.slug}`} className={cn(
      "flex gap-3 bg-white rounded-xl border border-border-warm p-2 hover:shadow-md transition-all duration-200 cursor-pointer",
      isHovered && "border-terracotta shadow-md ring-1 ring-terracotta/20"
    )}>
      <div className="relative w-[100px] h-[80px] flex-shrink-0 rounded-lg overflow-hidden">
        <img src={image} alt={property.title} className="w-full h-full object-cover" loading="lazy" />
        <span className="absolute top-1 left-1 bg-palm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">{property.transaction === 'sale' ? 'À vendre' : 'À louer'}</span>
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
  const priceDisplay = formatPrice(property.priceEUR)
  const image = property.images[0] || '/property-01.jpg'

  return (
    <div className={cn(
      "bg-white rounded-card border border-border-warm shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-250 overflow-hidden group",
      isHovered && "border-terracotta shadow-card-hover -translate-y-1"
    )}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={`/property/${property.slug}`}>
          <img src={image} alt={property.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400" loading="lazy" />
        </Link>
        <span className="absolute top-3 left-3 bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded">
          {property.transaction === 'sale' ? 'À vendre' : 'À louer'}
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
        <Link to={`/property/${property.slug}`}>
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
        <Link to={`/property/${property.slug}`} className="inline-block mt-3 text-terracotta text-[14px] font-inter font-medium hover:underline">
          Voir le bien →
        </Link>
      </div>
    </div>
  )
}

/* ───────────────────── Mobile filter drawer ───────────────────── */

function MobileFilterDrawer({ filters, setFilters, onApply, onReset, resultCount }: {
  filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>; onApply: () => void; onReset: () => void; resultCount: number
}) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters(f => ({ ...f, [key]: value }))

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-warm">
        <button onClick={onReset} className="text-text-secondary text-[14px]">Réinitialiser</button>
        <span className="font-inter text-[16px] font-semibold text-midnight">Filtres</span>
        <button onClick={onApply}><X size={24} className="text-text-primary" /></button>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Transaction */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Transaction</label>
          <div className="flex border border-border-warm rounded-lg overflow-hidden">
            <button onClick={() => update('transaction', 'sale')} className={cn('flex-1 py-2 text-[14px] font-medium', filters.transaction === 'sale' ? 'bg-terracotta text-white' : 'bg-white text-text-primary')}>Acheter</button>
            <button onClick={() => update('transaction', 'rent')} className={cn('flex-1 py-2 text-[14px] font-medium', filters.transaction === 'rent' ? 'bg-terracotta text-white' : 'bg-white text-text-primary')}>Louer</button>
          </div>
        </div>
        {/* Localisation */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Localisation</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text" placeholder="Ville, quartier..."
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
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Type de bien</label>
          <div className="space-y-2">
            {typeOptions.map(t => (
              <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                <div className={cn('w-4 h-4 border rounded flex items-center justify-center', filters.types.includes(t.label) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
                  {filters.types.includes(t.label) && <Check size={10} className="text-white" />}
                </div>
                <span className="text-[14px] text-text-primary">{t.label}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Budget */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Budget (€)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={filters.priceMin} onChange={e => update('priceMin', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px] focus:border-terracotta focus:outline-none" />
            <input type="number" placeholder="Max" value={filters.priceMax} onChange={e => update('priceMax', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px] focus:border-terracotta focus:outline-none" />
          </div>
        </div>
        {/* Surface */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Surface habitable (m²)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={filters.surfaceMin} onChange={e => update('surfaceMin', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px] focus:border-terracotta focus:outline-none" />
            <input type="number" placeholder="Max" value={filters.surfaceMax} onChange={e => update('surfaceMax', e.target.value)} className="w-full h-11 border border-border-warm rounded-lg px-3 text-[14px] focus:border-terracotta focus:outline-none" />
          </div>
        </div>
        {/* Pièces */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Pièces</label>
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
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Chambres</label>
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
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Statut</label>
          {statusOptions.map(s => (
            <label key={s.key} className="flex items-center gap-2 py-1 cursor-pointer">
              <div className={cn('w-4 h-4 border rounded flex items-center justify-center', filters.statuses.includes(s.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
                {filters.statuses.includes(s.key) && <Check size={10} className="text-white" />}
              </div>
              <span className="text-[14px] text-text-primary">{s.label}</span>
            </label>
          ))}
        </div>
        {/* Équipements */}
        <div className="mb-6">
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Équipements</label>
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
          <label className="font-inter text-[14px] font-semibold text-midnight mb-2 block">Médias</label>
          {mediaOptions.map(m => (
            <label key={m.key} className="flex items-center gap-2 py-1 cursor-pointer">
              <div className={cn('w-4 h-4 border rounded flex items-center justify-center', filters.media.includes(m.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
                {filters.media.includes(m.key) && <Check size={10} className="text-white" />}
              </div>
              <span className="text-[14px] text-text-primary">{m.label}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Sticky footer */}
      <div className="border-t border-border-warm p-4">
        <button onClick={onApply} className="w-full h-12 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.02] transition-transform">
          Voir les {resultCount} résultats
        </button>
      </div>
    </div>
  )
}

/* ───────────────────── main Search component ───────────────────── */

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const isRentRoute = location.pathname === '/louer'

  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    transaction: isRentRoute ? 'rent' : 'sale',
  }))
  const [sort, setSort] = useState('recommande')
  const [view, setView] = useState<ViewMode>('grid')
  const [mapVisible, setMapVisible] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [hoveredMapSlug, setHoveredMapSlug] = useState<string | null>(null)
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  // Update transaction when route changes
  useEffect(() => {
    setFilters(f => ({ ...f, transaction: isRentRoute ? 'rent' : 'sale' }))
  }, [isRentRoute])

  useEffect(() => {
    setLoading(true)
    const typesMapped = filters.types.map(t => {
      const map: Record<string, string> = {
        'Villa': 'villa', 'Appartement': 'apartment', 'Riad': 'riad',
        'Maison de prestige': 'prestige', 'Terrain': 'land', 'Rooftop': 'rooftop'
      }
      return map[t]
    }).filter(Boolean) as string[]

    getProperties({
      transaction: filters.transaction,
      types: typesMapped,
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
      setLoading(false)
    })
  }, [filters, sort])

  const filtered = allProperties

  const activeChips = useMemo(() => getActiveFilterChips(filters), [filters])

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
    ? `${filtered.length} bien${filtered.length > 1 ? 's' : ''} à vendre à Marrakech`
    : `${filtered.length} bien${filtered.length > 1 ? 's' : ''} à louer à Marrakech`

  const pageTitle = filters.transaction === 'sale' ? 'Acheter' : 'Louer'

  // Handle map pin hover syncing
  const handleMapHover = useCallback((slug: string | null) => {
    setHoveredMapSlug(slug)
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
                Accueil &gt; {pageTitle} &gt; Marrakech
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
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                <button onClick={() => setMapVisible(!mapVisible)} className={cn('hidden lg:flex w-9 h-9 items-center justify-center', mapVisible ? 'bg-terracotta text-white' : 'bg-white text-text-secondary hover:bg-cream')} title="Carte">
                  <Map size={16} />
                </button>
              </div>

              {/* Alert button */}
              <button className="hidden md:flex items-center gap-1.5 h-9 px-3 border border-border-warm rounded-lg text-[13px] font-medium text-text-primary hover:border-terracotta transition-colors">
                <Bell size={14} />
                <span>Créer une alerte</span>
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
                    else if (chip.key.startsWith('nbhd-')) toggleArrayValue('neighborhoods', chip.label)
                    else if (chip.key.startsWith('type-')) toggleArrayValue('types', chip.label)
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
                Tout effacer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Content Area ─── */}
      <div className={cn("mx-auto flex", mapVisible ? "max-w-none" : "max-w-[1600px]")}>
        {/* Filter Sidebar — desktop only, hidden when map is visible */}
        <aside className={cn("hidden lg:block w-[300px] flex-shrink-0 bg-white border-r border-border-warm sticky top-[calc(72px+80px)] h-[calc(100dvh-152px)] overflow-y-auto transition-all duration-300", mapVisible && "lg:hidden")}>
          <div className="p-5">
            {/* Transaction toggle */}
            <div className="mb-5">
              <div className="flex border border-border-warm rounded-lg overflow-hidden">
                <button
                  onClick={() => { updateFilter('transaction', 'sale'); navigate('/acheter') }}
                  className={cn('flex-1 py-2 text-[14px] font-medium transition-colors', filters.transaction === 'sale' ? 'bg-terracotta text-white' : 'bg-white text-text-primary')}
                >Acheter</button>
                <button
                  onClick={() => { updateFilter('transaction', 'rent'); navigate('/louer') }}
                  className={cn('flex-1 py-2 text-[14px] font-medium transition-colors', filters.transaction === 'rent' ? 'bg-terracotta text-white' : 'bg-white text-text-primary')}
                >Louer</button>
              </div>
            </div>

            {/* Localisation */}
            <FilterSection title="Localisation">
              <div className="relative mb-3">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text" placeholder="Ville, quartier..."
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
            <FilterSection title="Type de bien">
              {typeOptions.map(t => (
                <label key={t.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('types', t.label)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.types.includes(t.label) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.types.includes(t.label) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{t.label}</span>
                </label>
              ))}
            </FilterSection>

            {/* Budget */}
            <FilterSection title="Budget (€)">
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.priceMin} onChange={e => updateFilter('priceMin', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
                <input type="number" placeholder="Max" value={filters.priceMax} onChange={e => updateFilter('priceMax', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
              </div>
            </FilterSection>

            {/* Surface habitable */}
            <FilterSection title="Surface habitable (m²)">
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.surfaceMin} onChange={e => updateFilter('surfaceMin', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
                <input type="number" placeholder="Max" value={filters.surfaceMax} onChange={e => updateFilter('surfaceMax', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
              </div>
            </FilterSection>

            {/* Surface terrain */}
            <FilterSection title="Surface terrain (m²)">
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.landMin} onChange={e => updateFilter('landMin', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
                <input type="number" placeholder="Max" value={filters.landMax} onChange={e => updateFilter('landMax', e.target.value)} className="w-full h-10 border border-border-warm rounded-lg px-3 text-[13px] focus:border-terracotta focus:outline-none" />
              </div>
            </FilterSection>

            {/* Pièces */}
            <FilterSection title="Pièces">
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
            <FilterSection title="Chambres">
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
            <FilterSection title="Statut" defaultOpen={false}>
              {statusOptions.map(s => (
                <label key={s.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('statuses', s.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.statuses.includes(s.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.statuses.includes(s.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{s.label}</span>
                </label>
              ))}
            </FilterSection>

            {/* Vue */}
            <FilterSection title="Vue" defaultOpen={false}>
              {viewOptions.map(v => (
                <label key={v.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('views', v.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.views.includes(v.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.views.includes(v.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{v.label}</span>
                </label>
              ))}
            </FilterSection>

            {/* Style */}
            <FilterSection title="Style" defaultOpen={false}>
              {styleOptions.map(s => (
                <label key={s.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('styles', s.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.styles.includes(s.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.styles.includes(s.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{s.label}</span>
                </label>
              ))}
            </FilterSection>

            {/* Équipements */}
            <FilterSection title="Équipements" defaultOpen={false}>
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
            <FilterSection title="Médias" defaultOpen={false}>
              {mediaOptions.map(m => (
                <label key={m.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <div
                    onClick={() => toggleArrayValue('media', m.key)}
                    className={cn('w-4 h-4 border rounded flex items-center justify-center cursor-pointer', filters.media.includes(m.key) ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
                  >
                    {filters.media.includes(m.key) && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-[13px] text-text-primary">{m.label}</span>
                </label>
              ))}
            </FilterSection>

            {/* Footer */}
            <div className="mt-6 space-y-2">
              <button onClick={resetFilters} className="w-full h-10 text-text-secondary text-[13px] font-medium hover:text-terracotta transition-colors">
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        </aside>

        {/* Center: Results */}
        <main className={cn("min-w-0 p-4 lg:p-6", mapVisible ? "lg:w-[420px] lg:flex-shrink-0" : "flex-1")}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
              <p className="text-text-secondary mt-4">Chargement des annonces...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MapPin size={64} className="text-sand/60 mb-4" />
              <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-2">Aucun bien ne correspond à vos critères</h3>
              <p className="text-text-secondary text-[15px] font-inter max-w-md mb-6">
                Essayez d'élargir votre recherche ou de modifier vos filtres pour trouver plus de résultats.
              </p>
              <button onClick={resetFilters} className="h-11 px-6 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.02] transition-transform">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              {/* Desktop map mode — compact list alongside big map */}
              {mapVisible && (
                <div className="hidden lg:block space-y-3">
                  {filtered.map(p => (
                    <div key={p.slug} onMouseEnter={() => handleMapHover(p.slug)} onMouseLeave={() => handleMapHover(null)}>
                      <PropertyCardCompact property={p} isHovered={hoveredMapSlug === p.slug} />
                    </div>
                  ))}
                </div>
              )}

              {/* Grid view */}
              {view === 'grid' && (
                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", mapVisible && "lg:hidden")}>
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
                  <button onClick={() => setView('grid')} className="absolute top-4 right-4 z-30 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center">
                    <X size={20} />
                  </button>
                  <MapView properties={filtered} hoveredId={hoveredMapSlug} onHover={handleMapHover} />
                  {/* Bottom sheet with cards */}
                  <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl max-h-[35vh] overflow-y-auto p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
                    <div className="w-10 h-1 bg-border-warm rounded-full mx-auto mb-3" />
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
                      {filtered.map(p => (
                        <div key={p.slug} className="snap-start flex-shrink-0 w-[280px]">
                          <PropertyCardCompact property={p} isHovered={hoveredMapSlug === p.slug} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right: Map (desktop) */}
        {mapVisible && (
          <aside className="hidden lg:block flex-1 sticky top-[calc(72px+80px)] h-[calc(100dvh-152px)] border-l border-border-warm">
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
          />
        </div>
      )}
    </div>
  )
}
