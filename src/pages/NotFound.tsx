import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ArrowRight, MapPin } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function NotFound() {
  const { t } = useTranslation('common')
  const { path } = useLang()
  return (
    <div className="min-h-[70vh] bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <MapPin size={64} className="text-sand/60 mx-auto mb-6" />
        <h1 className="font-playfair text-[48px] font-medium text-midnight mb-2">
          404
        </h1>
        <h2 className="font-playfair text-[22px] font-medium text-midnight mb-4">
          {t('pageNotFound')}
        </h2>
        <p className="text-text-secondary text-[16px] font-inter mb-8">
          {t('pageNotFoundDesc')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={path('/')}
            className="inline-flex items-center gap-2 bg-terracotta text-white font-inter text-[14px] font-semibold px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform"
          >
            <Home size={18} />
            {t('backToHome')}
          </Link>
          <Link
            to={path('/acheter')}
            className="inline-flex items-center gap-2 text-terracotta font-inter text-[14px] font-medium hover:underline"
          >
            {t('viewListings')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
