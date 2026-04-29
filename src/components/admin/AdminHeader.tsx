import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'react-router-dom'

function getPageTitle(path: string): string {
  if (path === '/admin') return 'Tableau de bord'
  if (path === '/admin/properties') return 'Propriétés'
  if (path === '/admin/properties/new') return 'Nouvelle propriété'
  if (path.startsWith('/admin/properties/') && path.endsWith('/edit')) return 'Modifier la propriété'
  if (path === '/admin/contacts') return 'Contacts reçus'
  return 'Administration'
}

export default function AdminHeader() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <header className="h-16 bg-white border-b border-border-warm flex items-center justify-between px-6 lg:px-8">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="w-8 h-8 bg-midnight rounded-full flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="hidden sm:inline">{user?.email || 'Admin'}</span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}
