import { Link } from 'react-router-dom'
import { Heart, Bed, Bath, Maximize, Camera } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { useCurrency } from '@/hooks/useCurrency'
import { getImageUrl } from '@/lib/storage'
import type { Property } from '@/data/properties'

interface PropertyCardProps {
  property: Property
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const { formatPrice } = useCurrency()

  const image = getImageUrl(property.images[0] || 'property-01.jpg', { width: 600, height: 450, resize: 'cover' })
  const priceDisplay = formatPrice(property.priceEUR)

  return (
    <div className="bg-white rounded-card border border-border-warm shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-250 overflow-hidden group">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={`/property/${property.slug}`}>
          <img
            src={image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
            loading="lazy"
          />
        </Link>

        {/* Transaction badge */}
        <span className="absolute top-3 left-3 bg-palm text-white text-[11px] font-semibold px-2 py-1 rounded">
          {property.transaction === 'sale' ? '\u00C0 vendre' : '\u00C0 louer'}
        </span>

        {/* Exclusive badge */}
        {property.isExclusive && (
          <span className="absolute top-3 left-[70px] bg-gold text-white text-[11px] font-semibold px-2 py-1 rounded">
            Exclusivit&eacute;
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
          aria-label={
            isFavorite(property.slug)
              ? 'Retirer des favoris'
              : 'Ajouter aux favoris'
          }
        >
          <Heart
            size={18}
            className={
              isFavorite(property.slug)
                ? 'fill-terracotta text-terracotta'
                : 'text-text-secondary'
            }
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <p className="text-terracotta font-inter text-[18px] font-semibold mb-1">
          {priceDisplay}
        </p>

        {/* Neighborhood + city */}
        <p className="text-text-secondary text-[13px] font-inter mb-1">
          {property.neighborhood}, {property.city}
        </p>

        {/* Title */}
        <Link to={`/property/${property.slug}`}>
          <h3 className="font-playfair text-[16px] font-medium text-text-primary truncate mb-3 hover:text-terracotta transition-colors">
            {property.title}
          </h3>
        </Link>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-text-secondary text-[13px] font-inter">
          <span className="flex items-center gap-1">
            <Maximize size={15} />
            {property.surface} m&sup2;
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

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {property.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="bg-cream-warm text-text-secondary text-[11px] px-2 py-0.5 rounded-full"
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Price per m² */}
        {property.surface > 0 && (
          <p className="text-text-secondary text-[12px] font-inter mt-3">
            {new Intl.NumberFormat('fr-FR').format(property.pricePerSqm)} &euro;/m&sup2;
          </p>
        )}

        {/* CTA Link */}
        <Link
          to={`/property/${property.slug}`}
          className="inline-block mt-3 text-terracotta text-[14px] font-inter font-medium hover:underline"
        >
          Voir le bien &rarr;
        </Link>
      </div>
    </div>
  )
}
