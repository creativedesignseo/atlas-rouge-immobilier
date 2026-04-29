import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Euro, Mail, Star, Home } from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { PropertyRow, ContactSubmissionRow } from '@/types/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProperties: 0,
    saleProperties: 0,
    rentProperties: 0,
    featuredProperties: 0,
    newContacts: 0,
  })
  const [recentProperties, setRecentProperties] = useState<PropertyRow[]>([])
  const [recentContacts, setRecentContacts] = useState<ContactSubmissionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      if (!isSupabaseConfigured) return

      try {
        // Properties counts
        const { count: total } = await supabase.from('properties').select('*', { count: 'exact', head: true })
        const { count: sale } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('transaction', 'sale')
        const { count: rent } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('transaction', 'rent')
        const { count: featured } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_featured', true)

        // Contacts in last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { count: contacts } = await supabase
          .from('contact_submissions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo)

        setStats({
          totalProperties: total || 0,
          saleProperties: sale || 0,
          rentProperties: rent || 0,
          featuredProperties: featured || 0,
          newContacts: contacts || 0,
        })

        // Recent properties
        const { data: propsData } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentProperties((propsData || []) as PropertyRow[])

        // Recent contacts
        const { data: contactsData } = await supabase
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentContacts((contactsData || []) as ContactSubmissionRow[])
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Propriétés" value={stats.totalProperties} icon={Building2} color="terracotta" />
        <StatCard title="En Vente" value={stats.saleProperties} icon={Euro} color="palm" />
        <StatCard title="En Location" value={stats.rentProperties} icon={Home} color="gold" />
        <StatCard title="Mises en avant" value={stats.featuredProperties} icon={Star} color="midnight" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent properties */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Propriétés récentes</h3>
            <button
              onClick={() => navigate('/admin/properties')}
              className="text-sm text-terracotta hover:underline"
            >
              Voir tout
            </button>
          </div>

          {recentProperties.length === 0 ? (
            <p className="text-text-secondary text-sm py-4">Aucune propriété</p>
          ) : (
            <div className="space-y-3">
              {recentProperties.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/admin/properties/${p.slug}/edit`)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-terracotta/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-terracotta" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{p.title}</p>
                    <p className="text-xs text-text-secondary">
                      {p.transaction === 'sale' ? 'Vente' : 'Location'} • {p.price_eur.toLocaleString()} €
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {format(new Date(p.created_at), 'dd/MM/yy', { locale: fr })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent contacts */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border-warm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Contacts récents</h3>
            <button
              onClick={() => navigate('/admin/contacts')}
              className="text-sm text-terracotta hover:underline"
            >
              Voir tout
            </button>
          </div>

          {recentContacts.length === 0 ? (
            <p className="text-text-secondary text-sm py-4">Aucun contact</p>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate('/admin/contacts')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-palm/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-palm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                    <p className="text-xs text-text-secondary truncate">{c.subject}</p>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {format(new Date(c.created_at), 'dd/MM/yy', { locale: fr })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
