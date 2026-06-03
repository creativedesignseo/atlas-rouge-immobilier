import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLang } from '@/hooks/useLang'
import {
  MapPin, Heart, Share2, X, Check, Phone, MessageCircle, User,
  ChevronDown, ChevronUp, ArrowRight, Camera,
  Info, FileText, Calculator,
  Landmark, Percent, Briefcase
} from 'lucide-react'
// MapLibre se carga lazy desde components/property/LocationMap.tsx
// → ahorra ~1 MB de JS en la primera carga si el usuario no llega al mapa
const LocationMap = lazy(() => import('@/components/property/LocationMap'))
import { getPropertyBySlug, getSimilarProperties } from '@/services/property.service'
import { submitContactForm } from '@/services/contact.service'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import PhoneField from '@/components/forms/PhoneField'
import { useFavorites } from '@/hooks/useFavorites'
import { usePropertyPrice } from '@/hooks/usePropertyPrice'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import PropertyCard from '@/components/PropertyCard'
import { getImageUrl } from '@/lib/storage'
import { amenityLabel } from '@/lib/amenities'
import type { Property } from '@/data/properties'

/* ───────────────────── constants ───────────────────── */

const guideLinks = [
  { labelKey: 'notaire', href: '/guide-achat-maroc#notaire', icon: <Landmark size={20} /> },
  { labelKey: 'frais', href: '/guide-achat-maroc#frais', icon: <Calculator size={20} /> },
  { labelKey: 'credit', href: '/guide-achat-maroc#credit', icon: <Percent size={20} /> },
  { labelKey: 'fiscalite', href: '/guide-achat-maroc#fiscalite', icon: <FileText size={20} /> },
  { labelKey: 'gestion', href: '/guide-achat-maroc#gestion', icon: <Briefcase size={20} /> },
]

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

/* ───────────────────── Contact Panel ───────────────────── */

interface AgentInfo {
  name: string
  role: string
  photoUrl: string | null
}

