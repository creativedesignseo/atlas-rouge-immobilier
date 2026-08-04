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
      className={`group rounded-2xl border border-border-warm bg-white p-4 transition-shadow ${
        pending ? 'opacity-50' : 'hover:shadow-md'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(lead)}
        className="w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-display font-bold ${tintFor(
              lead.id
            )}`}
          >
            {initials(lead.name) || '—'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base sm:text-lg font-bold text-ink leading-tight truncate">
              {lead.name}
            </span>
            <span className="block mt-0.5 text-sm text-stone truncate">
              {lead.email || lead.phone || '—'}
            </span>
          </span>
          {lead.priority === 'high' && (
            <span className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-terracotta/10 text-terracotta text-xs font-bold flex-shrink-0">
              <Flame size={13} />
              {t('crm.card.high')}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center h-7 px-2.5 rounded-lg bg-cream-warm border border-border-subtle text-xs font-semibold text-stone">
            {source || t('crm.card.direct')}
          </span>
          {campaign && (
            <span className="inline-flex items-center h-7 px-2.5 rounded-lg bg-cream-warm border border-border-subtle text-xs font-semibold text-stone max-w-[60%] truncate">
              {campaign}
            </span>
          )}
          {lead.property_slug && (
            <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-cream-warm border border-border-subtle text-xs font-semibold text-stone">
              <Home size={13} />
              {t('crm.card.property')}
            </span>
          )}
        </div>

        <p className="mt-3 text-xs font-medium text-stone">{relative}</p>
      </button>

      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-2">
        <button
          type="button"
          onClick={() => onMove(lead)}
          disabled={pending}
          className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-border-warm text-sm font-semibold text-ink hover:border-ink/40 disabled:opacity-50 transition-colors"
        >
          <MoveRight size={17} />
          {t('crm.card.move')}
        </button>
        {lead.phone && (
          <a
            href={`https://wa.me/${whatsappNumber(lead.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('contacts.whatsapp')}
            className="w-11 h-11 inline-flex items-center justify-center rounded-xl bg-palm text-white hover:bg-palm/90 transition-colors"
          >
            <MessageCircle size={19} />
          </a>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            aria-label={t('contacts.call')}
            className="w-11 h-11 inline-flex items-center justify-center rounded-xl border border-border-warm text-ink hover:border-ink/40 transition-colors"
          >
            <Phone size={19} />
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            aria-label={t('contacts.email')}
            className="w-11 h-11 inline-flex items-center justify-center rounded-xl border border-border-warm text-ink hover:border-ink/40 transition-colors"
          >
            <Mail size={19} />
          </a>
        )}
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
