import { useCallback, useEffect, useMemo, useState } from 'react'
import { Mail, Trash2, Home, Search, Phone, MessageCircle, Copy, X, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useConfirm } from '@/components/admin/ConfirmDialog'
import { getContactSubmissions, deleteContact, type ContactSubmission } from '@/services/admin/contactAdmin.service'
import { format } from 'date-fns'
import { fr, enUS, es } from 'date-fns/locale'

const DATE_LOCALES = { fr, en: enUS, es } as const

type RangeFilter = 'all' | 'today' | 'week' | 'month'

const RANGE_DAYS: Record<Exclude<RangeFilter, 'all' | 'today'>, number> = { week: 7, month: 30 }

// Deterministic avatar tint so the same lead always keeps the same colour —
// scanning a long list is much faster when the blocks are visually stable.
const AVATAR_TINTS = [
  'bg-terracotta/12 text-terracotta',
  'bg-palm/12 text-palm',
  'bg-gold/20 text-[#8A6E32]',
  'bg-midnight/10 text-midnight',
] as const

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function tintFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_TINTS[hash % AVATAR_TINTS.length]
}

// wa.me needs digits only, no leading "+" and no "00" international prefix.
function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('00') ? digits.slice(2) : digits
}

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

export default function AdminContacts() {
  const { t, i18n } = useTranslation('admin')
  const { agent, isAdmin } = useAuth()
  const confirm = useConfirm()
  const dateLocale = DATE_LOCALES[i18n.language?.slice(0, 2) as keyof typeof DATE_LOCALES] || enUS
  const siteLang = (i18n.language?.slice(0, 2) || 'en') as 'en' | 'fr' | 'es'
  const dateFormat = i18n.language?.startsWith('fr')
    ? "dd MMM yyyy 'à' HH:mm"
    : i18n.language?.startsWith('es')
      ? "dd MMM yyyy, HH:mm"
      : 'PP, HH:mm'
  const [contacts, setContacts] = useState<ContactSubmission[]>([])
  const [search, setSearch] = useState('')
  const [range, setRange] = useState<RangeFilter>('all')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // t intentionally not in deps — would refetch on every language switch.
  const loadContacts = useCallback(async () => {
    if (!agent) {
      setLoading(false)
      return
    }
    try {
      const { contacts: data } = await getContactSubmissions(agent.id, isAdmin, 100)
      setContacts(data)
    } catch {
      toast.error(t('contacts.loadError'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, isAdmin])

  useEffect(() => {
    // Spinner only on first load; keep the previous list visible on
    // subsequent re-mounts (back-navigation, language switch, etc.).
    if (contacts.length === 0) setLoading(true)
    loadContacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadContacts])

  const stats = useMemo(
    () => ({
      total: contacts.length,
      today: contacts.filter((c) => isToday(c.created_at)).length,
      week: contacts.filter((c) => isWithinDays(c.created_at, 7)).length,
    }),
    [contacts]
  )

  const filtered = useMemo(() => {
    let list = contacts
    if (range === 'today') list = list.filter((c) => isToday(c.created_at))
    else if (range !== 'all') list = list.filter((c) => isWithinDays(c.created_at, RANGE_DAYS[range]))

    const q = search.trim().toLowerCase()
    if (!q) return list
    // Every field is optional-safe: phone-only leads have no email (migration
    // 016), and `null.toLowerCase()` used to crash the whole page. Phone and
    // message are searchable too — the message carries the campaign
    // attribution, so "fr-diaspora" finds the leads a campaign brought in.
    return list.filter((c) =>
      [c.name, c.email, c.phone, c.subject, c.message].some((field) => field?.toLowerCase().includes(q))
    )
  }, [contacts, search, range])

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: t('actions.delete'),
      description: t('contacts.deleteConfirm'),
      confirmLabel: t('actions.delete'),
      cancelLabel: t('actions.cancel'),
      destructive: true,
    })
    if (!ok) return

    // Optimistic: drop the row now and restore it if the server refuses.
    // Waiting for the round-trip meant ~1-1.5s of spinner for an operation
    // that practically always succeeds.
    const previous = contacts
    setDeleting(id)
    setContacts((prev) => prev.filter((c) => c.id !== id))
    try {
      await deleteContact(id)
      toast.success(t('contacts.deleteSuccess'))
    } catch {
      setContacts(previous)
      toast.error(t('contacts.deleteError'))
    } finally {
      setDeleting(null)
    }
  }

  async function copyContact(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('contacts.copied'))
    } catch {
      toast.error(t('contacts.copyError'))
    }
  }

  const RANGES: { key: RangeFilter; label: string }[] = [
    { key: 'all', label: t('contacts.filters.all') },
    { key: 'today', label: t('contacts.filters.today') },
    { key: 'week', label: t('contacts.filters.week') },
    { key: 'month', label: t('contacts.filters.month') },
  ]

  return (
    <div className="space-y-6">
      {/* Stats — big numbers, readable at a glance on a phone */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: t('contacts.stats.total'), value: stats.total },
          { label: t('contacts.stats.week'), value: stats.week },
          { label: t('contacts.stats.today'), value: stats.today },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-border-warm shadow-sm px-4 py-4 sm:px-5 sm:py-5"
          >
            <p className="font-display text-3xl sm:text-4xl font-bold text-ink leading-none tabular-nums">
              {stat.value}
            </p>
            <p className="mt-2 text-xs sm:text-sm font-medium text-stone uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar — sticky on mobile so search and filters stay reachable */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-gray-50/95 backdrop-blur lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none space-y-3">
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
            className="w-full h-12 pl-12 pr-12 text-base bg-white border border-border-warm rounded-2xl shadow-sm placeholder:text-stone/70 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t('actions.cancel')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-stone hover:text-ink rounded-xl hover:bg-gray-100 transition-colors"
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

      {/* Leads */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-border-warm">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-border-warm text-stone">
          <Inbox size={56} className="mb-4 opacity-25" />
          <p className="text-lg font-semibold text-ink">{t('contacts.noResults')}</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((contact) => {
            const expanded = expandedId === contact.id
            return (
              <article
                key={contact.id}
                className="bg-white rounded-2xl border border-border-warm shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-display font-bold text-base sm:text-lg ${tintFor(
                      contact.id
                    )}`}
                  >
                    {initials(contact.name) || <Mail size={22} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg sm:text-xl font-bold text-ink leading-tight truncate">
                      {contact.name}
                    </h3>
                    <p className="mt-1 text-sm sm:text-base font-semibold text-terracotta break-words">
                      {contact.subject}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(contact.id)}
                      disabled={deleting === contact.id}
                      aria-label={t('actions.delete')}
                      className="w-11 h-11 flex items-center justify-center text-stone hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {deleting === contact.id ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  )}
                </div>

                {/* Contact details — tappable, with copy */}
                <div className="mt-4 space-y-2">
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex-1 min-w-0 flex items-center gap-2.5 text-sm sm:text-base text-ink hover:text-terracotta transition-colors"
                      >
                        <Mail size={18} className="text-stone flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyContact(contact.email!)}
                        aria-label={t('contacts.copy')}
                        className="w-9 h-9 flex items-center justify-center text-stone hover:text-ink hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex-1 min-w-0 flex items-center gap-2.5 text-sm sm:text-base text-ink hover:text-terracotta transition-colors"
                      >
                        <Phone size={18} className="text-stone flex-shrink-0" />
                        <span className="truncate tabular-nums">{contact.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyContact(contact.phone!)}
                        aria-label={t('contacts.copy')}
                        className="w-9 h-9 flex items-center justify-center text-stone hover:text-ink hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {contact.message && (
                  <div className="mt-3">
                    <p
                      className={`text-sm text-stone whitespace-pre-wrap break-words ${
                        expanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {contact.message}
                    </p>
                    <button
                      onClick={() => setExpandedId(expanded ? null : contact.id)}
                      className="mt-1 text-sm font-semibold text-terracotta hover:underline"
                    >
                      {expanded ? t('contacts.collapse') : t('contacts.expand')}
                    </button>
                  </div>
                )}

                {/* Primary actions — big, unmistakable targets */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {contact.phone && (
                    <a
                      href={`https://wa.me/${whatsappNumber(contact.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-palm text-white text-sm sm:text-base font-semibold hover:bg-palm/90 active:scale-[0.98] transition-all"
                    >
                      <MessageCircle size={20} />
                      {t('contacts.whatsapp')}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-white text-sm sm:text-base font-semibold hover:bg-ink/90 active:scale-[0.98] transition-all"
                    >
                      <Phone size={20} />
                      {t('contacts.call')}
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className={`h-12 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border-warm text-ink text-sm sm:text-base font-semibold hover:border-ink/40 active:scale-[0.98] transition-all ${
                        contact.phone ? '' : 'col-span-2'
                      }`}
                    >
                      <Mail size={20} />
                      {t('contacts.email')}
                    </a>
                  )}
                  {contact.property_slug && (
                    <button
                      onClick={() => window.open(`/${siteLang}/property/${contact.property_slug}`, '_blank')}
                      className={`h-12 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border-warm text-ink text-sm sm:text-base font-semibold hover:border-ink/40 active:scale-[0.98] transition-all ${
                        contact.email && contact.phone ? 'col-span-2' : ''
                      }`}
                    >
                      <Home size={20} />
                      {t('contacts.viewProperty')}
                    </button>
                  )}
                </div>

                <p className="mt-3 pt-3 border-t border-border-subtle text-xs sm:text-sm text-stone">
                  {format(new Date(contact.created_at), dateFormat, { locale: dateLocale })}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
