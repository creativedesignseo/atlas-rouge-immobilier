import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import {
  getContactSubmissions,
  type ContactSubmission,
} from '@/services/admin/contactAdmin.service'
import { updateLeadStage } from '@/services/admin/crm.service'
import type { LeadStage } from '@/types/supabase'
import PipelineOverview from '@/components/admin/crm/PipelineOverview'
import PipelineBoard from '@/components/admin/crm/PipelineBoard'
import LeadDrawer from '@/components/admin/crm/LeadDrawer'
import LeadStageSelector from '@/components/admin/crm/LeadStageSelector'
import { STAGES, campaignOf } from '@/components/admin/crm/stages'

type RangeFilter = 'all' | 'today' | 'week' | 'month'

const RANGE_DAYS: Record<Exclude<RangeFilter, 'all' | 'today'>, number> = { week: 7, month: 30 }

function isWithinDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

/**
 * CRM pipeline — the leads centre.
 *
 * Structure follows references/crm_prototipo_2026_v2.html (funnel on top,
 * kanban below, detail drawer) but the palette, type and components are this
 * project's: white/cream surfaces, ink text, terracotta as the single accent.
 * Data, RLS and permissions are unchanged — an agent still sees only the leads
 * assigned to them, and only an admin can reassign or delete.
 */
