import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Heart, Share2, X, Maximize, Bed, Bath, Home,
  Waves, Car, Check, Phone, MessageCircle, Mail, User,
  ChevronDown, ChevronUp, ArrowRight, Camera, Box, Play,
  TreePine, Info, ExternalLink, FileText, Calculator,
  Landmark, Percent, Briefcase, Clock
} from 'lucide-react'
import { properties as allProperties } from '@/data/properties'
import { useFavorites } from '@/hooks/useFavorites'
import { useCurrency } from '@/hooks/useCurrency'
import PropertyCard from '@/components/PropertyCard'
import { cn, formatPrice } from '@/lib/utils'
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
  { label: 'Notaire ou Adoul', href: '/guide-achat-maroc#notaire', icon: <Landmark size={20} /> },
  { label: "Frais d'acquisition", href: '/guide-achat-maroc#frais', icon: <Calculator size={20} /> },
  { label: 'Crédit au Maroc pour étrangers', href: '/guide-achat-maroc#credit', icon: <Percent size={20} /> },
  { label: 'Fiscalité', href: '/guide-achat-maroc#fiscalite', icon: <FileText size={20} /> },
  { label: 'Gestion locative', href: '/guide-achat-maroc#gestion', icon: <Briefcase size={20} /> },
]

/* ───────────────────── small icon components ───────────────────── */

function WindIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.072-2.143-3.5-6 .5 2.5 0 4.5-1.5 6-1.071 1.072-2.5 2.5-2.5 4.5a5 5 0 0 0 10 0Z" />
      <path d="M12.5 18a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-2.072-2.143-3.5-6 .5 2.5 0 4.5-1.5 6-1.071 1.072-2.5 2.5-2.5 4.5a5 5 0 0 0 10 0Z" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m16 12-4-4-4 4" /><path d="M12 16V8" />
    </svg>
  )
}

function KitchenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18" /><path d="M3 11h18" /><path d="M6 21v-10a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function DumbbellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" /><path d="m14 2 4 4" /><path d="m2 14 4 4" /><path d="M17.5 2.5 21 6" /><path d="M3 17.5 6.5 21" />
      <circle cx="14" cy="10" r="2" /><circle cx="10" cy="14" r="2" />
    </svg>
  )
}

function BallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M4.9 4.9l14.2 14.2" /><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20" /><path d="M2 12h20" />
    </svg>
  )
}

function MountainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" /><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function GateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M5 10h16" /><path d="M9 21v-6h2v6" /><path d="M13 21v-6h2v6" />
    </svg>
  )
}

/* ───────────────────── Gallery Lightbox ───────────────────── */

function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
        <X size={20} />
      </button>
      <button onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
        <ChevronUp size={20} className="-rotate-90" />
      </button>
      <button onClick={() => setCurrent(c => (c + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
        <ChevronUp size={20} className="rotate-90" />
      </button>
      <div className="text-center">
        <img src={images[current]} alt={`Photo ${current + 1}`} className="max-w-[95vw] max-h-[80vh] object-contain rounded-lg" />
        <p className="text-white/60 text-[14px] mt-3 font-inter">{current + 1} / {images.length}</p>
      </div>
    </div>
  )
}

/* ───────────────────── Location Map Placeholder ───────────────────── */

function LocationMap({ property }: { property: Property }) {
  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-[#1a2332]">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `repeating-linear-gradient(#315C45 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #315C45 0 1px, transparent 1px 100%)`,
        backgroundSize: '40px 40px',
      }} />
      <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="20" y1="0" x2="25" y2="100" stroke="#D8C3A5" strokeWidth="0.3" />
        <line x1="60" y1="0" x2="55" y2="100" stroke="#D8C3A5" strokeWidth="0.3" />
        <line x1="0" y1="30" x2="100" y2="35" stroke="#D8C3A5" strokeWidth="0.3" />
        <line x1="0" y1="70" x2="100" y2="68" stroke="#D8C3A5" strokeWidth="0.3" />
        <line x1="0" y1="50" x2="100" y2="52" stroke="#D8C3A5" strokeWidth="0.5" />
      </svg>
      {/* Neighborhood labels */}
      <span className="absolute top-[20%] left-[35%] text-white/30 text-[10px] font-inter">{property.neighborhood}</span>
      {/* Central pin with pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-20 h-20 rounded-full bg-terracotta/20 animate-ping absolute" />
        <div className="relative z-10 w-12 h-12 rounded-full bg-terracotta flex items-center justify-center shadow-lg">
          <MapPin size={24} className="text-white" />
        </div>
      </div>
      {/* Bottom info */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div>
          <p className="text-white font-inter text-[14px] font-medium">{property.neighborhood}, Marrakech</p>
          <p className="text-gold text-[12px] font-inter mt-1">Adresse exacte communiquée sur rendez-vous</p>
        </div>
        <button className="bg-white text-midnight text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-cream transition-colors">
          Obtenir l'adresse exacte
        </button>
      </div>
    </div>
  )
}

