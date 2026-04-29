import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { signIn } from '@/services/auth.service'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { agent, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitStarted = useRef(false)

  // If already logged in (agent exists), redirect immediately
  useEffect(() => {
    if (agent && !isLoading && !submitStarted.current) {
      navigate('/admin')
    }
  }, [agent, isLoading, navigate])

  // After submitting, watch for agent to appear
  useEffect(() => {
    if (!submitStarted.current) return
    if (agent && !isLoading) {
      toast.success('Connexion réussie')
      navigate('/admin')
    }
  }, [agent, isLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    submitStarted.current = true
    setIsSubmitting(true)
    const { error } = await signIn({ email, password })

    if (error) {
      submitStarted.current = false
      setIsSubmitting(false)
      toast.error(error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : 'Erreur de connexion: ' + error.message
      )
      return
    }

    // Auth state will update via onAuthStateChange in useAuth
    // The useEffect above will navigate when agent is loaded
    // Fallback: if nothing happens in 5s, show error
    setTimeout(() => {
      if (submitStarted.current) {
        setIsSubmitting(false)
        submitStarted.current = false
        toast.error('Erreur de connexion. Veuillez réessayer.')
      }
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-white font-playfair text-3xl font-bold tracking-wide">
            Atlas Rouge
          </h1>
          <p className="text-white/60 mt-2">Panneau d'administration</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-card">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@atlasrouge.ma"
                  className="w-full pl-10 pr-4 py-3 border border-border-warm rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Mot de passe
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
              disabled={isSubmitting}
              className="w-full py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          <button onClick={() => navigate('/')} className="hover:text-white/60 transition-colors">
            ← Retour au site
          </button>
        </p>
      </div>
    </div>
  )
}
