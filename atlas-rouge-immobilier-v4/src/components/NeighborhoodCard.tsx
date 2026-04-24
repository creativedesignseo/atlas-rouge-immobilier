import { Link } from 'react-router-dom'
import type { Neighborhood } from '@/data/neighborhoods'

interface NeighborhoodCardProps {
  neighborhood: Neighborhood
}

export default function NeighborhoodCard({ neighborhood }: NeighborhoodCardProps) {
  return (
    <Link
      to={`/acheter?quartier=${neighborhood.slug}`}
      className="relative aspect-[3/2] rounded-card overflow-hidden group block"
    >
      <img
        src={neighborhood.image}
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
          {neighborhood.propertyCount} biens
        </p>
      </div>
    </Link>
  )
}
