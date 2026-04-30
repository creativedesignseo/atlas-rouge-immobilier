import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import {
  MapPin, Heart, Share2, X, Maximize, Bed, Bath, Home,
  Waves, Car, Check, Phone, MessageCircle, User,
  ChevronDown, ChevronUp, ArrowRight, Camera, Box,
  TreePine, Info, FileText, Calculator,
  Landmark, Percent, Briefcase
} from 'lucide-react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getPropertyBySlug, getSimilarProperties } from '@/services/property.service'
import { submitContactForm } from '@/services/contact.service'
import { useFavorites } from '@/hooks/useFavorites'
import { useCurrency } from '@/hooks/useCurrency'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import PropertyCard from '@/components/PropertyCard'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/storage'
import type { Property } from '@/data/properties'

/* ───────────────────── constants ───────────────────── */

const amenityIconMap: Record<string, React.ReactNode> = {
  'Piscine': <Waves size={18} />,
  'Piscine chauffee': <Waves size={18} />,
  'Jardin': <TreePine size={18} />,
  'Jardin paysager': <TreePine size={18} />,
  'Terrasse': <Maximize size={18} />,
  'Parking': <Car size={18} />,
  'Garage': <Car size={18} />,
  'Garage double': <Car size={18} />,
  'Climatisation': <WindIcon />,
  'Cheminée': <FlameIcon />,
  'Ascenseur': <ArrowUpIcon />,
  'Balcon': <Maximize size={18} />,
  'Cuisine équipée': <KitchenIcon />,
  'Domotique': <Box size={18} />,
  'Salle de fitness': <DumbbellIcon />,
  'Hammam': <Waves size={18} />,
  'Tennis': <BallIcon />,
  'Vue Atlas': <MountainIcon />,
  'Patio': <Home size={18} />,
  'Terrasse panoramique': <Maximize size={18} />,
  'Fontaine centrale': <Waves size={18} />,
  'Zelliges traditionnels': <StarIcon />,
  'Vue golf': <FlagIcon />,
  'Vue dégagée': <EyeIcon />,
  'Piscine à débordement': <Waves size={18} />,
  'Vue panoramique': <MountainIcon />,
  'Salon marocain': <Home size={18} />,
  'Parking 2 voitures': <Car size={18} />,
  'Panneaux solaires': <SunIcon />,
  'Système de sécurité': <ShieldIcon />,
  'Portail électrique': <GateIcon />,
  'Chauffage au sol': <FlameIcon />,
}

const guideLinks = [
  { labelKey: 'notaire', href: '/guide-achat-maroc#notaire', icon: <Landmark size={20} /> },
  { labelKey: 'frais', href: '/guide-achat-maroc#frais', icon: <Calculator size={20} /> },
  { labelKey: 'credit', href: '/guide-achat-maroc#credit', icon: <Percent size={20} /> },
  { labelKey: 'fiscalite', href: '/guide-achat-maroc#fiscalite', icon: <FileText size={20} /> },
  { labelKey: 'gestion', href: '/guide-achat-maroc#gestion', icon: <Briefcase size={20} /> },
]

function canUseWebGL() {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return Boolean(
    canvas.getContext('webgl2') ||
    canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl')
  )
}

/* ───────────────────── small icon components ───────────────────── */

function WindIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /></svg>) }
function FlameIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.072-2.143-3.5-6 .5 2.5 0 4.5-1.5 6-1.071 1.072-2.5 2.5-2.5 4.5a5 5 0 0 0 10 0Z" /><path d="M12.5 18a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-2.072-2.143-3.5-6 .5 2.5 0 4.5-1.5 6-1.071 1.072-2.5 2.5-2.5 4.5a5 5 0 0 0 10 0Z" /></svg>) }
function ArrowUpIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m16 12-4-4-4 4" /><path d="M12 16V8" /></svg>) }
function KitchenIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18" /><path d="M3 11h18" /><path d="M6 21v-10a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /></svg>) }
function DumbbellIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11" /><path d="m14 2 4 4" /><path d="m2 14 4 4" /><path d="M17.5 2.5 21 6" /><path d="M3 17.5 6.5 21" /><circle cx="14" cy="10" r="2" /><circle cx="10" cy="14" r="2" /></svg>) }
function BallIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M4.9 4.9l14.2 14.2" /><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20" /><path d="M2 12h20" /></svg>) }
function MountainIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" /></svg>) }
function StarIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>) }
function FlagIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>) }
function EyeIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>) }
function ShieldIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>) }
function SunIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>) }
function GateIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M5 10h16" /><path d="M9 21v-6h2v6" /><path d="M13 21v-6h2v6" /></svg>) }

/* ───────────────────── Gallery Lightbox ───────────────────── */

function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const goPrev = () => setCurrent(c => (c - 1 + images.length) % images.length)
  const goNext = () => setCurrent(c => (c + 1) % images.length)

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX }
  const onTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev() }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"><X size={20} /></button>
      <button onClick={goPrev} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full items-center justify-center text-white hover:bg-white/20 transition-colors z-10"><ChevronUp size={20} className="-rotate-90" /></button>
      <button onClick={goNext} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full items-center justify-center text-white hover:bg-white/20 transition-colors z-10"><ChevronUp size={20} className="rotate-90" /></button>
      <div className="text-center w-full px-4">
        <img src={images[current]} alt={`Photo ${current + 1}`} className="max-w-[95vw] max-h-[80vh] object-contain rounded-lg mx-auto" draggable={false} />
        <p className="text-white/60 text-[14px] mt-3 font-inter">{current + 1} / {images.length}</p>
      </div>
    </div>
  )
}

/* ───────────────────── Location Map (MapLibre GL) ───────────────────── */

function LocationMap({ property }: { property: Property }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [mapError, setMapError] = useState(false)
  const { t } = useTranslation('property')

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
        center: [property.longitude, property.latitude],
        zoom: 14,
        interactive: true,
        attributionControl: false,
      })
    } catch (error) {
      console.error('Failed to initialize property detail map:', error)
      setMapError(true)
      map.current = null
      return
    }

    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.current.on('error', (event) => {
      console.error('Property detail map error:', event.error)
    })

    const el = document.createElement('div')
    el.innerHTML = `<div style="width: 80px; height: 80px; background: rgba(181,83,58,0.2); border: 2px solid #B5533A; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><div style="width: 12px; height: 12px; background: #B5533A; border-radius: 50%;"></div></div>`
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([property.longitude, property.latitude]).addTo(map.current)

    return () => {
      marker.remove()
      map.current?.remove()
      map.current = null
    }
  }, [property.latitude, property.longitude])

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
      {mapError ? (
        <div className="w-full h-full bg-cream-warm flex items-center justify-center p-6 text-center">
          <div>
            <MapPin size={36} className="mx-auto text-terracotta mb-3" />
            <p className="font-inter text-[15px] font-semibold text-midnight">{property.neighborhood}, Marrakech</p>
            <p className="font-inter text-[13px] text-text-secondary mt-1">{t('exactAddressOnRequest')}</p>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full" />
      )}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
          <p className="text-midnight font-inter text-[14px] font-medium">{property.neighborhood}, Marrakech</p>
          <p className="text-text-secondary text-[12px] font-inter mt-1">{t('exactAddressOnRequest')}</p>
        </div>
        <button className="bg-terracotta text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors pointer-events-auto shadow-md">
          {t('getExactAddress')}
        </button>
      </div>
    </div>
  )
}

/* ───────────────────── Contact Panel ───────────────────── */

