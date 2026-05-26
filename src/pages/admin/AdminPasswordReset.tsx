import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { requestPasswordReset, setNewPassword } from '@/services/auth.service'

type Mode = 'request' | 'reset'

export default function AdminPasswordReset() {
  const navigate = useNavigate()
  const { t } = useTranslation('admin')

  const [mode, setMode] = useState<Mode>('request')

  // --- Modo "request" ---
  const [email, setEmail] = useState('')
  const [requestSent, setRequestSent] = useState(false)

  // --- Modo "reset" ---
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Supabase emite PASSWORD_RECOVERY cuando el user abre el link del email.
  // Hay que escuchar TANTO el evento como el initial state — si la página
  // se monta justo después del redirect, la session ya puede existir.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset')
        setError(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError(t('passwordReset.emailRequired'))
      return
    }
    setIsLoading(true)
    const res = await requestPasswordReset(email)
    setIsLoading(false)
    if (!res.success) {
      setError(res.error || t('passwordReset.genericError'))
      return
    }
    setRequestSent(true)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPwd.length < 8) {
      setError(t('passwordReset.errorShort'))
      return
    }
    if (newPwd !== confirmPwd) {
      setError(t('passwordReset.errorMismatch'))
      return
    }
    setIsLoading(true)
    const res = await setNewPassword(newPwd)
    setIsLoading(false)
    if (!res.success) {
      setError(res.error || t('passwordReset.genericError'))
      return
    }
    // Tras un cambio de password desde recovery, la session vieja queda
    // en estado intermedio. Forzamos signOut y mandamos al login para
    // que el user entre con su nueva password. Más predecible que
    // intentar usar la session de recovery para navegar a /admin.
    try { await supabase.auth.signOut() } catch {/* noop */}
    toast.success(t('passwordReset.resetSuccess'))
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white font-display text-3xl font-bold tracking-wide">
            Atlas Rouge
          </h1>
          <p className="text-white/60 mt-2">
            {mode === 'reset' ? t('passwordReset.setNewTitle') : t('passwordReset.title')}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-card">
          {/* ─────────────── Modo: solicitar reset ─────────────── */}
          {mode === 'request' && !requestSent && (
            <form onSubmit={handleRequest} className="space-y-5">
              <p className="text-sm text-text-secondary">
                {t('passwordReset.description')}
              </p>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('passwordReset.emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('passwordReset.emailPlaceholder')}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('passwordReset.sending')}
                  </span>
                ) : (
                  t('passwordReset.submitRequest')
                )}
              </button>
            </form>
          )}

          {/* ─────────────── Confirmación de envío ─────────────── */}
          {mode === 'request' && requestSent && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="mx-auto text-terracotta" size={48} />
              <h2 className="font-display text-xl text-text-primary">
                {t('passwordReset.successTitle')}
              </h2>
              <p className="text-sm text-text-secondary">
                {t('passwordReset.successText', { email })}
              </p>
            </div>
          )}

          {/* ─────────────── Modo: establecer nueva password ─────────────── */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('passwordReset.newPasswordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
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

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('passwordReset.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('passwordReset.saving')}
                  </span>
                ) : (
                  t('passwordReset.submitReset')
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          <Link to="/admin/login" className="hover:text-white inline-flex items-center gap-1 transition-colors">
            <ArrowLeft size={14} />
            {t('passwordReset.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
