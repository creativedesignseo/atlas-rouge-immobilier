import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, ArrowRight } from 'lucide-react'
import SectionReveal from '@/components/SectionReveal'
import PropertyCard from '@/components/PropertyCard'
import { useFavorites } from '@/hooks/useFavorites'
import { useLang } from '@/hooks/useLang'
import { getPropertyBySlug } from '@/services/property.service'
import type { Property } from '@/data/properties'

export default function Favorites() {
  const { t } = useTranslation('common')
  const { favorites, loading: favoritesLoading } = useFavorites()
  const { path } = useLang()

  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (favoritesLoading) return
    let cancelled = false
    setLoading(true)
    Promise.all(favorites.map((slug) => getPropertyBySlug(slug)))
      .then((results) => {
        if (cancelled) return
        setFavoriteProperties(results.filter((p): p is Property => p !== null))
      })
      .catch(() => {
        if (!cancelled) setFavoriteProperties([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [favorites, favoritesLoading])

  const hasFavorites = favoriteProperties.length > 0

  return (
    <div>
      {/* ═══════ PAGE HEADER ═══════ */}
      <section className="bg-cream-warm pt-16 md:pt-20 pb-8 md:pb-10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center gap-2 mb-6 text-text-secondary font-inter text-[13px]">
            <Link to={path('/')} className="hover:text-terracotta transition-colors">
              {t('home')}
            </Link>
            <span className="text-border-warm">/</span>
            <span>{t('myFavorites')}</span>
          </nav>

          <SectionReveal y={30}>
            <div className="flex items-center gap-3 mb-3">
              <Heart size={28} className="text-terracotta" />
              <h1 className="font-display text-[32px] md:text-[40px] font-medium text-midnight leading-[1.1]">
                {t('myFavorites')}
              </h1>
            </div>
          </SectionReveal>

          <SectionReveal y={20} delay={0.1}>
            <p className="font-inter text-[15px] text-text-secondary max-w-[560px]">
              {t('favoritesSubtitle')}
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ CONTENT ═══════ */}
      <section className="bg-white py-12 md:py-16 min-h-[50vh]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasFavorites ? (
            <>
              <p className="font-inter text-[14px] text-text-secondary mb-6">
                {favoriteProperties.length} {t(favoriteProperties.length > 1 ? 'saved_plural' : 'saved')}
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
              <h2 className="font-display text-[24px] font-medium text-midnight mb-3">
                {t('noFavorites')}
              </h2>
              <p className="font-inter text-[15px] text-text-secondary mb-8 max-w-[400px]">
                {t('noFavoritesDesc')}
              </p>
              <Link
                to={path('/acheter')}
                className="inline-flex items-center gap-2 bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-3.5 rounded-lg hover:scale-[1.02] transition-transform"
              >
                {t('exploreProperties')}
                <ArrowRight size={18} />
              </Link>
            </SectionReveal>
          )}
        </div>
      </section>
    </div>
  )
}
