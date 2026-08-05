import { Flame, Home, Mail, MessageCircle, Phone, MoveRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { ContactSubmission } from '@/services/admin/contactAdmin.service'
import { campaignOf, initials, sourceOf, tintFor, whatsappNumber } from './stages'

interface Props {
  lead: ContactSubmission
  /** Set while its stage change is in flight — the card dims and stops reacting. */
  pending?: boolean
  onOpen: (lead: ContactSubmission) => void
  onMove: (lead: ContactSubmission) => void
  onDragStart: (lead: ContactSubmission) => void
  onDragEnd: () => void
}

export default function LeadCard({ lead, pending, onOpen, onMove, onDragStart, onDragEnd }: Props) {
  const { t } = useTranslation('admin')
  const campaign = campaignOf(lead.message)
  const source = sourceOf(lead.message)
  const relative = relativeTime(lead.created_at, t)

  return (
    <article
      // Draggable on pointer devices only: touch drag is unreliable, so phones
      // get the explicit "move to stage" button below instead.
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(lead)
      }}
      onDragEnd={onDragEnd}
      // Accordion: collapsed to one row so a column shows many leads at once,
      // and it expands on hover (pointer devices) or focus-within (keyboard).
      // Below lg there is no hover, so the card is simply always expanded —
      // a phone user must not have to guess that content is hidden.
      className={`group rounded-2xl border border-border-warm bg-white px-3 py-2.5 transition-shadow ${
        pending ? 'opacity-50' : 'hover:shadow-md hover:border-ink/20'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(lead)}
        className="w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
      >
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-display text-sm font-bold ${tintFor(
              lead.id
            )}`}
          >
            {initials(lead.name) || '—'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[15px] font-bold text-ink leading-tight truncate">
              {lead.name}
            </span>
            <span className="block text-xs text-stone">{relative}</span>
          </span>
          {lead.priority === 'high' && (
            <Flame size={15} className="text-terracotta flex-shrink-0" aria-label={t('crm.card.high')} />
          )}
        </span>
      </button>

      {/* The 0fr -> 1fr grid trick animates to the content's natural height,
          which `height: auto` cannot do. */}
      <div className="grid grid-rows-[1fr] lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr] lg:group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none">
        <div className="overflow-hidden">
          <button
            type="button"
            onClick={() => onOpen(lead)}
            className="w-full text-left pt-2 rounded-xl focus:outline-none"
          >
            <span className="block text-sm text-stone truncate">
              {lead.email || lead.phone || '—'}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center h-6 px-2 rounded-lg bg-cream-warm border border-border-subtle text-[11px] font-semibold text-stone">
                {source || t('crm.card.direct')}
              </span>
              {campaign && (
                <span className="inline-flex items-center h-6 px-2 rounded-lg bg-cream-warm border border-border-subtle text-[11px] font-semibold text-stone max-w-[60%] truncate">
                  {campaign}
                </span>
              )}
              {lead.property_slug && (
                <span className="inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-cream-warm border border-border-subtle text-[11px] font-semibold text-stone">
                  <Home size={12} />
                  {t('crm.card.property')}
                </span>
              )}
            </span>
          </button>

          <div className="mt-2.5 pt-2.5 border-t border-border-subtle flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onMove(lead)}
              disabled={pending}
              title={t('crm.stageSelector.title')}
              className="flex-1 min-w-0 h-10 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border-warm text-[13px] font-semibold text-ink whitespace-nowrap hover:border-ink/40 disabled:opacity-50 transition-colors"
            >
              <MoveRight size={16} className="flex-shrink-0" />
              {t('crm.card.move')}
            </button>
            {lead.phone && (
              <a
                href={`https://wa.me/${whatsappNumber(lead.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('contacts.whatsapp')}
                className="w-10 h-10 flex-shrink-0 inline-flex items-center justify-center rounded-xl bg-palm text-white hover:bg-palm/90 transition-colors"
              >
                <MessageCircle size={17} />
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                aria-label={t('contacts.call')}
                className="w-10 h-10 flex-shrink-0 inline-flex items-center justify-center rounded-xl border border-border-warm text-ink hover:border-ink/40 transition-colors"
              >
                <Phone size={17} />
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                aria-label={t('contacts.email')}
                className="w-10 h-10 flex-shrink-0 inline-flex items-center justify-center rounded-xl border border-border-warm text-ink hover:border-ink/40 transition-colors"
              >
                <Mail size={17} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * Coarse "how long ago" label. Deliberately not date-fns/formatDistance: the
 * board only needs minute/hour/day granularity and this keeps the three
 * locales on the same short vocabulary.
 */
function relativeTime(iso: string, t: TFunction<'admin'>): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return t('crm.time.minutes', { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t('crm.time.hours', { count: hours })
  return t('crm.time.days', { count: Math.round(hours / 24) })
}