export default function AdminContacts() {
  const { t, i18n } = useTranslation('admin')
  const { agent, isAdmin } = useAuth()
  const siteLang = (i18n.language?.slice(0, 2) || 'en') as 'en' | 'fr' | 'es'

  const [contacts, setContacts] = useState<ContactSubmission[]>([])
  const [search, setSearch] = useState('')
  const [range, setRange] = useState<RangeFilter>('all')
  const [mobileStage, setMobileStage] = useState<LeadStage>('new')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ContactSubmission | null>(null)
  const [moveTarget, setMoveTarget] = useState<ContactSubmission | null>(null)

  // t intentionally not in deps — would refetch on every language switch.
  const loadContacts = useCallback(async () => {
    if (!agent) {
      setLoading(false)
      return
    }
    try {
      const { contacts: data } = await getContactSubmissions(agent.id, isAdmin, 200)
      setContacts(data)
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, isAdmin])

  useEffect(() => {
    // Spinner only on first load; keep the previous board visible on re-mounts
    // (back-navigation, language switch).
    if (contacts.length === 0) setLoading(true)
    loadContacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadContacts])

  const filtered = useMemo(() => {
    let list = contacts
    if (range === 'today') list = list.filter((c) => isToday(c.created_at))
    else if (range !== 'all') list = list.filter((c) => isWithinDays(c.created_at, RANGE_DAYS[range]))

    const q = search.trim().toLowerCase()
    if (!q) return list
    // Every field is optional-safe: phone-only leads have no email (migration
    // 016) and `null.toLowerCase()` used to crash the page. The message is
    // searchable because it carries the campaign attribution, so "fr-diaspora"
    // finds the leads one campaign brought in.
    return list.filter((c) =>
      [c.name, c.email, c.phone, c.subject, c.message].some((f) => f?.toLowerCase().includes(q))
    )
  }, [contacts, search, range])

  const counts = useMemo(() => {
    const base = Object.fromEntries(STAGES.map((s) => [s.id, 0])) as Record<LeadStage, number>
    for (const lead of filtered) base[lead.stage] = (base[lead.stage] ?? 0) + 1
    return base
  }, [filtered])

  const stats = useMemo(() => {
    const total = contacts.length
    const won = contacts.filter((c) => c.stage === 'won').length
    const inProgress = contacts.filter((c) =>
      ['contacted', 'qualified', 'proposal'].includes(c.stage)
    ).length
    // "Waiting" = still at the first stage more than 24h after landing. That is
    // the number worth acting on: a lead nobody has touched.
    const waiting = contacts.filter(
      (c) => c.stage === 'new' && !isWithinDays(c.created_at, 1)
    ).length
    return {
      total,
      inProgress,
      waiting,
      conversion: total ? `${((won / total) * 100).toFixed(1)}%` : '—',
      campaigns: new Set(contacts.map((c) => campaignOf(c.message)).filter(Boolean)).size,
    }
  }, [contacts])

  /**
   * Optimistic stage change. The card moves immediately, then the PATCH runs;
   * on failure the previous list is restored and the error surfaces. Without
   * the rollback an RLS refusal would look like a successful move until reload.
   */
  const moveLead = useCallback(
    async (leadId: string, stage: LeadStage) => {
      const lead = contacts.find((c) => c.id === leadId)
      if (!lead || lead.stage === stage) return
      const previous = contacts
      setPendingId(leadId)
      setContacts((prev) => prev.map((c) => (c.id === leadId ? { ...c, stage } : c)))
      try {
        await updateLeadStage(
          leadId,
          stage,
          agent ? { id: agent.id, name: agent.name } : null,
          lead.stage
        )
        toast.success(t('crm.toast.moved', { name: lead.name, stage: t(`crm.stages.${stage}.label`) }))
      } catch (error) {
        setContacts(previous)
        toast.error(error instanceof Error ? error.message : t('crm.toast.moveError'))
      } finally {
        setPendingId(null)
      }
    },
    [contacts, agent, t]
  )

  function exportCsv() {
    const header = ['name', 'email', 'phone', 'subject', 'stage', 'priority', 'created_at']
    const rows = filtered.map((c) =>
      [c.name, c.email ?? '', c.phone ?? '', c.subject, c.stage, c.priority, c.created_at]
        // Quote everything and double inner quotes — subjects contain commas.
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `atlas-rouge-leads-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const RANGES: { key: RangeFilter; label: string }[] = [
    { key: 'all', label: t('contacts.filters.all') },
    { key: 'today', label: t('contacts.filters.today') },
    { key: 'week', label: t('contacts.filters.week') },
    { key: 'month', label: t('contacts.filters.month') },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone">
            {t('crm.header.eyebrow')}
          </p>
          <h1 className="mt-1.5 font-display text-2xl sm:text-4xl font-bold text-ink leading-none">
            {t('crm.header.title')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone max-w-xl">
            {t('crm.header.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="min-h-[48px] px-5 inline-flex items-center justify-center gap-2 rounded-xl border border-border-warm bg-white text-base font-semibold text-ink hover:border-ink/40 disabled:opacity-50 transition-colors"
        >
          <Download size={19} />
          {t('crm.header.export')}
        </button>
      </header>

      {/* Metrics — all computed from the real rows */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('crm.stats.total'), value: stats.total, hint: null },
          { label: t('crm.stats.inProgress'), value: stats.inProgress, hint: null },
          {
            label: t('crm.stats.waiting'),
            value: stats.waiting,
            hint: stats.waiting > 0 ? t('crm.stats.waitingHint') : null,
          },
          { label: t('crm.stats.conversion'), value: stats.conversion, hint: null },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border-warm bg-white px-4 py-4 sm:px-5 sm:py-5"
          >
            <p className="font-display text-3xl sm:text-4xl font-bold text-ink leading-none tabular-nums">
              {stat.value}
            </p>
            <p className="mt-2 text-xs sm:text-sm font-medium text-stone uppercase tracking-wide">
              {stat.label}
            </p>
            {stat.hint && <p className="mt-1 text-xs text-terracotta font-semibold">{stat.hint}</p>}
          </div>
        ))}
      </div>

      <PipelineOverview counts={counts} activeStage={mobileStage} onSelect={setMobileStage} />

      {/* Toolbar */}
      <div className="sticky top-0 z-20 -mx-6 px-6 py-3 bg-gray-50/95 backdrop-blur lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none space-y-3">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone pointer-events-none"
            size={20}
          />
          <input
            type="text"
            inputMode="search"
            placeholder={t('contacts.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-12 text-base bg-white border border-border-warm rounded-2xl placeholder:text-stone/70 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t('actions.cancel')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-stone hover:text-ink rounded-xl hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={`shrink-0 h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
                range === r.key
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-stone border-border-warm hover:border-ink/30 hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
          <span className="ml-auto shrink-0 pl-3 text-sm font-medium text-stone tabular-nums">
            {t('contacts.countLabel', { count: filtered.length })}
          </span>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-border-warm">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-border-warm text-center px-6">
          <AlertTriangle size={40} className="text-terracotta mb-3" />
          <p className="text-lg font-semibold text-ink">{t('contacts.loadError')}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              loadContacts()
            }}
            className="mt-4 min-h-[48px] px-5 rounded-xl bg-ink text-white font-semibold"
          >
            {t('crm.retry')}
          </button>
        </div>
      ) : (
        <PipelineBoard
          leads={filtered}
          mobileStage={mobileStage}
          pendingId={pendingId}
          onOpen={setSelected}
          onMove={setMoveTarget}
          onDropOnStage={moveLead}
        />
      )}

      <LeadStageSelector
        open={moveTarget !== null}
        leadName={moveTarget?.name ?? ''}
        currentStage={moveTarget?.stage ?? 'new'}
        onSelect={(stage) => {
          if (moveTarget) moveLead(moveTarget.id, stage)
          setMoveTarget(null)
        }}
        onClose={() => setMoveTarget(null)}
      />

      <LeadDrawer
        lead={selected}
        actor={agent ? { id: agent.id, name: agent.name } : null}
        isAdmin={isAdmin}
        siteLang={siteLang}
        onClose={() => setSelected(null)}
        onSaved={(updated) =>
          setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        }
        onDeleted={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
      />
    </div>
  )
}
