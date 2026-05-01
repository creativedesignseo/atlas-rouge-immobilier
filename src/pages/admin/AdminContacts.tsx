import { useCallback, useEffect, useState } from 'react'
import { Mail, Trash2, Home, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getContactSubmissions, deleteContact, type ContactSubmission } from '@/services/admin/contactAdmin.service'
import { format } from 'date-fns'
import { fr, enUS, es } from 'date-fns/locale'

const DATE_LOCALES = { fr, en: enUS, es } as const

export default function AdminContacts() {
  const { t, i18n } = useTranslation('admin')
  const { agent, isAdmin } = useAuth()
  const dateLocale = DATE_LOCALES[i18n.language?.slice(0, 2) as keyof typeof DATE_LOCALES] || enUS
  const dateFormat = i18n.language?.startsWith('fr')
    ? "dd MMMM yyyy 'à' HH:mm"
    : i18n.language?.startsWith('es')
      ? "dd 'de' MMMM 'de' yyyy, HH:mm"
      : 'PP, HH:mm'
  const [contacts, setContacts] = useState<ContactSubmission[]>([])
  const [filtered, setFiltered] = useState<ContactSubmission[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadContacts = useCallback(async () => {
    if (!agent) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { contacts: data } = await getContactSubmissions(agent.id, isAdmin, 100)
      setContacts(data)
      setFiltered(data)
    } catch {
      toast.error(t('contacts.loadError'))
    } finally {
      setLoading(false)
    }
  }, [agent, isAdmin, t])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(contacts)
      return
    }
    const q = search.toLowerCase()
    setFiltered(
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q)
      )
    )
  }, [search, contacts])

  async function handleDelete(id: string) {
    if (!confirm(t('contacts.deleteConfirm'))) return

    setDeleting(id)
    try {
      await deleteContact(id)
      toast.success(t('contacts.deleteSuccess'))
      setContacts((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error(t('contacts.deleteError'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder={t('contacts.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
          />
        </div>
        <p className="text-sm text-text-secondary">
          {t('contacts.countLabel', { count: contacts.length })}
        </p>
      </div>

      {/* Contacts list */}
      <div className="bg-white rounded-2xl shadow-card border border-border-warm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Mail size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">{t('contacts.noResults')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-warm">
            {filtered.map((contact) => (
              <div key={contact.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 bg-palm/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail size={18} className="text-palm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-medium text-text-primary">{contact.name}</h4>
                        <span className="text-sm text-text-secondary">{contact.email}</span>
                        {contact.phone && (
                          <span className="text-sm text-text-secondary">• {contact.phone}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-text-primary mt-1">{contact.subject}</p>
                      {expandedId === contact.id ? (
                        <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{contact.message}</p>
                      ) : (
                        <p className="text-sm text-text-secondary mt-2 line-clamp-2">{contact.message}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                          className="text-xs text-terracotta hover:underline"
                        >
                          {expandedId === contact.id ? t('contacts.collapse') : t('contacts.expand')}
                        </button>
                        {contact.property_slug && (
                          <a
                            href={`/property/${contact.property_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-palm hover:underline"
                          >
                            <Home size={12} />
                            {t('contacts.viewProperty')}
                          </a>
                        )}
                        <span className="text-xs text-text-secondary">
                          {format(new Date(contact.created_at), dateFormat, { locale: dateLocale })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    disabled={deleting === contact.id}
                    className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {deleting === contact.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
