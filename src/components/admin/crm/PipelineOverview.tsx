import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LeadStage } from '@/types/supabase'
import { STAGES } from './stages'

interface Props {
  counts: Record<LeadStage, number>
  activeStage: LeadStage
  onSelect: (stage: LeadStage) => void
}

/**
 * The funnel, top of the screen. Doubles as navigation: on phones the board
 * shows one column at a time and this is how the user switches between them,
 * which is why every step is a real button with a 44px+ target.
 */
export default function PipelineOverview({ counts, activeStage, onSelect }: Props) {
  const { t } = useTranslation('admin')

  return (
    <section
      aria-label={t('crm.pipeline.title')}
      className="rounded-3xl border border-border-warm bg-white p-4 sm:p-6"
    >
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone">
          {t('crm.pipeline.kicker')}
        </p>
        <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-ink leading-tight">
          {t('crm.pipeline.title')}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-stone max-w-2xl">
          {t('crm.pipeline.copy')}
        </p>
      </div>

      {/* Horizontal scroll on small screens; the arrows are decorative. */}
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STAGES.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-2 shrink-0">
            {index > 0 && (
              <ChevronRight size={18} className="text-stone/40 shrink-0" aria-hidden />
            )}
            <button
              type="button"
              onClick={() => onSelect(stage.id)}
              aria-current={activeStage === stage.id}
              className={`w-[168px] sm:w-[188px] text-left p-3.5 rounded-2xl border transition-colors ${
                activeStage === stage.id
                  ? 'border-ink bg-cream-warm'
                  : 'border-border-warm bg-white hover:border-ink/30'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span
                  aria-hidden
                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-bold ${stage.tone}`}
                >
                  {index + 1}
                </span>
                <span className="min-w-[30px] h-7 px-2 inline-flex items-center justify-center rounded-full bg-cream-warm border border-border-subtle text-sm font-bold text-ink tabular-nums">
                  {counts[stage.id] ?? 0}
                </span>
              </span>
              <span className="block mt-2.5 font-display text-base font-bold text-ink">
                {t(`crm.stages.${stage.id}.label`)}
              </span>
              <span className="block mt-0.5 text-xs text-stone">
                {t(`crm.stages.${stage.id}.hint`)}
              </span>
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
