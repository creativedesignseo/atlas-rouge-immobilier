import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Mail, Inbox, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import {
  listEstimationRequests,
  listNewsletterSubscribers,
  type EstimationRequest,
  type NewsletterSubscriber,
} from '@/services/admin/leadsAdmin.service'
import { format } from 'date-fns'
import { fr, enUS, es } from 'date-fns/locale'

const DATE_LOCALES = { fr, en: enUS, es } as const

type Tab = 'estimations' | 'newsletter'

export default function AdminLeads() {
  const { t, i18n } = useTranslation('admin')
  const { agent } = useAuth()
  const dateLocale = DATE_LOCALES[i18n.language?.slice(0, 2) as keyof typeof DATE_LOCALES] || enUS
  const dateFormat = i18n.language?.startsWith('fr')
    ? "dd MMMM yyyy 'à' HH:mm"
    : i18n.language?.startsWith('es')
      ? "dd 'de' MMMM 'de' yyyy, HH:mm"
      : 'PP, HH:mm'

  const [tab, setTab] = useState<Tab>('estimations')
  const [estimations, setEstimations] = useState<EstimationRequest[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fmtDate = (iso: string) => format(new Date(iso), dateFormat, { locale: dateLocale })

  // t intentionally not in deps — would refetch on every language switch.
  const load = useCallback(async () => {
    if (!agent) {
      setLoading(false)
      return
    }
    setError(false)
    try {
      const [est, subs] = await Promise.all([
        listEstimationRequests(),
        listNewsletterSubscribers(),
      ])
      setEstimations(est)
      setSubscribers(subs)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent])

  useEffect(() => {
    if (estimations.length === 0 && subscribers.length === 0) setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  function exportNewsletterCsv() {
    const header = ['email', 'source_lang', 'source_page', 'confirmed', 'created_at']
    const rows = subscribers.map((s) =>
      [s.email, s.source_lang ?? '', s.source_page ?? '', String(s.confirmed), s.created_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const tabBtn = (value: Tab, label: string, count: number) => (
    <button
      onClick={() => setTab(value)}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        tab === value
          ? 'bg-terracotta text-white'
          : 'text-text-secondary hover:bg-gray-100'
      }`}
    >
      {label}
      <span
        className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
          tab === value ? 'bg-white/20' : 'bg-gray-200 text-text-secondary'
        }`}
      >
        {count}
      </span>
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          {t('leads.title')}
        </h1>
        <p className="text-sm text-text-secondary mt-1">{t('leads.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabBtn('estimations', t('leads.tabs.estimations'), estimations.length)}
        {tabBtn('newsletter', t('leads.tabs.newsletter'), subscribers.length)}
      </div>

      {/* Panel */}
      <div className="bg-white rounded-2xl shadow-card border border-border-warm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Inbox size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">{t('leads.loadError')}</p>
          </div>
        ) : tab === 'estimations' ? (
          estimations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
              <ClipboardList size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">{t('leads.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-secondary border-b border-border-warm">
                    <th className="px-6 py-3 font-medium">{t('leads.estTable.name')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.estTable.phone')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.estTable.email')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.estTable.preferredDate')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.estTable.lang')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.estTable.createdAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm">
                  {estimations.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">{e.name}</td>
                      <td className="px-6 py-4 text-text-secondary">{e.phone}</td>
                      <td className="px-6 py-4 text-text-secondary">{e.email || '—'}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        {e.preferred_date
                          ? format(new Date(e.preferred_date), 'P', { locale: dateLocale })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary uppercase">{e.source_lang || '—'}</td>
                      <td className="px-6 py-4 text-text-secondary">{fmtDate(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Mail size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">{t('leads.empty')}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-end p-4 border-b border-border-warm">
              <button
                onClick={exportNewsletterCsv}
                className="inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:underline"
              >
                <Download size={16} />
                {t('leads.exportCsv')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-secondary border-b border-border-warm">
                    <th className="px-6 py-3 font-medium">{t('leads.subTable.email')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.subTable.lang')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.subTable.sourcePage')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.subTable.confirmed')}</th>
                    <th className="px-6 py-3 font-medium">{t('leads.subTable.createdAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm">
                  {subscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">{s.email}</td>
                      <td className="px-6 py-4 text-text-secondary uppercase">{s.source_lang || '—'}</td>
                      <td className="px-6 py-4 text-text-secondary">{s.source_page || '—'}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        {s.unsubscribed_at
                          ? t('leads.unsubscribed')
                          : s.confirmed
                            ? t('leads.confirmedYes')
                            : t('leads.confirmedNo')}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