function ContactPanel({ property, settings }: { property: Property; settings: Record<string, string> | null }) {
  const { t, i18n } = useTranslation('property')
  const phone = settings?.phone || '+212 524 00 00 00'
  const whatsapp = settings?.whatsapp || '+212 600 00 00 00'
  const defaultMessage = t('contact.defaultMessage', { title: property.title })

  // Agente real desde la tabla `agents` — el primer agent activo (Sofia
  // hoy; admin si en el futuro hay más). Reemplaza al placeholder "Sophie
  // Martin / Conseillère immobilière" que estaba hardcoded en site_settings.
  const [agent, setAgent] = useState<AgentInfo | null>(null)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('agents')
      .select('name, role, photo_url')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data || !data.name) return
        setAgent({
          name: data.name,
          role:
            data.role === 'admin'
              ? t('agentRole.admin')
              : data.role || t('agent'),
          photoUrl: data.photo_url,
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: defaultMessage })

  // Si el usuario no ha tocado el mensaje, re-aplicamos el defaultMessage
  // traducido al idioma actual. Esto arregla el bug que dejaba el mensaje
  // en EN cuando i18n se hidrataba con el idioma incorrecto en el primer
  // render y luego cambiaba.
  useEffect(() => {
    setFormData((prev) => {
      // Si el user ha escrito algo distinto al defaultMessage anterior,
      // respetamos su texto (no machaquemos su edición). Sólo actualizamos
      // si el message actual aún es uno de los defaultMessage traducidos.
      const isStillDefault =
        prev.message === defaultMessage ||
        prev.message === '' ||
        // Permite reemplazar si el message vigente es la versión en otro
        // idioma — comprueba que sigue la plantilla "...(title)..."
        (prev.message.includes(property.title) && prev.message.endsWith('?'))
      return isStillDefault ? { ...prev, message: defaultMessage } : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, property.title])
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // Mensajes de error visibles — antes los early returns eran mudos
    if (!formData.name.trim()) { setError(t('contact.errorName')); return }
    if (!formData.email.trim() && !formData.phone.trim()) {
      setError(t('contact.errorContact'))
      return
    }
    if (!formData.message.trim()) { setError(t('contact.errorMessage')); return }
    if (!acceptedTerms) { setError(t('contact.errorTerms')); return }
    setSubmitting(true)
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
        <h3 className="font-display text-[18px] font-semibold text-midnight mb-1">Atlas Rouge Immobilier</h3>
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
      <h3 className="font-display text-[18px] font-semibold text-midnight mb-1">Atlas Rouge Immobilier</h3>
      <div className="flex items-center gap-3 mb-5">
        {agent?.photoUrl ? (
          <img
            src={agent.photoUrl}
            alt={agent.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-cream-warm flex items-center justify-center shrink-0">
            {agent?.name ? (
              <span className="font-display text-[18px] font-semibold text-terracotta">
                {agent.name.slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <User size={22} className="text-text-secondary" />
            )}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-inter text-[14px] font-semibold text-text-primary truncate">
            {agent?.name || ' '}
          </p>
          <p className="font-inter text-[13px] text-text-secondary truncate capitalize">
            {agent?.role || ' '}
          </p>
        </div>
      </div>

      {/* Form minimalista — orden cognitivo profesional:
          1. Nombre (identificarse — compromiso bajo)
          2. Email (canal principal)
          3. Teléfono (opcional)
          4. Mensaje (el cuerpo, donde se invierte más esfuerzo)
          5. Consentimiento RGPD
          6. Submit
          (Patrón Idealista / Rightmove / Sotheby's / James Edition) */}
      <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
        {/* Nombre */}
        <div>
          <label className="block font-inter text-[12.5px] font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
            {t('contact.nameLabel')}
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
            placeholder={t('contact.namePlaceholder')}
            className="w-full h-12 px-3.5 border border-border-warm rounded-xl text-[14.5px] font-inter text-text-primary placeholder:text-text-secondary/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30 transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-inter text-[12.5px] font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
            {t('contact.emailLabel')}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
            placeholder={t('contact.emailPlaceholder')}
            className="w-full h-12 px-3.5 border border-border-warm rounded-xl text-[14.5px] font-inter text-text-primary placeholder:text-text-secondary/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30 transition-colors"
          />
        </div>

        {/* Teléfono — full-width para que el dropdown del país respire */}
        <div>
          <label className="block font-inter text-[12.5px] font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
            {t('contact.phoneLabel')}{' '}
            <span className="text-text-secondary/60 normal-case font-normal tracking-normal">
              ({t('contact.optional')})
            </span>
          </label>
          <PhoneField
            value={formData.phone}
            onChange={(v) => setFormData(f => ({ ...f, phone: v }))}
            placeholder={t('contact.phonePlaceholder')}
            size="md"
          />
        </div>

        {/* Mensaje */}
        <div>
          <label className="block font-inter text-[12.5px] font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
            {t('contact.messageLabel')}
          </label>
          <textarea
            required
            rows={4}
            value={formData.message}
            onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
            placeholder={t('contact.messagePlaceholder')}
            className="w-full px-3.5 py-3 border border-border-warm rounded-xl text-[14.5px] font-inter text-text-primary placeholder:text-text-secondary/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30 transition-colors resize-none"
          />
        </div>

        {/* Política de privacidad — checkbox grande, label clicable */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={e => { setAcceptedTerms(e.target.checked); if (e.target.checked) setError('') }}
            className="mt-0.5 w-5 h-5 accent-terracotta cursor-pointer shrink-0"
          />
          <span className="text-[13px] text-text-secondary font-inter leading-snug">
            {t('iAcceptTerms')}
          </span>
        </label>

        {/* Error visible — antes el form fallaba en silencio */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            <span className="inline-block w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-[20px] text-center shrink-0">!</span>
            <p className="font-inter text-[13px] text-red-700 leading-snug">{error}</p>
          </div>
        )}

        {/* Botón submit — único CTA primario del form */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[52px] bg-terracotta hover:bg-terracotta/90 active:bg-terracotta/80 text-white font-inter text-[14.5px] font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {submitting ? t('contact.sending') : t('sendMyRequest')}
        </button>
      </form>

      {/* Vías alternativas — discretas, separadas del form por un divider */}
      <div className="mt-6 pt-5 border-t border-border-warm">
        <p className="font-inter text-[11px] uppercase tracking-wider text-text-secondary text-center mb-3">
          {t('contact.orReachUs')}
        </p>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] text-text-primary hover:text-[#25D366] active:bg-cream-warm font-inter text-[13.5px] font-medium rounded-lg transition-colors"
            aria-label="WhatsApp"
          >
            <MessageCircle size={17} strokeWidth={2.25} className="text-[#25D366]" />
            WhatsApp
          </a>
          <span className="w-px bg-border-warm self-stretch my-1" />
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] text-text-primary hover:text-terracotta active:bg-cream-warm font-inter text-[13.5px] font-medium rounded-lg transition-colors"
            aria-label="Llamar"
          >
            <Phone size={17} strokeWidth={2.25} className="text-terracotta" />
            {t('call')}
          </a>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────── Info Row (label / value table) ───────────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
  // Skip rows with no value (e.g. a property saved without a neighborhood) so
  // the table never shows a dangling label.
  if (!value || !value.trim()) return null
  return (
    <div className="grid grid-cols-[minmax(96px,40%)_1fr] gap-4 py-3.5 border-b border-border-warm">
      <dt className="text-[12px] text-text-secondary font-inter font-medium uppercase tracking-wider self-center">{label}</dt>
      <dd className="text-[15px] text-text-primary font-inter self-center">{value}</dd>
    </div>
  )
}

/* ───────────────────── Amenity Item ───────────────────── */

function AmenityItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <Check size={16} strokeWidth={2.5} className="text-terracotta shrink-0" />
      <span className="text-[15px] text-text-primary font-inter">{label}</span>
    </div>
  )
}

/* ───────────────────── main PropertyDetail component ───────────────────── */

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation('property')
  const { t: tc } = useTranslation('common')
  const { toggleFavorite, isFavorite } = useFavorites()
  const propertyPrice = usePropertyPrice()
  const { settings } = useSiteSettings()
  const { path } = useLang()

  const [property, setProperty] = useState<Property | undefined>(undefined)
  const [similarProperties, setSimilarProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const currentLang = i18n.language?.slice(0, 2) || 'en'

  const guideLinkLabels: Record<string, string> = {
    notaire: t('guideLabels.notaire', { defaultValue: 'Notaire ou Adoul' }),
    frais: t('guideLabels.frais', { defaultValue: "Frais d'acquisition" }),
    credit: t('guideLabels.credit', { defaultValue: 'Crédit au Maroc pour étrangers' }),
    fiscalite: t('guideLabels.fiscalite', { defaultValue: 'Fiscalité' }),
    gestion: t('guideLabels.gestion', { defaultValue: 'Gestion locative' }),
  }

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    // Only show the loading spinner on the first fetch. On language switches
    // (and other refetches) keep the previous content visible until the new
    // data arrives — fixes the "property disappears, then re-appears" flicker.
    if (!property) setLoading(true)

    getPropertyBySlug(slug)
      .then((p) => {
        if (cancelled) return
        setProperty(p || undefined)
        if (p) {
          getSimilarProperties(p, 3)
            .then((data) => { if (!cancelled) setSimilarProperties(data) })
            .catch((err) => {
              if (cancelled) return
              console.error('Failed to load similar properties:', err)
              setSimilarProperties([])
            })
        } else {
          setSimilarProperties([])
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load property:', err)
        setProperty(undefined)
        setSimilarProperties([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
    // currentLang is intentionally a dep: when the user changes the UI
    // language we want to refetch so the localized title/description/highlights
    // match. The slug-only dep would leave stale French text on /en/.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentLang])

  // Update document.title + meta description + JSON-LD when property loads.
  // Críticos para SEO y para que se vea bien al compartir en social.
  useEffect(() => {
    if (!property) return
    const prevTitle = document.title
    document.title = `${property.title} | Atlas Rouge Immobilier`

    // Meta description: usa primer trozo de description (200 chars max)
    const desc = (property.description || '').replace(/\s+/g, ' ').trim().slice(0, 200)
    let metaDesc = document.querySelector('meta[name="description"]')
    const prevDesc = metaDesc?.getAttribute('content') || ''
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    if (desc) metaDesc.setAttribute('content', desc)

    // JSON-LD schema.org/RealEstateListing
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: property.title,
      description: property.description?.slice(0, 500),
      url: typeof window !== 'undefined' ? window.location.href : '',
      image: property.images?.[0],
      offers: {
        '@type': 'Offer',
        price: property.priceEUR,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: property.neighborhood,
        addressRegion: 'Marrakech-Safi',
        addressCountry: 'MA',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: property.latitude,
        longitude: property.longitude,
      },
    }
    const existing = document.querySelector('script#property-jsonld')
    const script = existing || document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute('id', 'property-jsonld')
    script.textContent = JSON.stringify(jsonLd)
    if (!existing) document.head.appendChild(script)

    return () => {
      document.title = prevTitle
      if (prevDesc) metaDesc?.setAttribute('content', prevDesc)
      document.querySelector('script#property-jsonld')?.remove()
    }
  }, [property])

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
        <h1 className="font-display text-[32px] font-semibold text-midnight mb-3">{t('propertyNotFound')}</h1>
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
              <p className="text-terracotta font-inter text-[32px] font-semibold mb-1">{propertyPrice(property)}</p>
              {!property.priceOnRequest && pricePerM2 > 0 && <p className="text-text-secondary text-[14px] font-inter mb-2">{new Intl.NumberFormat('fr-FR').format(pricePerM2)} €/m²</p>}
              <h1 className="font-display text-[28px] font-medium text-midnight mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-text-secondary text-[15px] font-inter mb-2">
                <MapPin size={16} /> <span>{property.neighborhood}, Marrakech</span>
              </div>
              <p className="text-text-secondary text-[13px] font-inter">
                {t('listingDate')} {new Date(property.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="font-display text-[22px] font-semibold text-midnight mb-3">{t('details.title')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-12">
                <dl className="border-t border-border-warm">
                  <InfoRow label={t('details.reference')} value={property.id.slice(0, 8).toUpperCase()} />
                  <InfoRow label={t('details.city')} value={property.city} />
                  <InfoRow label={t('details.transaction')} value={tc(property.transaction)} />
                  <InfoRow label={t('details.type')} value={tc(property.type)} />
                  <InfoRow label={t('details.neighborhood')} value={property.neighborhood} />
                </dl>
                <dl className="border-t border-border-warm">
                  <InfoRow label={t('details.surface')} value={`${property.surface} m²`} />
                  {property.landSurface && property.landSurface > 0 && (
                    <InfoRow label={t('details.landSurface')} value={`${property.landSurface} m²`} />
                  )}
                  <InfoRow label={t('details.rooms')} value={`${property.rooms}`} />
                  <InfoRow label={t('details.bedrooms')} value={`${property.bedrooms}`} />
                  <InfoRow label={t('details.bathrooms')} value={`${property.bathrooms}`} />
                </dl>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-display text-[22px] font-semibold text-midnight mb-3">{t('description')}</h3>
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
                <h3 className="font-display text-[22px] font-semibold text-midnight mb-4">{t('whatMakesItUnique')}</h3>
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
              <div className="mb-8">
                <h3 className="font-display text-[22px] font-semibold text-midnight mb-4">{t('amenitiesAndServices')}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6">
                  {property.amenities.map(a => <AmenityItem key={a} label={amenityLabel(a, t)} />)}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="font-display text-[22px] font-semibold text-midnight mb-2">{t('location')}</h3>
              <p className="text-text-secondary text-[15px] font-inter mb-1">{property.neighborhood}, Marrakech</p>
              <p className="text-gold text-[13px] font-inter mb-4">{t('exactAddressOnRequest')}</p>
              <Suspense
                fallback={
                  <div className="w-full h-[320px] sm:h-[400px] rounded-xl bg-cream-warm animate-pulse" />
                }
              >
                <LocationMap property={property} />
              </Suspense>
            </div>
          </div>

          <div id="contact-panel" className="lg:w-[35%] scroll-mt-24">
            <div className="lg:sticky lg:top-[calc(72px+24px)]">
              <ContactPanel property={property} settings={settings} />
            </div>
          </div>
        </div>
      </div>

      {similarProperties.length > 0 && (
        <section className="bg-cream-warm py-12">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
            <h3 className="font-display text-[28px] font-medium text-midnight text-center mb-2">{t('similarProperties')}</h3>
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
          <h3 className="font-display text-[28px] font-medium text-midnight text-center mb-2">{t('buyingGuide')}</h3>
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
        <button
          onClick={() => document.getElementById('contact-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex-[1.3] flex items-center justify-center gap-2 h-14 bg-terracotta text-white text-[14px] font-semibold"
        >
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
