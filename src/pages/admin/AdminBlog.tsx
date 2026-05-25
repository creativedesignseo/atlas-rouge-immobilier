import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, ExternalLink, Search, FileText, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  listPosts,
  deletePost,
  publishPost,
  type BlogPost,
} from '@/services/blog.service'
import { useLang } from '@/hooks/useLang'

type StatusFilter = 'all' | 'published' | 'draft'

/**
 * Listado del blog en el panel admin.
 * Muestra todos los posts (drafts + published) con filtros y acciones.
 */
export default function AdminBlog() {
  const navigate = useNavigate()
  const { t } = useTranslation('admin')
  const { agent } = useAuth()
  const { lang } = useLang()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filtered, setFiltered] = useState<BlogPost[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    if (!agent) {
      setLoading(false)
      return
    }
    try {
      const data = await listPosts({ publishedOnly: false })
      setPosts(data)
      setFiltered(data)
    } catch {
      toast.error('Error al cargar los artículos')
    } finally {
      setLoading(false)
    }
  }, [agent])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  // Filtros combinados (status + texto)
  useEffect(() => {
    let list = posts
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.translations.some((t) => t.title.toLowerCase().includes(q)),
      )
    }
    setFiltered(list)
  }, [posts, statusFilter, search])

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return
    setActing(post.id)
    try {
      await deletePost(post.id)
      toast.success('Artículo eliminado')
      await loadPosts()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setActing(null)
    }
  }

  const handleTogglePublish = async (post: BlogPost) => {
    setActing(post.id)
    try {
      await publishPost(post.id, post.status === 'draft')
      toast.success(post.status === 'draft' ? 'Artículo publicado' : 'Artículo despublicado')
      await loadPosts()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-medium text-ink">Blog</h1>
          <p className="text-stone text-[14px] font-inter mt-1">
            Gestiona los artículos de consejos inmobiliarios.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/blog/new')}
          className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg font-inter text-[14px] font-semibold hover:bg-terracotta/90 transition-colors"
        >
          <Plus size={16} />
          Nuevo artículo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o slug…"
            className="w-full pl-10 pr-4 h-11 bg-white border border-border-warm rounded-lg font-inter text-[14px] focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>
        <div className="flex items-center gap-1 bg-cream-warm rounded-lg p-1">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 h-9 rounded-md text-[13px] font-inter font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-white shadow-sm text-ink'
                  : 'text-stone hover:text-ink'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'published' ? 'Publicados' : 'Borradores'}
              <span className="ml-2 text-stone/60 text-[11px]">
                {s === 'all'
                  ? posts.length
                  : posts.filter((p) => p.status === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table / list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border-warm rounded-card p-12 text-center">
          <FileText size={32} className="mx-auto text-stone/40 mb-4" />
          <p className="text-stone font-inter mb-1">
            {posts.length === 0
              ? 'Aún no has creado ningún artículo.'
              : 'No hay artículos que coincidan con el filtro.'}
          </p>
          {posts.length === 0 && (
            <button
              onClick={() => navigate('/admin/blog/new')}
              className="text-terracotta font-inter text-[14px] mt-2 hover:underline"
            >
              Crear el primero →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border-warm rounded-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream-warm/50 border-b border-border-warm">
              <tr>
                <th className="text-left text-[11px] uppercase tracking-wider font-inter font-semibold text-stone px-5 py-3">
                  Título
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider font-inter font-semibold text-stone px-5 py-3 hidden md:table-cell">
                  Categoría
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider font-inter font-semibold text-stone px-5 py-3 hidden lg:table-cell">
                  Autor
                </th>
                <th className="text-left text-[11px] uppercase tracking-wider font-inter font-semibold text-stone px-5 py-3">
                  Estado
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider font-inter font-semibold text-stone px-5 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((post) => (
                <tr key={post.id} className="hover:bg-cream-warm/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-inter text-[14px] text-ink font-medium">
                      {post.title}
                    </div>
                    <div className="text-stone text-[12px] mt-0.5">/{post.slug}</div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-[11px] font-inter font-medium uppercase tracking-wide text-stone">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-[13px] font-inter text-stone">
                      {post.author?.name || post.guestAuthor || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-inter font-medium ${
                        post.status === 'published'
                          ? 'bg-palm/15 text-palm'
                          : 'bg-stone/10 text-stone'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          post.status === 'published' ? 'bg-palm' : 'bg-stone'
                        }`}
                      />
                      {post.status === 'published' ? t('actions.status.published') : t('actions.status.draft')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === 'published' && (
                        <a
                          href={`/${lang}/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-stone hover:text-ink hover:bg-cream-warm rounded-md transition-colors"
                          title={t('actions.viewSite')}
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                      <button
                        onClick={() => handleTogglePublish(post)}
                        disabled={acting === post.id}
                        className="p-2 text-stone hover:text-ink hover:bg-cream-warm rounded-md transition-colors disabled:opacity-40"
                        title={post.status === 'published' ? t('actions.unpublish') : t('actions.publish')}
                      >
                        {post.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => navigate(`/admin/blog/${post.slug}/edit`)}
                        className="p-2 text-stone hover:text-terracotta hover:bg-cream-warm rounded-md transition-colors"
                        title={t('actions.edit')}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        disabled={acting === post.id}
                        className="p-2 text-stone hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                        title={t('actions.delete')}
                      >
                        <Trash2 size={15} />
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
  )
}
