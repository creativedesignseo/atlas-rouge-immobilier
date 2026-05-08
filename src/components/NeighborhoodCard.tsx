import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getImageUrl } from '@/lib/storage'
import { useLang } from '@/hooks/useLang'
import type { Neighborhood } from '@/data/neighborhoods'

interface NeighborhoodCardProps {
  neighborhood: Neighborhood
}

export default function NeighborhoodCard({ neighborhood }: NeighborhoodCardProps) {
  const { path } = useLang()
  const { t } = useTranslation('common')

  // Click sends the user to the buy page with the neighborhood NAME as the
  // filter param. Search.tsx reads `?neighborhood=` (not `?quartier=`) and
  // its filter logic in property.service.ts queries `neighborhoods.name`,
  // so we pass the name (URI-encoded for accents and apostrophes).
  const href = path(`/buy?neighborhood=${encodeURIComponent(neighborhood.name)}`)

  return (
    <Link
      to={href}
      className="relative aspect-[3/2] rounded-card overflow-hidden group block"
    >
      <img
        src={getImageUrl(neighborhood.image, { width: 600, height: 400, resize: 'cover' })}
        alt={neighborhood.name}
        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-400"
        loading="lazy"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-4 left-4">
        <h3 className="font-playfair text-[22px] font-semibold text-white">
          {neighborhood.name}
        </h3>
        <p className="text-white/70 text-[13px] font-inter">
          {neighborhood.subtitle}
        </p>
        <p className="text-white/50 text-[12px] font-inter mt-1">
          {t('properties', { count: neighborhood.propertyCount })}
        </p>
      </div>
    </Link>
  )
}
