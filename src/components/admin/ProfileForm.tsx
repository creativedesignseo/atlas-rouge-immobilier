import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Phone, FileText, Loader2, Save } from 'lucide-react'
import { updateAgent } from '@/services/auth.service'
import { toast } from 'sonner'
import type { Agent } from '@/hooks/useAuth'

interface ProfileFormProps {
  agent: Agent
  onUpdate: (updated: Agent) => void
}

export default function ProfileForm({ agent, onUpdate }: ProfileFormProps) {
  const { t } = useTranslation('admin')
  const [name, setName] = useState(agent.name || '')
  const [phone, setPhone] = useState(agent.phone || '')
  const [bio, setBio] = useState(agent.bio || '')
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when agent changes
  useEffect(() => {
    setName(agent.name || '')
    setPhone(agent.phone || '')
    setBio(agent.bio || '')
  }, [agent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    const { error } = await updateAgent(agent.user_id, {
      name: name.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    })
    setIsLoading(false)

    if (error) {
      toast.error(`${t('profile.errorPrefix')}: ${error}`)
      return
    }

    onUpdate({
      ...agent,
      name: name.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    })
    toast.success(t('profile.saveSuccess'))
  }

  const hasChanges =
    name !== (agent.name || '') ||
    phone !== (agent.phone || '') ||
    bio !== (agent.bio || '')

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('profile.name')}
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('profile.namePlaceholder')}
            className="w-full pl-10 pr-4 py-3 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('profile.phone')}
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('profile.phonePlaceholder')}
            className="w-full pl-10 pr-4 py-3 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t('profile.bioLabel')}
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-text-secondary" size={18} />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder={t('profile.bioPlaceholder')}
            className="w-full pl-10 pr-4 py-3 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors resize-none"
          />
        </div>
        <p className="text-xs text-text-secondary mt-1">
          {t('profile.bioHint')}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !hasChanges}
        className="inline-flex items-center gap-2 px-6 py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('profile.saving')}
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {t('profile.saveChanges')}
          </>
        )}
      </button>
    </form>
  )
}
