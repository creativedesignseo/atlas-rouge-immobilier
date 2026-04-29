import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ExternalLink, Search, Home, Star } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { deleteProperty } from '@/services/admin/propertyAdmin.service'
import { getImageUrl } from '@/lib/storage'
import type { PropertyRow } from '@/types/supabase'

const typeLabels: Record<string, string> = {
  villa: 'Villa',
  apartment: 'Appartement',
  riad: 'Riad',
  prestige: 'Prestige',
  land: 'Terrain',
  rooftop: 'Rooftop',
}

export default function AdminProperties() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [filtered, setFiltered] = useState<PropertyRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(properties)
      return
    }
    const q = search.toLowerCase()
    setFiltered(
      properties.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    )
  }, [search, properties])

  async function loadProperties() {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProperties((data || []) as PropertyRow[])
      setFiltered((data || []) as PropertyRow[])
    } catch {
      toast.error('Erreur lors du chargement des propriétés')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) return

    setDeleting(slug)
    try {
      await deleteProperty(slug)
      toast.success('Propriété supprimée')
      setProperties((prev) => prev.filter((p) => p.slug !== slug))
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
            placeholder="Rechercher une propriété..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
          />
        </div>
        <button
          onClick={() => navigate('/admin/properties/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 transition-colors"
        >
          <Plus size={18} />
          Nouvelle propriété
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-border-warm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Home size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucune propriété trouvée</p>
            <p className="text-sm mt-1">Commencez par ajouter une propriété</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-warm bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Image</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Titre</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Prix (EUR)</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Surface</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden sm:table-cell">Statut</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filtered.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={getImageUrl(property.images[0], { width: 64, height: 64 })}
                          alt={property.title}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Home size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{property.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{property.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex px-2.5 py-1 bg-midnight/10 text-midnight text-xs font-medium rounded-lg">
                        {typeLabels[property.type] || property.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary hidden lg:table-cell">
                      {property.price_eur.toLocaleString()} €
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary hidden lg:table-cell">
                      {property.surface} m²
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex gap-1.5 flex-wrap">
                        {property.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/10 text-gold text-[10px] font-medium rounded">
                            <Star size={10} />
                            À la une
                          </span>
                        )}
                        {property.is_exclusive && (
                          <span className="inline-flex px-2 py-0.5 bg-terracotta/10 text-terracotta text-[10px] font-medium rounded">
                            Exclusivité
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded ${
                          property.transaction === 'sale'
                            ? 'bg-palm/10 text-palm'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {property.transaction === 'sale' ? 'Vente' : 'Location'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => window.open(`/property/${property.slug}`, '_blank')}
                          className="p-2 text-text-secondary hover:text-terracotta hover:bg-terracotta/5 rounded-lg transition-colors"
                          title="Voir sur le site"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/properties/${property.slug}/edit`)}
                          className="p-2 text-text-secondary hover:text-palm hover:bg-palm/5 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(property.slug)}
                          disabled={deleting === property.slug}
                          className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deleting === property.slug ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