function ContactPanel({ property, settings }: { property: Property; settings: Record<string, string> | null }) {
  const { t } = useTranslation('property')
  const agentName = settings?.agent_name || 'Sophie Martin'
  const agentTitle = settings?.agent_title || t('agent')
  const phone = settings?.phone || '+212 524 00 00 00'
  const whatsapp = settings?.whatsapp || '+212 600 00 00 00'
  const defaultMessage = t('contact.defaultMessage', { title: property.title })

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: defaultMessage })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message || !acceptedTerms) return
    setSubmitting(true)
    setError('')
    const result = await submitContactForm({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: t('contact.title'),
      message: formData.message,
      propertySlug: property.slug,
    })
    setSubmitting(false)
    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error || t('errorOccurred'))
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-card border border-border-warm shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
        <h3 className="font-playfair text-[18px] font-semibold text-midnight mb-1">Atlas Rouge Immobilier</h3>
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-5 mt-4">
          <Check size={22} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-inter text-[15px] font-medium text-green-800 mb-1">{t('messageSent')}</p>
            <p className="font-inter text-[14px] text-green-700">{t('messageSentDesc')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card border border-border-warm shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
      <h3 className="font-playfair text-[18px] font-semibold text-midnight mb-1">Atlas Rouge Immobilier</h3>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-cream-warm flex items-center justify-center">
          <User size={22} className="text-text-secondary" />
        </div>
        <div>
          <p className="font-inter text-[14px] font-semibold text-text-primary">{agentName}</p>
          <p className="font-inter text-[13px] text-text-secondary">{agentTitle}</p>
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <input type="text" placeholder={`${t('contact.namePlaceholder')} *`} required value={formData.name}
          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
          className="w-full h-11 border border-border-warm rounded-lg px-4 text-[14px] focus:border-terracotta focus:outline-none" />
        <input type="email" placeholder={`${t('contact.emailPlaceholder')} *`} required value={formData.email}
          onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
          className="w-full h-11 border border-border-warm rounded-lg px-4 text-[14px] focus:border-terracotta focus:outline-none" />
        <input type="tel" placeholder={t('contact.phonePlaceholder')} value={formData.phone}
          onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
          className="w-full h-11 border border-border-warm rounded-lg px-4 text-[14px] focus:border-terracotta focus:outline-none" />
        <textarea placeholder={`${t('contact.messagePlaceholder')} *`} required rows={4} value={formData.message}
          onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
          className="w-full border border-border-warm rounded-lg px-4 py-3 text-[14px] focus:border-terracotta focus:outline-none resize-none" />

        {error && <p className="text-red-600 text-[13px] font-inter">{error}</p>}

        <label className="flex items-start gap-2 cursor-pointer">
          <div onClick={() => setAcceptedTerms(!acceptedTerms)}
            className={cn('w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer', acceptedTerms ? 'bg-terracotta border-terracotta' : 'border-border-warm')}>
            {acceptedTerms && <Check size={10} className="text-white" />}
          </div>
          <span className="text-[12px] text-text-secondary font-inter leading-tight">{t('iAcceptTerms')}</span>
        </label>

        <button type="submit" disabled={!acceptedTerms || submitting}
          className="w-full h-12 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? t('contact.sending') : t('sendMyRequest')}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        <button className="w-full h-10 border border-terracotta text-terracotta font-inter text-[13px] font-medium rounded-lg hover:bg-terracotta/5 transition-colors">
          {t('requestVisit')}
        </button>
        <button className="w-full h-10 border border-border-warm text-text-primary font-inter text-[13px] font-medium rounded-lg hover:bg-cream transition-colors">
          {t('scheduleCallback')}
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#25D366] text-white font-inter text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity">
          <MessageCircle size={16} /> WhatsApp
        </a>
        <a href={`tel:${phone.replace(/\s/g, '')}`}
          className="flex-1 flex items-center justify-center gap-2 h-10 border border-border-warm text-text-primary font-inter text-[13px] font-medium rounded-lg hover:bg-cream transition-colors">
          <Phone size={16} /> {t('call')}
        </a>
      </div>
    </div>
  )
}

/* ───────────────────── Spec Card ───────────────────── */

