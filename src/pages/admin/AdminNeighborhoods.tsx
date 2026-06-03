import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, Eye, EyeOff, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useConfirm } from '@/components/admin/ConfirmDialog'
import { getImageUrl } from '@/lib/storage'
import NeighborhoodForm from '@/components/admin/NeighborhoodForm'
import {
  listAdminNeighborhoods,
  setNeighborhoodActive,
  deleteNeighborhood,
  type AdminNeighborhood,
} from '@/services/admin/neighborhoodAdmin.service'

export default function AdminNeighborhoods() {
  const { t } = useTranslation('admin')
  const { isAdmin } = useAuth()
  const confirm = useConfirm()
  const [rows, setRows] = useState<AdminNeighborhood[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminNeighborhood | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await listAdminNeighborhoods()
      setRows(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('neighborhoods.loadError'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(n: AdminNeighborhood) {
    setEditing(n)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  async function handleSaved() {
    closeForm()
    await load()
  }

  async function handleToggleActive(n: AdminNeighborhood) {
    setBusyId(n.id)
    try {
      await setNeighborhoodActive(n.id, !n.is_active)
      setRows((prev) => prev.map((r) => (r.id === n.id ? { ...r, is_active: !n.is_active } : r)))
      toast.success(n.is_active ? t('neighborhoods.deactivated') : t('neighborhoods.activated'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('neighborhoods.saveError'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(n: AdminNeighborhood) {
    // Hard delete only makes sense with 0 properties; otherwise steer to
    // deactivate so we never orphan listings.
    if (n.property_count > 0) {
      toast.error(t('neighborhoods.cannotDelete', { count: n.property_count }))
      return
    }
    const ok = await confirm({
      title: t('neighborhoods.deleteTitle'),
      description: t('neighborhoods.deleteConfirm', { name: n.name }),
      confirmLabel: t('actions.delete'),
      cancelLabel: t('actions.cancel'),
      destructive: true,
    })
    if (!ok) return
    setBusyId(n.id)
    try {
      await deleteNeighborhood(n.id)
      setRows((prev) => prev.filter((r) => r.id !== n.id))
      toast.success(t('neighborhoods.deleted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('neighborhoods.saveError'))
    } finally {
      setBusyId(null)
    }
  }

  // Belt-and-braces: the route and sidebar already gate on isAdmin, but guard
  // the content too so a non-admin who lands here sees nothing actionable.
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
        <MapPin size={40} className="mb-3 opacity-30" />
        <p className="text-sm">{t('neighborhoods.adminOnly')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            {t('neighborhoods.title')}
          </h1>
          <p className="text-sm text-text-secondary mt-1">{t('neighborhoods.subtitle')}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 transition-colors shrink-0"
        >
          <Plus size={18} />
          {t('neighborhoods.new')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-border-warm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <MapPin size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">{t('neighborhoods.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-warm bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('neighborhoods.table.image')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('neighborhoods.table.name')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">{t('neighborhoods.table.properties')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden sm:table-cell">{t('neighborhoods.table.status')}</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('neighborhoods.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {rows.map((n) => (
                  <tr key={n.id} className={`hover:bg-gray-50/50 transition-colors ${!n.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      {n.image ? (
                        <img
                          src={getImageUrl(n.image, { width: 64, height: 64, resize: 'cover' })}
                          alt={n.name}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                          <MapPin size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-primary">{n.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{n.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary hidden md:table-cell tabular-nums">
                      {n.property_count}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {n.is_active ? (
                        <span className="inline-flex px-2.5 py-1 bg-palm/10 text-palm text-xs font-medium rounded-lg">
                          {t('neighborhoods.active')}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg">
                          {t('neighborhoods.inactive')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleActive(n)}
                          disabled={busyId === n.id}
                          className="p-2 text-text-secondary hover:text-terracotta hover:bg-terracotta/5 rounded-lg transition-colors disabled:opacity-50"
                          title={n.is_active ? t('neighborhoods.deactivate') : t('neighborhoods.activate')}
                        >
                          {n.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => openEdit(n)}
                          className="p-2 text-text-secondary hover:text-palm hover:bg-palm/5 rounded-lg transition-colors"
                          title={t('actions.edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(n)}
                          disabled={busyId === n.id}
                          className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t('actions.delete')}
                        >
                          <Trash2 size={16} />
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

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
          <div className="bg-white rounded-2xl shadow-card-hover w-full max-w-lg my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                {editing ? t('neighborhoods.editTitle') : t('neighborhoods.new')}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <NeighborhoodForm existing={editing} onSaved={handleSaved} onCancel={closeForm} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
