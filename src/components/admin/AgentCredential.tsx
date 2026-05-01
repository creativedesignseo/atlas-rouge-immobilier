import { BadgeCheck, Shield, Calendar, Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Agent } from '@/hooks/useAuth'

interface AgentCredentialProps {
  agent: Agent
}

const DATE_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-US', es: 'es-ES' }

export default function AgentCredential({ agent }: AgentCredentialProps) {
  const { t, i18n } = useTranslation('admin')
  const dateLocale = DATE_LOCALES[i18n.language?.slice(0, 2)] || 'en-US'

  const initials = agent.name
    ? agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : agent.email.slice(0, 2).toUpperCase()

  const formattedDate = agent.created_at
    ? new Date(agent.created_at).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="bg-gradient-to-br from-midnight to-midnight/90 rounded-2xl p-6 text-white shadow-xl max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 flex-shrink-0">
          {agent.photo_url ? (
            <img src={agent.photo_url} alt={agent.name || 'Agent'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-terracotta flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold truncate">{agent.name || t('credential.fallbackName')}</h3>
          <p className="text-white/60 text-sm">{agent.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {agent.role === 'admin' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-terracotta/20 text-terracotta text-xs font-medium rounded-full">
                <Shield size={12} />
                {t('credential.roleAdmin')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white/80 text-xs font-medium rounded-full">
                <BadgeCheck size={12} />
                {t('credential.roleAgent')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-4" />

      {/* Info */}
      <div className="space-y-3">
        {agent.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-terracotta flex-shrink-0" />
            <span className="text-white/80">{agent.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <Mail size={16} className="text-terracotta flex-shrink-0" />
          <span className="text-white/80 truncate">{agent.email}</span>
        </div>
        {formattedDate && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-terracotta flex-shrink-0" />
            <span className="text-white/80">{t('credential.memberSince', { date: formattedDate })}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-terracotta rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">AR</span>
          </div>
          <span className="text-white/60 text-xs font-medium">Atlas Rouge Immobilier</span>
        </div>
        <span className="text-white/40 text-xs">Marrakech, Maroc</span>
      </div>
    </div>
  )
}
