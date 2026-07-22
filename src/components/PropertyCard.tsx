import { Link } from 'react-router-dom'
import { Heart, Bed, Bath, Maximize, Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFavorites } from '@/hooks/useFavorites'
import { usePropertyPrice } from '@/hooks/usePropertyPrice'
import { useLang } from '@/hooks/useLang'
import { getImageUrl } from '@/lib/storage'
import { amenityLabel } from '@/lib/amenities'
import type { Property } from '@/data/properties'

interface PropertyCardProps {
  property: Property
}

/**
 * Premium real-estate listing card.
 *
 * Design intent (editorial / Sotheby's-like):
 * - No border. Depth comes from a layered shadow that lifts subtly on hover.
 * - Price is the loudest element, set in Playfair (editorial serif) — that's
 *   what a luxury buyer reads first.
 * - Badge uses uppercase + tracked letters, the classic premium signal.
 * - Stats are compact, separated by a hairline dot — easier to scan than icons
 *   stacked next to numbers.
 * - The whole card is one anchor target. We removed the "see more →" link
 *   because the entire surface already navigates to the listing.
 */
export default function PropertyCard({ property }: PropertyCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const propertyPrice = usePropertyPrice()
  const { path } = useLang()
  const { t } = useTranslation('property')
  const { t: tc } = useTranslation('common')

  const image = getImageUrl(property.images[0] || 'property-01.jpg', { width: 800, height: 600, resize: 'cover' })
  const priceDisplay = propertyPrice(property)
  const propertyPath = path(`/property/${property.slug}`)
  const fav = isFavorite(property.slug)

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-500 ease-premium">
      {/* Image wrapper — clickable surface */}
      <Link to={propertyPath} className="block relative aspect-[4/3] overflow-hidden bg-cream-warm">
        <img
          src={image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-premium"
          loading="lazy"
        />

        {/* Tonal overlay only on hover — adds depth, lifts subtitle readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-premium" />

        {/* Badges row (top-left) — uppercase, tracked, restrained */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="bg-ink/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-eyebrow px-2.5 py-1 rounded-full">
            {property.transaction === 'sale' ? t('forSale') : t('forRent')}
          </span>
          {property.isExclusive && (
            <span className="bg-gold text-ink text-[10px] font-semibold uppercase tracking-eyebrow px-2.5 py-1 rounded-full">
              {t('exclusiveListing')}
            </span>
          )}
        </div>

        {/* Photo count (bottom-left) — minimalist counter */}
        <span className="absolute bottom-3 left-3 bg-ink/70 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-full flex items-center gap-1 tabular-nums">
          <Camera size={12} strokeWidth={1.8} />
          {property.images.length}
        </span>
      </Link>

      {/* Favorite — separate button, outside the Link so it doesn't trigger nav */}
      <button
        onClick={() => toggleFavorite(property.slug)}
        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 ease-premium [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.45))]"
        aria-label={fav ? tc('favoriteRemoved') : tc('favoriteAdded')}
      >
        <Heart
          size={22}
          strokeWidth={2}
          className={fav ? 'fill-terracotta text-terracotta' : 'text-white'}
        />
      </button>

      {/* Content */}
      <Link to={propertyPath} className="block p-5">
        {/* Price — the loudest element, editorial serif */}
        <p className="font-display text-[24px] font-medium text-terracotta tabular-nums leading-none mb-3">
          {priceDisplay}
        </p>

        {/* Neighborhood, city — small caps treatment */}
        <p className="text-stone text-[11px] font-inter font-medium uppercase tracking-eyebrow mb-2">
          {property.neighborhood} · {property.city}
        </p>

        {/* Title — editorial, slightly larger than before */}
        <h3 className="font-display text-[18px] font-medium text-ink leading-snug truncate mb-4 group-hover:text-terracotta transition-colors duration-300 ease-premium">
          {property.title}
        </h3>

        {/* Stats — separated by hairline dot, compact, scannable */}
        <div className="flex items-center gap-3 text-stone text-[13px] font-inter tabular-nums">
          <span className="flex items-center gap-1.5">
            <Maximize size={14} strokeWidth={1.6} />
            {property.surface} {tc('sqm')}
          </span>
          {property.bedrooms > 0 && (
            <>
              <span aria-hidden className="text-stone/40">·</span>
              <span className="flex items-center gap-1.5">
                <Bed size={14} strokeWidth={1.6} />
                {property.bedrooms}
              </span>
            </>
          )}
          {property.bathrooms > 0 && (
            <>
              <span aria-hidden className="text-stone/40">·</span>
              <span className="flex items-center gap-1.5">
                <Bath size={14} strokeWidth={1.6} />
                {property.bathrooms}
              </span>
            </>
          )}
        </div>

        {/* Amenities — only top 3, refined chips */}
        {property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border-subtle">
            {property.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="text-stone text-[11px] font-inter font-medium tracking-wide"
              >
                {amenityLabel(amenity, t)}
              </span>
            )).reduce<React.ReactNode[]>((acc, item, idx) => {
              if (idx === 0) return [item]
              return [...acc, (
                <span key={`dot-${idx}`} aria-hidden className="text-stone/30">·</span>
              ), item]
            }, [])}
          </div>
        )}

        {/* Price-per-sqm — tertiary info, only if relevant */}
        {property.surface > 0 && property.pricePerSqm > 0 && (
          <p className="text-stone/70 text-[11px] font-inter tabular-nums mt-3">
            {new Intl.NumberFormat('fr-FR').format(property.pricePerSqm)} €{tc('perSqm')}
          </p>
        )}
      </Link>
    </article>
  )
}
