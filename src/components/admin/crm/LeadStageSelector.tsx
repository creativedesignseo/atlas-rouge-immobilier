import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LeadStage } from '@/types/supabase'
import { STAGES } from './stages'

interface Props {
  open: boolean
  leadName: string
  currentStage: LeadStage
  onSelect: (stage: LeadStage) => void
  onClose: () => void
}

/**
 * Full-screen stage picker. This is the touch alternative to drag & drop: on a
 * phone dragging a card between columns is unreliable, so every card carries a
 * "move to stage" button that opens this sheet with 56px targets.
 */
export default function LeadStageSelector({
  open,
  leadName,
  currentStage,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation('admin')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center">
      <button
        type="button"
        aria-label={t('actions.cancel')}
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('crm.stageSelector.title')}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-border-warm shadow-xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 max-h-[85dvh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-ink">
              {t('crm.stageSelector.title')}
            </h2>
            <p className="mt-1 text-sm text-stone truncate">{leadName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('actions.cancel')}
            className="w-11 h-11 flex items-center justify-center rounded-xl border border-border-warm text-stone hover:text-ink flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-2">
          {STAGES.map((stage) => {
            const active = stage.id === currentStage
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onSelect(stage.id)}
                aria-current={active}
                className={`w-full min-h-[56px] px-4 flex items-center gap-3 rounded-2xl border text-left transition-colors ${
                  active
                    ? 'border-ink bg-cream-warm'
                    : 'border-border-warm hover:border-ink/40 bg-white'
                }`}
              >
                <span aria-hidden className={`w-3 h-3 rounded-full flex-shrink-0 ${stage.dot}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-ink">
                    {t(`crm.stages.${stage.id}.label`)}
                  </span>
                  <span className="block text-sm text-stone truncate">
                    {t(`crm.stages.${stage.id}.hint`)}
                  </span>
                </span>
                {active && <Check size={20} className="text-ink flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
