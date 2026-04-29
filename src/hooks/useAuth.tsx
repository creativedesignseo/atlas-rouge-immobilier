import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSession, isAdmin, onAuthStateChange, signOut as authSignOut } from '@/services/auth.service'

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const session = await getSession()
      if (session?.user) {
        setUser(session.user)
        const admin = await isAdmin()
        setIsAdminUser(admin)
      } else {
        setUser(null)
        setIsAdminUser(false)
      }
    } catch {
      setUser(null)
      setIsAdminUser(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()

    const { data } = onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        isAdmin().then(setIsAdminUser)
      } else {
        setUser(null)
        setIsAdminUser(false)
      }
      setIsLoading(false)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [checkAuth])

  const handleSignOut = useCallback(async () => {
    await authSignOut()
    setUser(null)
    setIsAdminUser(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin: isAdminUser, isLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
