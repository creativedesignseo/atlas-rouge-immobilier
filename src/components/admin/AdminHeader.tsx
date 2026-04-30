import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'

function getPageTitle(path: string, t: (key: string) => string): string {
  if (path === '/admin') return t('admin:sidebar.dashboard')
  if (path === '/admin/properties') return t('admin:sidebar.properties')
  if (path === '/admin/properties/new') return t('admin:header.newProperty')
  if (path.startsWith('/admin/properties/') && path.endsWith('/edit')) return t('admin:header.editProperty')
  if (path === '/admin/contacts') return t('admin:sidebar.contacts')
  if (path === '/admin/profile') return t('admin:sidebar.profile')
  return t('admin:header.administration')
}

export default function AdminHeader() {
  const { agent, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const title = getPageTitle(location.pathname, t)

  const displayName = agent?.name || agent?.email?.split('@')[0] || 'Agent'
  const initials = agent?.name
    ? agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : agent?.email?.slice(0, 2).toUpperCase() || 'AR'

  return (
    <header className="h-16 bg-white border-b border-border-warm flex items-center justify-between px-6 lg:px-8">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>

      <div className="flex items-center gap-4">
        <LanguageSwitcher variant="admin" />

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
          <span className="hidden sm:inline">{t('admin:header.signOut')}</span>
        </button>
      </div>
    </header>
  )
}
