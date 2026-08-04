import { useState } from 'react'
import { Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ContactSubmission } from '@/services/admin/contactAdmin.service'
import type { LeadStage } from '@/types/supabase'
import LeadCard from './LeadCard'
import { STAGES } from './stages'

interface Props {
  leads: ContactSubmission[]
  /** Stage shown on phones — the board renders one column at a time there. */
  mobileStage: LeadStage
  pendingId: string | null
  onOpen: (lead: ContactSubmission) => void
  onMove: (lead: ContactSubmission) => void
  onDropOnStage: (leadId: string, stage: LeadStage) => void
}

export default function PipelineBoard({
  leads,
  mobileStage,
  pendingId,
  onOpen,
  onMove,
  onDropOnStage,
}: Props) {
  const { t } = useTranslation('admin')
  const [dragOver, setDragOver] = useState<LeadStage | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  return (
    <div className="lg:overflow-x-auto lg:pb-2">
      <div className="lg:inline-grid lg:grid-flow-col lg:auto-cols-[minmax(300px,1fr)] lg:gap-4 lg:min-w-full">
        {STAGES.map((stage) => {
          const items = leads.filter((lead) => lead.stage === stage.id)
          const isTarget = dragOver === stage.id
          return (
            <section
              key={stage.id}
              // Drop target. dragleave fires when moving over children too, so
              // the highlight is cleared only when the pointer really leaves.
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setDragOver(stage.id)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(null)
                setDragging(null)
                const id = e.dataTransfer.getData('text/plain')
                if (id) onDropOnStage(id, stage.id)
              }}
              aria-label={t(`crm.stages.${stage.id}.label`)}
              className={`rounded-2xl border transition-colors ${
                mobileStage === stage.id ? 'block' : 'hidden lg:block'
              } ${
                isTarget
                  ? 'border-terracotta bg-terracotta/5'
                  : 'border-border-warm bg-cream-warm/40 lg:bg-cream-warm/60'
              }`}
            >
              <header className="hidden lg:flex items-center justify-between gap-2 px-4 py-3 border-b border-border-subtle">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className={`w-2.5 h-2.5 rounded-full ${stage.dot}`}
                  />
                  <span className="font-display text-base font-bold text-ink truncate">
                    {t(`crm.stages.${stage.id}.label`)}
                  </span>
                </span>
                <span className="min-w-[32px] h-8 px-2 inline-flex items-center justify-center rounded-lg bg-white border border-border-warm text-sm font-bold text-ink tabular-nums">
                  {items.length}
                </span>
              </header>

              <div className="p-3 grid gap-3 content-start">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-warm bg-white/60 px-4 py-10 text-center">
                    <Inbox size={28} className="mx-auto mb-2 text-stone/40" />
                    <p className="text-sm font-semibold text-ink">
                      {t(`crm.stages.${stage.id}.empty`)}
                    </p>
                    <p className="mt-1 text-xs text-stone">{t('crm.board.dropHint')}</p>
                  </div>
                ) : (
                  items.map((lead) => (
                    <div key={lead.id} className={dragging === lead.id ? 'opacity-40' : ''}>
                      <LeadCard
                        lead={lead}
                        pending={pendingId === lead.id}
                        onOpen={onOpen}
                        onMove={onMove}
                        onDragStart={(l) => setDragging(l.id)}
                        onDragEnd={() => setDragging(null)}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
