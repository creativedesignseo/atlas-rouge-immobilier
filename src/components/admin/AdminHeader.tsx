import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLocation, useNavigate } from 'react-router-dom'

function getPageTitle(path: string): string {
  if (path === '/admin') return 'Tableau de bord'
  if (path === '/admin/properties') return 'Propriétés'
  if (path === '/admin/properties/new') return 'Nouvelle propriété'
  if (path.startsWith('/admin/properties/') && path.endsWith('/edit')) return 'Modifier la propriété'
  if (path === '/admin/contacts') return 'Contacts reçus'
  if (path === '/admin/profile') return 'Mon profil'
  return 'Administration'
}

export default function AdminHeader() {
  const { agent, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const title = getPageTitle(location.pathname)

  const displayName = agent?.name || agent?.email?.split('@')[0] || 'Agent'
  const initials = agent?.name
    ? agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : agent?.email?.slice(0, 2).toUpperCase() || 'AR'

  return (
    <header className="h-16 bg-white border-b border-border-warm flex items-center justify-between px-6 lg:px-8">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Profile button */}
        <button
          onClick={() => navigate('/admin/profile')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-midnight">
            {agent?.photo_url ? (
              <img
                src={agent.photo_url}
                alt={agent.name || 'Agent'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
          </div>
          <span className="hidden sm:inline">{displayName}</span>
        </button>

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
