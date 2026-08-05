import { useEffect, useState } from 'react'
import {
  Clock,
  Home,
  Trash2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Save,
  UserCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/admin/ConfirmDialog'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { format } from 'date-fns'
import { enUS, es, fr } from 'date-fns/locale'
import { deleteContact, type ContactSubmission } from '@/services/admin/contactAdmin.service'
import type { LeadActivityRow, LeadNoteRow, LeadPriority, LeadStage } from '@/types/supabase'
import {
  addLeadNote,
  assignLead,
  deleteLeadNote,
  getAssignableAgents,
  getLeadActivity,
  getLeadNotes,
  markLeadLost,
  setFollowUp,
  updateLeadPriority,
  updateLeadStage,
  type AgentOption,
  type CrmActor,
} from '@/services/admin/crm.service'
import { STAGES, initials, tintFor, whatsappNumber } from './stages'

const DATE_LOCALES = { fr, en: enUS, es } as const

interface Props {
  lead: ContactSubmission | null
  actor: CrmActor | null
  isAdmin: boolean
  siteLang: string
  onClose: () => void
  /** Called with the patched lead so the board updates without a refetch. */
  onSaved: (lead: ContactSubmission) => void
  /** Admin-only hard delete. Kept from the previous screen — losing it would
   *  strand junk rows in the pipeline with no way to remove them. */
  onDeleted: (id: string) => void
}

/**
 * Detail panel: side sheet on desktop, bottom sheet on phones.
 *
 * Written by hand rather than reusing ui/drawer.tsx (vaul) because that one is
 * a bottom sheet everywhere; the CRM needs the desktop side panel from the
 * reference prototype and the two behaviours share this single component.
 */
export default function LeadDrawer({
  lead,
  actor,
  isAdmin,
  siteLang,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const { t, i18n } = useTranslation('admin')
  const confirm = useConfirm()
  const dateLocale =
    DATE_LOCALES[i18n.language?.slice(0, 2) as keyof typeof DATE_LOCALES] || enUS

  const [stage, setStage] = useState<LeadStage>('new')
  const [priority, setPriority] = useState<LeadPriority>('normal')
  const [assignee, setAssignee] = useState<string>('')
  const [followUp, setFollowUpValue] = useState<string>('')
  const [noteBody, setNoteBody] = useState('')
  const [notes, setNotes] = useState<LeadNoteRow[]>([])
  const [activity, setActivity] = useState<LeadActivityRow[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [saving, setSaving] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [historyError, setHistoryError] = useState(false)

  // Reset the form whenever a different lead is opened.
  useEffect(() => {
    if (!lead) return
    setStage(lead.stage)
    setPriority(lead.priority)
    setAssignee(lead.assigned_to_agent_id ?? '')
    setFollowUpValue(lead.next_follow_up_at ? toLocalInput(lead.next_follow_up_at) : '')
    setNoteBody('')
    setHistoryError(false)
    setNotes([])
    setActivity([])
    let cancelled = false
    Promise.all([getLeadNotes(lead.id), getLeadActivity(lead.id)])
      .then(([n, a]) => {
        if (cancelled) return
        setNotes(n)
        setActivity(a)
      })
      .catch(() => {
        if (!cancelled) setHistoryError(true)
      })
    return () => {
      cancelled = true
    }
  }, [lead])

  // The assignment picker only exists for admins: RLS lets an agent read its
  // own row only, so for them the list would be a one-item dead end.
  useEffect(() => {
    if (!isAdmin || !lead) return
    getAssignableAgents()
      .then(setAgents)
      .catch(() => setAgents([]))
  }, [isAdmin, lead])

  useEffect(() => {
    if (!lead) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lead, onClose])

  if (!lead) return null

  async function handleSave() {
    if (!lead) return
    setSaving(true)
    // Each field is its own PATCH so a rejected one does not silently take the
    // others down with it. Only changed fields are sent.
    try {
      if (stage !== lead.stage) await updateLeadStage(lead.id, stage, actor, lead.stage)
      if (priority !== lead.priority) await updateLeadPriority(lead.id, priority, actor)
      if ((assignee || null) !== lead.assigned_to_agent_id) {
        const name = agents.find((a) => a.id === assignee)?.name ?? null
        await assignLead(lead.id, assignee || null, name, actor)
      }
      const nextIso = followUp ? new Date(followUp).toISOString() : null
      if (nextIso !== lead.next_follow_up_at) await setFollowUp(lead.id, nextIso, actor)

      onSaved({
        ...lead,
        stage,
        priority,
        assigned_to_agent_id: assignee || null,
        next_follow_up_at: nextIso,
      })
      toast.success(t('crm.toast.saved'))
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('crm.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddNote() {
    if (!lead || !noteBody.trim()) return
    setSavingNote(true)
    try {
      const created = await addLeadNote(lead.id, noteBody.trim(), actor)
      setNotes((prev) => [created, ...prev])
      setNoteBody('')
      toast.success(t('crm.toast.noteSaved'))
    } catch {
      toast.error(t('crm.toast.noteError'))
    } finally {
      setSavingNote(false)
    }
  }

  async function handleDeleteNote(noteId: string) {
    const ok = await confirm({
      title: t('crm.drawer.deleteNote'),
      description: t('crm.drawer.deleteNoteConfirm'),
      confirmLabel: t('actions.delete'),
      cancelLabel: t('actions.cancel'),
      destructive: true,
    })
    if (!ok) return
    // Optimistic: the note disappears now and comes back if the server refuses.
    const previous = notes
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    try {
      await deleteLeadNote(noteId)
      toast.success(t('crm.drawer.noteDeleted'))
    } catch {
      setNotes(previous)
      toast.error(t('crm.drawer.noteDeleteError'))
    }
  }

  async function handleDelete() {
    if (!lead) return
    const ok = await confirm({
      title: t('actions.delete'),
      description: t('contacts.deleteConfirm'),
      confirmLabel: t('actions.delete'),
      cancelLabel: t('actions.cancel'),
      destructive: true,
    })
    if (!ok) return
    setSaving(true)
    try {
      await deleteContact(lead.id)
      onDeleted(lead.id)
      toast.success(t('contacts.deleteSuccess'))
      onClose()
    } catch {
      toast.error(t('contacts.deleteError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleLost() {
    if (!lead) return
    setSaving(true)
    try {
      await markLeadLost(lead.id, null, actor, lead.stage)
      onSaved({ ...lead, stage: 'lost' })
      toast.success(t('crm.toast.lost'))
      onClose()
    } catch {
      toast.error(t('crm.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
      <button
        type="button"
        aria-label={t('actions.cancel')}
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={lead.name}
        className="relative w-full lg:w-[440px] lg:m-3 bg-white border border-border-warm rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] lg:max-h-none"
      >
        <header className="flex items-start gap-3 p-4 sm:p-5 border-b border-border-warm">
          <span
            aria-hidden
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold flex-shrink-0 ${tintFor(
              lead.id
            )}`}
          >
            {initials(lead.name) || '—'}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold text-ink leading-tight truncate">
              {lead.name}
            </h2>
            <p className="mt-0.5 text-sm text-stone truncate">{lead.subject}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('actions.cancel')}
            className="w-11 h-11 flex items-center justify-center rounded-xl border border-border-warm text-stone hover:text-ink flex-shrink-0"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Contact block */}
          <section className="rounded-2xl bg-ink text-white p-4">
            <p className="text-sm text-white/70">{t('crm.drawer.contact')}</p>
            <div className="mt-2 space-y-1">
              {lead.email && <p className="text-base font-semibold break-all">{lead.email}</p>}
              {lead.phone && <p className="text-base font-semibold tabular-nums">{lead.phone}</p>}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <a
                href={lead.phone ? `tel:${lead.phone}` : undefined}
                aria-disabled={!lead.phone}
                className={`min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 border border-white/15 text-sm font-semibold ${
                  lead.phone ? 'hover:bg-white/20' : 'opacity-40 pointer-events-none'
                }`}
              >
                <Phone size={17} />
                {t('contacts.call')}
              </a>
              <a
                href={lead.phone ? `https://wa.me/${whatsappNumber(lead.phone)}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!lead.phone}
                className={`min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 border border-white/15 text-sm font-semibold ${
                  lead.phone ? 'hover:bg-white/20' : 'opacity-40 pointer-events-none'
                }`}
              >
                <MessageCircle size={17} />
                WhatsApp
              </a>
              <a
                href={lead.email ? `mailto:${lead.email}` : undefined}
                aria-disabled={!lead.email}
                className={`min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 border border-white/15 text-sm font-semibold ${
                  lead.email ? 'hover:bg-white/20' : 'opacity-40 pointer-events-none'
                }`}
              >
                <Mail size={17} />
                {t('contacts.email')}
              </a>
            </div>
          </section>

          {/* Stage */}
          <section>
            <h3 className="text-sm font-bold text-ink mb-2">{t('crm.drawer.stage')}</h3>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id)}
                  aria-pressed={stage === s.id}
                  className={`min-h-[44px] px-3.5 rounded-xl border text-sm font-semibold transition-colors ${
                    stage === s.id
                      ? 'border-ink bg-ink text-white'
                      : 'border-border-warm text-stone hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  {t(`crm.stages.${s.id}.label`)}
                </button>
              ))}
            </div>
          </section>

          {/* Priority */}
          <section>
            <h3 className="text-sm font-bold text-ink mb-2">{t('crm.drawer.priority')}</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'normal', 'high'] as LeadPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  aria-pressed={priority === p}
                  className={`min-h-[48px] rounded-xl border text-sm font-semibold transition-colors ${
                    priority === p
                      ? 'border-ink bg-cream-warm text-ink'
                      : 'border-border-warm text-stone hover:border-ink/40'
                  }`}
                >
                  {t(`crm.priority.${p}`)}
                </button>
              ))}
            </div>
          </section>

          {/* Assignment — admins only (RLS) */}
          {isAdmin && (
            <section>
              <label htmlFor="lead-assignee" className="block text-sm font-bold text-ink mb-2">
                {t('crm.drawer.assignee')}
              </label>
              <select
                id="lead-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full min-h-[52px] px-3 rounded-xl border border-border-warm bg-white text-base text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              >
                <option value="">{t('crm.drawer.unassigned')}</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.email}
                  </option>
                ))}
              </select>
            </section>
          )}

          {/* Follow-up */}
          <section>
            <label htmlFor="lead-followup" className="block text-sm font-bold text-ink mb-2">
              {t('crm.drawer.followUp')}
            </label>
            <input
              id="lead-followup"
              type="datetime-local"
              value={followUp}
              onChange={(e) => setFollowUpValue(e.target.value)}
              className="w-full min-h-[52px] px-3 rounded-xl border border-border-warm bg-white text-base text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            <p className="mt-1.5 text-xs text-stone">{t('crm.drawer.followUpHint')}</p>
          </section>

          {/* Original message */}
          <section>
            <h3 className="text-sm font-bold text-ink mb-2">{t('crm.drawer.message')}</h3>
            <p className="text-sm text-stone whitespace-pre-wrap break-words rounded-xl bg-cream-warm border border-border-subtle p-3">
              {lead.message || '—'}
            </p>
            {lead.property_slug && (
              <button
                type="button"
                onClick={() => window.open(`/${siteLang}/property/${lead.property_slug}`, '_blank')}
                className="mt-2 min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border-warm text-sm font-semibold text-ink hover:border-ink/40"
              >
                <Home size={17} />
                {t('contacts.viewProperty')}
              </button>
            )}
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-bold text-ink mb-2">{t('crm.drawer.notes')}</h3>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder={t('crm.drawer.notePlaceholder')}
              className="w-full p-3 rounded-xl border border-border-warm bg-white text-base text-ink placeholder:text-stone/60 focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-y"
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!noteBody.trim() || savingNote}
              className="mt-2 min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border-warm text-sm font-semibold text-ink hover:border-ink/40 disabled:opacity-50"
            >
              <MessageSquare size={17} />
              {savingNote ? t('crm.drawer.savingNote') : t('crm.drawer.addNote')}
            </button>

            {notes.length > 0 && (
              <ul className="mt-3 space-y-2">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-xl border border-border-subtle bg-cream-warm p-3 flex items-start gap-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink whitespace-pre-wrap break-words">
                        {note.body}
                      </span>
                      <span className="block mt-1 text-xs text-stone">
                        {format(new Date(note.created_at), 'PP, HH:mm', { locale: dateLocale })}
                      </span>
                    </span>
                    {/* Shown only to who RLS would actually let through: the
                        author or an admin. Anyone else would get a refusal. */}
                    {(isAdmin || (actor?.id && note.agent_id === actor.id)) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        aria-label={t('crm.drawer.deleteNote')}
                        className="w-9 h-9 flex-shrink-0 inline-flex items-center justify-center rounded-lg text-stone hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Activity */}
          <section>
            <h3 className="text-sm font-bold text-ink mb-2">{t('crm.drawer.activity')}</h3>
            {historyError ? (
              <p className="text-sm text-stone">{t('crm.drawer.historyError')}</p>
            ) : activity.length === 0 ? (
              <p className="text-sm text-stone">{t('crm.drawer.noActivity')}</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <span className="w-9 h-9 rounded-xl bg-cream-warm border border-border-subtle flex items-center justify-center flex-shrink-0 text-stone">
                      {item.type === 'assignment' ? (
                        <UserCheck size={16} />
                      ) : item.type === 'note' ? (
                        <MessageSquare size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {describeActivity(item, t)}
                      </span>
                      <span className="block text-xs text-stone">
                        {format(new Date(item.created_at), 'PP, HH:mm', { locale: dateLocale })}
                        {item.agent_name ? ` · ${item.agent_name}` : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {isAdmin && (
            <section className="pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border-warm text-sm font-semibold text-stone hover:border-red-300 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={17} />
                {t('crm.drawer.delete')}
              </button>
            </section>
          )}
        </div>

        <footer className="p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-5 border-t border-border-warm grid grid-cols-2 gap-2 bg-white">
          <button
            type="button"
            onClick={handleLost}
            disabled={saving}
            className="min-h-[52px] rounded-xl border border-border-warm text-base font-semibold text-ink hover:border-red-300 hover:text-red-700 disabled:opacity-50 transition-colors"
          >
            {t('crm.drawer.markLost')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-white text-base font-semibold hover:bg-ink/90 disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {saving ? t('crm.drawer.saving') : t('crm.drawer.save')}
          </button>
        </footer>
      </aside>
    </div>
  )
}

/** ISO -> value accepted by <input type="datetime-local"> in local time. */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}

function describeActivity(item: LeadActivityRow, t: TFunction<'admin'>): string {
  if (item.type === 'stage_change' && item.to_stage) {
    return t('crm.activity.stageChange', {
      to: t(`crm.stages.${item.to_stage}.label`),
    })
  }
  if (item.type === 'assignment') {
    return t('crm.activity.assignment', { name: item.detail || t('crm.drawer.unassigned') })
  }
  if (item.type === 'note') return t('crm.activity.note')
  if (item.type === 'follow_up') return t('crm.activity.followUp')
  return t('crm.activity.other')
}