/* ───────────────────── Contact Panel ───────────────────── */

function ContactPanel({ property }: { property: Property }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: `Bonjour, je suis intéressé(e) par ce bien (${property.title}). Pourriez-vous me contacter pour plus d'informations ?` })
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  return (
    <div className="bg-white rounded-card border border-border-warm shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
      <h3 className="font-playfair text-[18px] font-semibold text-midnight mb-1">Atlas Rouge Immobilier</h3>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-cream-warm flex items-center justify-center">
          <User size={22} className="text-text-secondary" />
        </div>
        <div>
          <p className="font-inter text-[14px] font-semibold text-text-primary">Sophie Martin</p>
          <p className="font-inter text-[13px] text-text-secondary">Conseillère immobilière</p>
        </div>
      </div>

      <form className="space-y-3" onSubmit={e => e.preventDefault()}>
        <input
          type="text" placeholder="Nom complet" value={formData.name}
          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
          className="w-full h-11 border border-border-warm rounded-lg px-4 text-[14px] focus:border-terracotta focus:outline-none"
        />
        <input
          type="email" placeholder="Email" value={formData.email}
          onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
          className="w-full h-11 border border-border-warm rounded-lg px-4 text-[14px] focus:border-terracotta focus:outline-none"
        />
        <input
          type="tel" placeholder="Téléphone" value={formData.phone}
          onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
          className="w-full h-11 border border-border-warm rounded-lg px-4 text-[14px] focus:border-terracotta focus:outline-none"
        />
        <textarea
          placeholder="Message" rows={4} value={formData.message}
          onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
          className="w-full border border-border-warm rounded-lg px-4 py-3 text-[14px] focus:border-terracotta focus:outline-none resize-none"
        />

        <label className="flex items-start gap-2 cursor-pointer">
          <div
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className={cn('w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer', acceptedTerms ? 'bg-terracotta border-terracotta' : 'border-border-warm')}
          >
            {acceptedTerms && <Check size={10} className="text-white" />}
          </div>
          <span className="text-[12px] text-text-secondary font-inter leading-tight">J'accepte les conditions d'utilisation</span>
        </label>

        <button className="w-full h-12 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.02] transition-transform">
          Envoyer ma demande
        </button>
      </form>

      <div className="mt-4 space-y-2">
        <button className="w-full h-10 border border-terracotta text-terracotta font-inter text-[13px] font-medium rounded-lg hover:bg-terracotta/5 transition-colors">
          Demander une visite
        </button>
        <button className="w-full h-10 border border-border-warm text-text-primary font-inter text-[13px] font-medium rounded-lg hover:bg-cream transition-colors">
          Être rappelé(e)
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <a href="https://wa.me/212612345678" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#25D366] text-white font-inter text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity">
          <MessageCircle size={16} /> WhatsApp
        </a>
        <a href="tel:+212612345678" className="flex-1 flex items-center justify-center gap-2 h-10 border border-border-warm text-text-primary font-inter text-[13px] font-medium rounded-lg hover:bg-cream transition-colors">
          <Phone size={16} /> Téléphoner
        </a>
      </div>
    </div>
  )
}

/* ───────────────────── Spec Card ───────────────────── */

