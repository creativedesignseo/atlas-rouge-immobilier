import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getImageUrl } from '@/lib/storage'
import { useLang } from '@/hooks/useLang'
import type { Neighborhood } from '@/data/neighborhoods'

interface NeighborhoodCardProps {
  neighborhood: Neighborhood
}

/**
 * Premium neighborhood card.
 *
 * Design intent:
 * - Image is the hero — full bleed, taller aspect (4:3 instead of 3:2 felt
 *   too letterbox; this is more editorial like a magazine spread).
 * - Gradient overlay is gentler (less than 60% opacity at bottom) and more
 *   abrupt at top so the photo stays the focus. We add a subtle hover lift
 *   AND a slow image zoom — both quiet, neither dominant.
 * - Typography on the photo uses ALL-CAPS eyebrow for the subtitle, then the
 *   barrio name in big Playfair, then the count as a tiny line. This is the
 *   classic 3-line editorial caption used by Aman, Belmond, etc.
 */
export default function NeighborhoodCard({ neighborhood }: NeighborhoodCardProps) {
  const { path } = useLang()
  const { t } = useTranslation('common')

  const href = path(`/buy?neighborhood=${encodeURIComponent(neighborhood.name)}`)

  return (
    <Link
      to={href}
      className="group relative aspect-[4/3] rounded-2xl overflow-hidden block shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-500 ease-premium"
    >
      {/* Image */}
      <img
        src={getImageUrl(neighborhood.image, { width: 800, height: 600, resize: 'cover' })}
        alt={neighborhood.name}
        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[1200ms] ease-premium"
        loading="lazy"
      />

      {/* Refined gradient — strong only at bottom, transparent above 55% */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />

      {/* Hover wash — barely-there warm tint on hover that hints at the click */}
      <div className="absolute inset-0 bg-terracotta/0 group-hover:bg-terracotta/10 transition-colors duration-500 ease-premium" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        {/* Eyebrow: subtitle in caps */}
        {neighborhood.subtitle && (
          <p className="text-white/75 text-[10px] font-inter font-medium uppercase tracking-eyebrow mb-2">
            {neighborhood.subtitle}
          </p>
        )}

        {/* Name — editorial */}
        <h3 className="font-display text-[28px] md:text-[30px] font-medium text-white leading-none tracking-editorial mb-2">
          {neighborhood.name}
        </h3>

        {/* Property count — refined, only if > 0 to avoid awkward "0 propiedades" */}
        {neighborhood.propertyCount > 0 && (
          <p className="text-white/65 text-[12px] font-inter tabular-nums">
            {t('properties', { count: neighborhood.propertyCount })}
          </p>
        )}
      </div>

      {/* Subtle indicator that the card is clickable — arrow in top-right that
          appears on hover. Premium sites use this instead of an explicit CTA. */}
      <div className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-premium [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.45))]">
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" className="text-white">
          <path d="M3.5 7h7M7 3.5l3.5 3.5L7 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  )
}
