import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { signIn } from '@/services/auth.service'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { t } = useTranslation('admin')
  const { user, agent, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Navigate to admin once auth state is fully resolved after login
  useEffect(() => {
    if (!authLoading && user && agent) {
      navigate('/admin', { replace: true })
    }
  }, [authLoading, user, agent, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error(t('loginExtra.missingFields'))
      return
    }

    setIsLoading(true)
    try {
      const { error } = await signIn({ email, password })

      if (error) {
        let msg: string
        switch (error.message) {
          case 'Invalid login credentials':
            msg = t('loginExtra.invalidCredentials')
            break
          case 'NO_AGENT_PROFILE':
            // Auth ok pero el user no tiene fila en `agents`. No es problema
            // de password — pedirle al admin que lo provisione.
            msg = t('loginExtra.noAgentProfile', {
              defaultValue:
                'Tu cuenta existe pero no tiene perfil de administrador. Contacta con el responsable del sitio para que active tu acceso.',
            })
            break
          case 'AGENT_INACTIVE':
            msg = t('loginExtra.agentInactive', {
              defaultValue:
                'Tu cuenta está desactivada. Contacta con el responsable del sitio para reactivarla.',
            })
            break
          default:
            msg = `${t('loginExtra.errorPrefix')}: ${error.message}`
        }
        toast.error(msg)
      }
      // Navigation is handled by the useEffect above once agent data loads
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-white font-display text-3xl font-bold tracking-wide">
            Atlas Rouge
          </h1>
          <p className="text-white/60 mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-card">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('login.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@atlasrouge.com"
                  className="w-full pl-10 pr-4 py-3 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('login.submitting')}
                </span>
              ) : (
                t('login.submit')
              )}
            </button>

            <Link
              to="/admin/reset-password"
              className="text-[13px] text-terracotta hover:underline block text-center"
            >
              {t('passwordReset.title')}
            </Link>
          </div>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          <button onClick={() => navigate('/')} className="hover:text-white/60 transition-colors">
            {t('login.backToSite')}
          </button>
        </p>
      </div>
    </div>
  )
}
