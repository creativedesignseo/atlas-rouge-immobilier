import { Link } from 'react-router-dom'
import { Heart, ArrowRight } from 'lucide-react'
import SectionReveal from '@/components/SectionReveal'
import PropertyCard from '@/components/PropertyCard'
import { useFavorites } from '@/hooks/useFavorites'
import { useLang } from '@/hooks/useLang'
import { properties } from '@/data/properties'

export default function Favorites() {
  const { favorites } = useFavorites()
  const { path } = useLang()

  const favoriteProperties = properties.filter((p) =>
    favorites.includes(p.slug)
  )

  const hasFavorites = favoriteProperties.length > 0

  return (
    <div>
      {/* ═══════ PAGE HEADER ═══════ */}
      <section className="bg-cream-warm pt-16 md:pt-20 pb-8 md:pb-10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center gap-2 mb-6 text-text-secondary font-inter text-[13px]">
            <Link to={path('/')} className="hover:text-terracotta transition-colors">
              Accueil
            </Link>
            <span className="text-border-warm">/</span>
            <span>Mes favoris</span>
          </nav>

          <SectionReveal y={30}>
            <div className="flex items-center gap-3 mb-3">
              <Heart size={28} className="text-terracotta" />
              <h1 className="font-playfair text-[32px] md:text-[40px] font-medium text-midnight leading-[1.1]">
                Mes favoris
              </h1>
            </div>
          </SectionReveal>

          <SectionReveal y={20} delay={0.1}>
            <p className="font-inter text-[15px] text-text-secondary max-w-[560px]">
              Retrouvez ici tous les biens que vous avez sauvegardés.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ CONTENT ═══════ */}
      <section className="bg-white py-12 md:py-16 min-h-[50vh]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          {hasFavorites ? (
            <>
              <p className="font-inter text-[14px] text-text-secondary mb-6">
                {favoriteProperties.length} bien
                {favoriteProperties.length > 1 ? 's' : ''} sauvegardé
                {favoriteProperties.length > 1 ? 's' : ''}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteProperties.map((property) => (
                  <PropertyCard key={property.slug} property={property} />
                ))}
              </div>
            </>
          ) : (
            /* ── Empty state ── */
            <SectionReveal className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 rounded-full bg-cream-warm flex items-center justify-center mb-6">
                <Heart size={36} className="text-border-warm" />
              </div>
              <h2 className="font-playfair text-[24px] font-medium text-midnight mb-3">
                Vous n&#8217;avez pas encore de favoris
              </h2>
              <p className="font-inter text-[15px] text-text-secondary mb-8 max-w-[400px]">
                Parcourez nos biens à Marrakech et ajoutez-les à vos favoris
                pour les retrouver ici.
              </p>
              <Link
                to={path('/acheter')}
                className="inline-flex items-center gap-2 bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
              >
                Explorer les biens
                <ArrowRight size={18} />
              </Link>
            </SectionReveal>
          )}
        </div>
      </section>
    </div>
  )
}
