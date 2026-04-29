import { Link } from 'react-router-dom'
import { Heart, Bed, Bath, Maximize, Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFavorites } from '@/hooks/useFavorites'
import { useCurrency } from '@/hooks/useCurrency'
import { useLang } from '@/hooks/useLang'
import { getImageUrl } from '@/lib/storage'
import type { Property } from '@/data/properties'

interface PropertyCardProps {
  property: Property
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const { formatPrice } = useCurrency()
  const { path } = useLang()
  const { t } = useTranslation('property')
  const { t: tc } = useTranslation('common')

  const image = getImageUrl(property.images[0] || 'property-01.jpg', { width: 600, height: 450, resize: 'cover' })
  const priceDisplay = formatPrice(property.priceEUR)
  const propertyPath = path(`/property/${property.slug}`)

  return (
    <div className="bg-white rounded-card border border-border-warm shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-250 overflow-hidden group">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={propertyPath}>
          <img
            src={image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
            loading="lazy"
          />
        </Link>

        {/* Transaction badge */}
        <span className="absolute top-3 left-3 bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded">
          {property.transaction === 'sale' ? t('forSale') : t('forRent')}
        </span>

        {/* Exclusive badge */}
        {property.isExclusive && (
          <span className="absolute top-3 left-[70px] bg-gold text-white text-[11px] font-semibold px-2 py-1 rounded">
            {t('exclusiveListing')}
          </span>
        )}

        {/* Photo count */}
        <span className="absolute top-3 right-14 bg-black/50 text-white text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1">
          <Camera size={12} />
          {property.images.length}
        </span>

        {/* Favorite button */}
        <button
          onClick={() => toggleFavorite(property.slug)}
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"
          aria-label={isFavorite(property.slug) ? tc('favoriteRemoved') : tc('favoriteAdded')}
        >
          <Heart
            size={18}
            className={isFavorite(property.slug) ? 'fill-terracotta text-terracotta' : 'text-text-secondary'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-terracotta font-inter text-[18px] font-semibold mb-1">
          {priceDisplay}
        </p>

        <p className="text-text-secondary text-[13px] font-inter mb-1">
          {property.neighborhood}, {property.city}
        </p>

        <Link to={propertyPath}>
          <h3 className="font-playfair text-[16px] font-medium text-text-primary truncate mb-3 hover:text-terracotta transition-colors">
            {property.title}
          </h3>
        </Link>

        <div className="flex items-center gap-4 text-text-secondary text-[13px] font-inter">
          <span className="flex items-center gap-1">
            <Maximize size={15} />
            {property.surface} {tc('sqm')}
          </span>
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bed size={15} />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath size={15} />
              {property.bathrooms}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {property.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="bg-cream-warm text-text-secondary text-[11px] px-2 py-0.5 rounded-full">
              {amenity}
            </span>
          ))}
        </div>

        {property.surface > 0 && (
          <p className="text-text-secondary text-[12px] font-inter mt-3">
            {new Intl.NumberFormat('fr-FR').format(property.pricePerSqm)} €{tc('perSqm')}
          </p>
        )}

        <Link to={propertyPath} className="inline-block mt-3 text-terracotta text-[14px] font-inter font-medium hover:underline">
          {tc('seeMore')} →
        </Link>
      </div>
    </div>
  )
}