function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center min-w-[90px] flex-1">
      <span className="text-text-secondary mb-1">{icon}</span>
      <span className="text-[12px] text-text-secondary font-inter">{label}</span>
      <span className="text-[16px] font-semibold text-midnight font-inter">{value}</span>
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
  const navigate = useNavigate()
  const { toggleFavorite, isFavorite } = useFavorites()
  const { formatPrice } = useCurrency()

  const property = useMemo(() => allProperties.find(p => p.slug === slug), [slug])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  if (!property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Info size={64} className="text-sand/60 mb-4" />
        <h1 className="font-playfair text-[32px] font-semibold text-midnight mb-3">Bien introuvable</h1>
        <p className="text-text-secondary text-[16px] font-inter mb-6">Ce bien n'existe pas ou n'est plus disponible.</p>
        <Link to="/acheter" className="h-12 px-6 bg-terracotta text-white font-inter text-[14px] font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2">
          <ArrowRight size={18} /> Retour à la recherche
        </Link>
      </div>
    )
  }

  const images = property.images.length > 0 ? property.images : ['/property-01.jpg']
  const mainImage = images[0]
  const thumbImages = images.slice(1, 5)
  const hasMoreImages = images.length > 5
  const remainingCount = Math.max(0, images.length - 5)

  // Similar properties
  const similarProperties = useMemo(() => {
    return allProperties
      .filter(p => p.slug !== property.slug && (p.type === property.type || p.neighborhood === property.neighborhood))
      .slice(0, 3)
  }, [property])

  // Price per m²
  const pricePerM2 = property.surface > 0 ? Math.round(property.priceEUR / property.surface) : 0

  // Description truncation
  const descriptionFull = property.description
  const shouldTruncate = descriptionFull.length > 300
  const descriptionShort = shouldTruncate && !descriptionExpanded ? descriptionFull.slice(0, 300) + '...' : descriptionFull

  return (
    <div className="min-h-[100dvh] bg-cream">
      {/* ─── Gallery ─── */}
      <section className="bg-white">
        {/* Desktop gallery */}
        <div className="hidden md:flex h-[500px] gap-1">
          {/* Main image (60%) */}
          <div className="relative w-[60%] overflow-hidden">
            <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-palm text-white text-[11px] font-semibold px-2.5 py-1 rounded">
                {property.transaction === 'sale' ? 'À vendre' : 'À louer'}
              </span>
              {property.isExclusive && (
                <span className="bg-gold text-midnight text-[11px] font-semibold px-2.5 py-1 rounded">Exclusivité</span>
              )}
            </div>
            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => toggleFavorite(property.slug)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"
              >
                <Heart size={20} className={isFavorite(property.slug) ? 'fill-terracotta text-terracotta' : 'text-text-secondary'} />
              </button>
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <Share2 size={20} className="text-text-secondary" />
              </button>
            </div>
            {/* Photo counter */}
            <div className="absolute bottom-4 right-4 bg-white/90 text-midnight text-[13px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Camera size={14} />
              1 / {images.length}
            </div>
            {/* View all button */}
            {images.length > 1 && (
              <button
                onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
                className="absolute bottom-4 left-4 bg-white/90 text-midnight text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-white transition-colors flex items-center gap-1.5"
              >
                <Camera size={14} />
                Voir toutes les photos
              </button>
            )}
          </div>

          {/* Thumbnails (40%) */}
          {thumbImages.length > 0 && (
            <div className="w-[40%] grid grid-cols-2 grid-rows-2 gap-1">
              {thumbImages.map((img, i) => (
                <div key={i} className="relative overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true) }}>
                  <img src={img} alt={`${property.title} ${i + 2}`} className="w-full h-full object-cover hover:brightness-110 transition-all" />
                  {i === 3 && hasMoreImages && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-inter text-[16px] font-medium">
                      +{remainingCount} photos
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile gallery */}
        <div className="md:hidden relative aspect-[4/3] overflow-hidden">
          <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded">
              {property.transaction === 'sale' ? 'À vendre' : 'À louer'}
            </span>
            {property.isExclusive && <span className="bg-gold text-midnight text-[11px] font-semibold px-2 py-1 rounded">Exclusivité</span>}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={() => toggleFavorite(property.slug)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
              <Heart size={18} className={isFavorite(property.slug) ? 'fill-terracotta text-terracotta' : 'text-text-secondary'} />
            </button>
          </div>
          {images.length > 1 && (
            <button
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
              className="absolute bottom-3 left-3 bg-white/90 text-midnight text-[12px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Camera size={12} /> Voir les {images.length} photos
            </button>
          )}
        </div>
      </section>

      {/* ─── Lightbox ─── */}
      {lightboxOpen && <Lightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />}

      {/* ─── Main Content ─── */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column (65%) */}
          <div className="lg:w-[65%]">
            {/* Header */}
            <div className="mb-6">
              <p className="text-terracotta font-inter text-[32px] font-semibold mb-1">{formatPrice(property.priceEUR)}</p>
              {pricePerM2 > 0 && <p className="text-text-secondary text-[14px] font-inter mb-2">{new Intl.NumberFormat('fr-FR').format(pricePerM2)} €/m²</p>}
              <h1 className="font-playfair text-[28px] font-medium text-midnight mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-text-secondary text-[15px] font-inter mb-2">
                <MapPin size={16} />
                <span>{property.neighborhood}, Marrakech</span>
              </div>
              <p className="text-text-secondary text-[13px] font-inter">
                Mise en ligne le {new Date(property.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Key Specs */}
            <div className="bg-white rounded-card border border-border-warm p-5 mb-6">
              <div className="flex flex-wrap gap-y-4 gap-x-6">
                <SpecCard icon={<Maximize size={22} />} label="Surface habitable" value={`${property.surface} m²`} />
                {property.landSurface && property.landSurface > 0 && <SpecCard icon={<TreePine size={22} />} label="Surface terrain" value={`${property.landSurface} m²`} />}
                <SpecCard icon={<Home size={22} />} label="Pièces" value={`${property.rooms}`} />
                <SpecCard icon={<Bed size={22} />} label="Chambres" value={`${property.bedrooms}`} />
                <SpecCard icon={<Bath size={22} />} label="Salles de bain" value={`${property.bathrooms}`} />
                <SpecCard icon={<Waves size={22} />} label="Piscine" value={property.amenities.some(a => a.toLowerCase().includes('piscine')) ? 'Oui' : 'Non'} />
                <SpecCard icon={<Maximize size={22} />} label="Terrasse" value={property.amenities.some(a => a.toLowerCase().includes('terrasse')) ? 'Oui' : 'Non'} />
                <SpecCard icon={<Car size={22} />} label="Parking" value={property.amenities.some(a => a.toLowerCase().includes('parking') || a.toLowerCase().includes('garage')) ? 'Oui' : 'Non'} />
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-3">Description</h3>
              <div className="relative">
                <p className="text-text-primary text-[16px] font-inter leading-[1.7] whitespace-pre-line">
                  {descriptionShort}
                </p>
                {shouldTruncate && !descriptionExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cream to-transparent" />
                )}
              </div>
              {shouldTruncate && (
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="mt-2 text-terracotta text-[14px] font-medium font-inter hover:underline flex items-center gap-1"
                >
                  {descriptionExpanded ? 'Réduire' : 'Lire la suite'}
                  {descriptionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>

            {/* Ce qui rend ce bien unique */}
            {property.highlights.length > 0 && (
              <div className="mb-8 bg-white rounded-card border border-border-warm p-6">
                <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-4">Ce qui rend ce bien unique</h3>
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

            {/* Équipements */}
            {property.amenities.length > 0 && (
              <div className="mb-8 bg-cream-warm rounded-card p-6">
                <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-4">Équipements et prestations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {property.amenities.map(a => (
                    <AmenityItem key={a} label={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Location & Map */}
            <div className="mb-8">
              <h3 className="font-playfair text-[22px] font-semibold text-midnight mb-2">Localisation</h3>
              <p className="text-text-secondary text-[15px] font-inter mb-1">{property.neighborhood}, Marrakech</p>
              <p className="text-gold text-[13px] font-inter mb-4">Adresse exacte communiquée sur rendez-vous</p>
              <LocationMap property={property} />
            </div>
          </div>

          {/* Right column — Contact Panel (desktop sticky) */}
          <div className="lg:w-[35%]">
            <div className="lg:sticky lg:top-[calc(72px+24px)]">
              <ContactPanel property={property} />
            </div>
          </div>
        </div>
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section className="bg-cream-warm py-12">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
            <h3 className="font-playfair text-[28px] font-medium text-midnight text-center mb-2">Biens similaires</h3>
            <p className="text-text-secondary text-[16px] font-inter text-center mb-8">D'autres propriétés qui pourraient vous intéresser</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map(p => (
                <PropertyCard key={p.slug} property={p} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/acheter" className="inline-flex items-center gap-2 text-terracotta text-[16px] font-medium font-inter hover:underline">
                Voir plus d'annonces <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Guide CTA */}
      <section className="bg-white py-12">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
          <h3 className="font-playfair text-[28px] font-medium text-midnight text-center mb-2">Guide d'achat au Maroc</h3>
          <p className="text-text-secondary text-[16px] font-inter text-center mb-8">Tout ce que vous devez savoir pour acheter sereinement au Maroc</p>
          <div className="flex flex-wrap justify-center gap-3">
            {guideLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-2 bg-white border border-border-warm rounded-lg px-4 py-3 text-terracotta text-[14px] font-medium font-inter hover:border-terracotta hover:shadow-sm transition-all"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-warm flex">
        <a href="tel:+212612345678" className="flex-1 flex items-center justify-center gap-2 h-14 text-[14px] font-medium text-text-primary border-r border-border-warm">
          <Phone size={18} /> Appeler
        </a>
        <a href="https://wa.me/212612345678" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 h-14 text-[14px] font-medium text-[#25D366] border-r border-border-warm">
          <MessageCircle size={18} /> WhatsApp
        </a>
        <button className="flex-[1.3] flex items-center justify-center gap-2 h-14 bg-terracotta text-white text-[14px] font-semibold">
          Demander une visite
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
