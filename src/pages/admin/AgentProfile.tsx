import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { updateAgent } from '@/services/auth.service'
import { toast } from 'sonner'
import { Shield, Lock, UserCircle } from 'lucide-react'
import AgentCredential from '@/components/admin/AgentCredential'
import ProfileForm from '@/components/admin/ProfileForm'
import PasswordChangeForm from '@/components/admin/PasswordChangeForm'
import AvatarUpload from '@/components/admin/AvatarUpload'
import type { Agent } from '@/hooks/useAuth'

type Tab = 'profile' | 'credential' | 'security'

export default function AgentProfile() {
  const { t } = useTranslation('admin')
  const { agent: currentAgent, user, isLoading } = useAuth()
  const [agent, setAgent] = useState<Agent | null>(currentAgent)
  const [activeTab, setActiveTab] = useState<Tab>('credential')

  // Sync local state with auth context when it updates
  useEffect(() => {
    if (currentAgent) {
      setAgent(currentAgent)
    }
  }, [currentAgent])

  if (isLoading || !agent || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handlePhotoUpload = async (url: string) => {
    const { error } = await updateAgent(user.id, { photo_url: url })
    if (error) {
      toast.error(`${t('profile.errorPrefix')}: ${error}`)
      return
    }
    setAgent({ ...agent, photo_url: url })
  }

  const handleProfileUpdate = (updated: Agent) => {
    setAgent(updated)
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'credential', label: t('profile.tabs.credential'), icon: UserCircle },
    { key: 'profile', label: t('profile.tabs.profile'), icon: Shield },
    { key: 'security', label: t('profile.tabs.security'), icon: Lock },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <AvatarUpload
          userId={user.id}
          name={agent.name}
          email={agent.email}
          currentUrl={agent.photo_url}
          onUpload={handlePhotoUpload}
        />
        <h1 className="text-2xl font-bold text-text-primary mt-4">
          {agent.name || t('profile.fallbackName')}
        </h1>
        <p className="text-text-secondary">{agent.email}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-terracotta shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-border-warm p-6 lg:p-8">
        {activeTab === 'credential' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-text-primary">{t('profile.tabs.credential')}</h2>
            </div>
            <AgentCredential agent={agent} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{t('profile.editTitle')}</h2>
              <p className="text-sm text-text-secondary mt-1">
                {t('profile.editSubtitle')}
              </p>
            </div>
            <ProfileForm agent={agent} onUpdate={handleProfileUpdate} />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{t('profile.security.title')}</h2>
              <p className="text-sm text-text-secondary mt-1">
                {t('profile.security.subtitle')}
              </p>
            </div>
            <PasswordChangeForm />
          </div>
        )}
      </div>
    </div>
  )
}