function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="w-14 h-14 rounded-full bg-cream-warm flex items-center justify-center text-terracotta">{icon}</div>
      <div>
        <p className="text-[11px] text-text-secondary font-inter uppercase tracking-wide">{label}</p>
        <p className="text-[18px] font-bold text-midnight font-inter">{value}</p>
      </div>
    </div>
  )
}

/* ───────────────────── Amenity Item ───────────────────── */

function AmenityItem({ label }: { label: string }) {
  const icon = amenityIconMap[label] || <Check size={18} />
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-palm">{icon}</span>
      <span className="text-[14px] text-text-primary font-inter">{label}</span>
    </div>
  )
}

/* ───────────────────── main PropertyDetail component ───────────────────── */

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation('property')
  const { t: tc } = useTranslation('common')
  const { toggleFavorite, isFavorite } = useFavorites()
  const { formatPrice } = useCurrency()
  const { settings } = useSiteSettings()
  const { path } = useLang()

  const [property, setProperty] = useState<Property | undefined>(undefined)
  const [similarProperties, setSimilarProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const guideLinkLabels: Record<string, string> = {
    notaire: t('guideLabels.notaire', { defaultValue: 'Notaire ou Adoul' }),
    frais: t('guideLabels.frais', { defaultValue: "Frais d'acquisition" }),
    credit: t('guideLabels.credit', { defaultValue: 'Crédit au Maroc pour étrangers' }),
    fiscalite: t('guideLabels.fiscalite', { defaultValue: 'Fiscalité' }),
    gestion: t('guideLabels.gestion', { defaultValue: 'Gestion locative' }),
  }

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getPropertyBySlug(slug)
      .then((p) => {
        setProperty(p || undefined)
        if (p) {
          getSimilarProperties(p, 3)
            .then(setSimilarProperties)
            .catch((err) => {
              console.error('Failed to load similar properties:', err)
              setSimilarProperties([])
            })
        } else {
          setSimilarProperties([])
        }
      })
      .catch((err) => {
        console.error('Failed to load property:', err)
        setProperty(undefined)
        setSimilarProperties([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Info size={64} className="text-sand/60 mb-4" />
        <h1 className="font-playfair text-[32px] font-semibold text-midnight mb-3">{t('propertyNotFound')}</h1>
        <p className="text-text-secondary text-[16px] font-inter mb-6">{t('propertyNotFoundDesc')}</p>
        <Link to={path('/acheter')}
          className="h-12 px-6 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2">
          <ArrowRight size={18} /> {t('backToSearch')}
        </Link>
      </div>
    )
  }

  const rawImages = property.images.length > 0 ? property.images : ['property-01.jpg']
  const images = rawImages.map(img => getImageUrl(img, { width: 1200 }))
  const mainImage = getImageUrl(rawImages[0], { width: 900, height: 600, resize: 'cover' })
  const thumbImages = rawImages.slice(1, 5)
  const hasMoreImages = images.length > 5
  const remainingCount = Math.max(0, images.length - 5)
  const pricePerM2 = property.surface > 0 ? Math.round(property.priceEUR / property.surface) : 0
  const descriptionFull = property.description
  const shouldTruncate = descriptionFull.length > 300
  const descriptionShort = shouldTruncate && !descriptionExpanded ? descriptionFull.slice(0, 300) + '...' : descriptionFull

  return (
    <div className="min-h-[100dvh] bg-cream">
      {/* ─── Gallery ─── */}
      <section className="bg-white">
        <div className="hidden md:flex h-[500px] gap-1">
          <div className="relative w-[60%] overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}>
            <img src={mainImage} alt={property.title} className="w-full h-full object-cover hover:brightness-105 transition-all" />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-palm text-white text-[11px] font-semibold px-2.5 py-1 rounded">
                {property.transaction === 'sale' ? t('forSale') : t('forRent')}
              </span>
              {property.isExclusive && <span className="bg-gold text-midnight text-[11px] font-semibold px-2.5 py-1 rounded">{t('exclusiveListing')}</span>}
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => toggleFavorite(property.slug)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <Heart size={20} className={isFavorite(property.slug) ? 'fill-terracotta text-terracotta' : 'text-text-secondary'} />
              </button>
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <Share2 size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="absolute bottom-4 right-4 bg-white/90 text-midnight text-[13px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Camera size={14} /> 1 / {images.length}
            </div>
            {images.length > 1 && (
              <button onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
                className="absolute bottom-4 left-4 bg-white/90 text-midnight text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-1.5">
                <Camera size={14} /> {t('seeAllPhotos')}
              </button>
            )}
          </div>
          {thumbImages.length > 0 && (
            <div className="w-[40%] grid grid-cols-2 grid-rows-2 gap-1">
              {thumbImages.map((img, i) => (
                <div key={i} className="relative overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true) }}>
                  <img src={getImageUrl(img, { width: 600, height: 450, resize: 'cover' })} alt={`${property.title} ${i + 2}`} className="w-full h-full object-cover hover:brightness-110 transition-all" />
                  {i === 3 && hasMoreImages && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-inter text-[16px] font-medium">
                      +{remainingCount} {t('photos')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:hidden relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {images.map((img, i) => (
              <div key={i} className="snap-start shrink-0 w-full aspect-[4/3] relative cursor-pointer"
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}>
                <img src={img} alt={`${property.title} ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
                {i === 0 && (
                  <>
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded">
                        {property.transaction === 'sale' ? t('forSale') : t('forRent')}
                      </span>
                      {property.isExclusive && <span className="bg-gold text-midnight text-[11px] font-semibold px-2 py-1 rounded">{t('exclusiveListing')}</span>}
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(property.slug) }} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Heart size={18} className={isFavorite(property.slug) ? 'fill-terracotta text-terracotta' : 'text-text-secondary'} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <>
              <div className="flex justify-center gap-1.5 mt-2">{images.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-secondary/30" />)}</div>
              <button onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
                className="absolute bottom-6 left-3 bg-white/90 text-midnight text-[12px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Camera size={12} /> {images.length} {t('photos')}
              </button>
            </>
          )}
        </div>
      </section>

      {lightboxOpen && <Lightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />}

      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[65%]">
            <div className="mb-6">
              <p className="text-terracotta font-inter text-[32px] font-semibold mb-1">{formatPrice(property.priceEUR)}</p>
              {pricePerM2 > 0 && <p className="text-text-secondary text-[14px] font-inter mb-2">{new Intl.NumberFormat('fr-FR').format(pricePerM2)} €/m²</p>}
              <h1 className="font-playfair text-[28px] font-medium text-midnight mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-text-secondary text-[15px] font-inter mb-2">
                <MapPin size={16} /> <span>{property.neighborhood}, Marrakech</span>
              </div>
              <p className="text-text-secondary text-[13px] font-inter">
                {t('listingDate')} {new Date(property.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="bg-white rounded-card border border-border-warm p-5 mb-6">
              <div className="flex flex-wrap gap-y-4 gap-x-6">
                <SpecCard icon={<Maximize size={22} />} label={t('surfaceLiving')} value={`${property.surface} m²`} />
                {property.landSurface && property.landSurface > 0 && <SpecCard icon={<TreePine size={22} />} label={t('surfaceLand')} value={`${property.landSurface} m²`} />}
                <SpecCard icon={<Home size={22} />} label={t('rooms')} value={`${property.rooms}`} />
                <SpecCard icon={<Bed size={22} />} label={t('bedrooms')} value={`${property.bedrooms}`} />
                <SpecCard icon={<Bath size={22} />} label={t('bathrooms')} value={`${property.bathrooms}`} />
                <SpecCard icon={<Waves size={22} />} label={t('pool')} value={property.amenities.some(a => a.toLowerCase().includes('piscine')) ? tc('yes') : tc('no')} />
                <SpecCard icon={<Maximize size={22} />} label={t('terrace')} value={property.amenities.some(a => a.toLowerCase().includes('terrasse')) ? tc('yes') : tc('no')} />
                <SpecCard icon={<Car size={22} />} label={t('parking')} value={property.amenities.some(a => a.toLowerCase().includes('parking') || a.toLowerCase().includes('garage')) ? tc('yes') : tc('no')} />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-3">{t('description')}</h3>
              <div className="relative">
                <p className="text-text-primary text-[16px] font-inter leading-[1.7] whitespace-pre-line">{descriptionShort}</p>
                {shouldTruncate && !descriptionExpanded && <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cream to-transparent" />}
              </div>
              {shouldTruncate && (
                <button onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="mt-2 text-terracotta text-[14px] font-medium font-inter hover:underline flex items-center gap-1">
                  {descriptionExpanded ? t('showLess') : t('readMore')}
                  {descriptionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>

            {property.highlights.length > 0 && (
              <div className="mb-8 bg-white rounded-card border border-border-warm p-6">
                <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-4">{t('whatMakesItUnique')}</h3>
                <ul className="space-y-3">
                  {property.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2Icon />
                      <span className="text-text-primary text-[15px] font-inter">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {property.amenities.length > 0 && (
              <div className="mb-8 bg-cream-warm rounded-card p-6">
                <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-4">{t('amenitiesAndServices')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {property.amenities.map(a => <AmenityItem key={a} label={a} />)}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-2">{t('location')}</h3>
              <p className="text-text-secondary text-[15px] font-inter mb-1">{property.neighborhood}, Marrakech</p>
              <p className="text-gold text-[13px] font-inter mb-4">{t('exactAddressOnRequest')}</p>
              <LocationMap property={property} />
            </div>
          </div>

          <div className="lg:w-[35%]">
            <div className="lg:sticky lg:top-[calc(72px+24px)]">
              <ContactPanel property={property} settings={settings} />
            </div>
          </div>
        </div>
      </div>

      {similarProperties.length > 0 && (
        <section className="bg-cream-warm py-12">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
            <h3 className="font-playfair text-[28px] font-medium text-midnight text-center mb-2">{t('similarProperties')}</h3>
            <p className="text-text-secondary text-[16px] font-inter text-center mb-8">{t('similarPropertiesDesc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map(p => <PropertyCard key={p.slug} property={p} />)}
            </div>
            <div className="text-center mt-8">
              <Link to={path('/acheter')} className="inline-flex items-center gap-2 text-terracotta text-[16px] font-medium font-inter hover:underline">
                {t('viewMoreListings')} <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-12">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
          <h3 className="font-playfair text-[28px] font-medium text-midnight text-center mb-2">{t('buyingGuide')}</h3>
          <p className="text-text-secondary text-[16px] font-inter text-center mb-8">{t('buyingGuideDesc')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {guideLinks.map(link => (
              <Link key={link.href} to={path(link.href)}
                className="flex items-center gap-2 bg-white border border-border-warm rounded-lg px-4 py-3 text-terracotta text-[14px] font-medium font-inter hover:border-terracotta hover:shadow-sm transition-all">
                {link.icon}
                {guideLinkLabels[link.labelKey]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-warm flex">
        <a href={`tel:${(settings?.phone || '+212524000000').replace(/\s/g, '')}`}
          className="flex-1 flex items-center justify-center gap-2 h-14 text-[14px] font-medium text-text-primary border-r border-border-warm">
          <Phone size={18} /> {t('call')}
        </a>
        <a href={`https://wa.me/${(settings?.whatsapp || '+212600000000').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 h-14 text-[14px] font-medium text-[#25D366] border-r border-border-warm">
          <MessageCircle size={18} /> WhatsApp
        </a>
        <button className="flex-[1.3] flex items-center justify-center gap-2 h-14 bg-terracotta text-white text-[14px] font-semibold">
          {t('requestVisit')}
        </button>
      </div>
    </div>
  )
}

/* ───────────────────── CheckCircle2 icon helper ───────────────────── */

function CheckCircle2Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#315C45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  )
}
