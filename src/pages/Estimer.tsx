import { Link } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/SectionReveal'
import { useLang } from '@/hooks/useLang'

export default function Estimer() {
  const { t } = useTranslation('estimation')
  const { path } = useLang()
  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="bg-cream-warm pt-16 md:pt-24 pb-16 md:pb-20">
        <div className="max-w-[800px] mx-auto px-6 lg:px-12 text-center">
          <SectionReveal y={40}>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-terracotta/10 flex items-center justify-center">
              <Calculator size={28} className="text-terracotta" />
            </div>
            <h1 className="font-playfair text-[36px] md:text-[48px] font-medium text-midnight leading-[1.1] tracking-[-0.3px] mb-4">
              {t('intro.title')}
            </h1>
          </SectionReveal>

          <SectionReveal y={30} delay={0.15}>
            <p className="font-inter text-[16px] md:text-[18px] text-text-secondary max-w-[560px] mx-auto mb-8">
              {t('intro.subtitle')}
            </p>
          </SectionReveal>

          <SectionReveal delay={0.3}>
            <Link
              to={path('/estimation')}
              className="inline-flex items-center gap-2 bg-terracotta text-white font-inter text-[14px] font-semibold px-8 py-4 rounded-lg hover:scale-[1.02] transition-transform"
            >
              {t('intro.cta')}
              <ArrowRight size={18} />
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════ INFO ═══════ */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <SectionReveal y={30}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cream-warm flex items-center justify-center">
                  <span className="font-playfair text-[20px] font-semibold text-terracotta">
                    1
                  </span>
                </div>
                <h3 className="font-playfair text-[18px] font-semibold text-midnight mb-2">
                  {t('steps.step1.title')}
                </h3>
                <p className="font-inter text-[14px] text-text-secondary leading-[1.7]">
                  {t('intro.step1Description')}
                </p>
              </div>

              <div className="p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cream-warm flex items-center justify-center">
                  <span className="font-playfair text-[20px] font-semibold text-terracotta">
                    2
                  </span>
                </div>
                <h3 className="font-playfair text-[18px] font-semibold text-midnight mb-2">
                  {t('steps.step2.title')}
                </h3>
                <p className="font-inter text-[14px] text-text-secondary leading-[1.7]">
                  {t('intro.step2Description')}
                </p>
              </div>

              <div className="p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cream-warm flex items-center justify-center">
                  <span className="font-playfair text-[20px] font-semibold text-terracotta">
                    3
                  </span>
                </div>
                <h3 className="font-playfair text-[18px] font-semibold text-midnight mb-2">
                  {t('steps.step3.title')}
                </h3>
                <p className="font-inter text-[14px] text-text-secondary leading-[1.7]">
                  {t('intro.step3Description')}
                </p>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.2}>
            <div className="text-center mt-12">
              <Link
                to={path('/estimation')}
                className="inline-flex items-center gap-2 text-terracotta font-inter text-[16px] font-medium hover:underline"
              >
                {t('intro.linkOnline')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  )
}
