import { useEffect, useState } from 'react'
import { Mail, Trash2, Home, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { getContactSubmissions, deleteContact, type ContactSubmission } from '@/services/admin/contactAdmin.service'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminContacts() {
  const { agent, isAdmin } = useAuth()
  const [contacts, setContacts] = useState<ContactSubmission[]>([])
  const [filtered, setFiltered] = useState<ContactSubmission[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadContacts()
  }, [agent, isAdmin])

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

  async function loadContacts() {
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
      toast.error('Erreur lors du chargement des contacts')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return

    setDeleting(id)
    try {
      await deleteContact(id)
      toast.success('Contact supprimé')
      setContacts((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error('Erreur lors de la suppression')
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
            placeholder="Rechercher un contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
          />
        </div>
        <p className="text-sm text-text-secondary">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} au total
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
            <p className="text-lg font-medium">Aucun contact trouvé</p>
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
                          {expandedId === contact.id ? 'Réduire' : 'Lire tout'}
                        </button>
                        {contact.property_slug && (
                          <a
                            href={`/property/${contact.property_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-palm hover:underline"
                          >
                            <Home size={12} />
                            Voir la propriété
                          </a>
                        )}
                        <span className="text-xs text-text-secondary">
                          {format(new Date(contact.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
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
