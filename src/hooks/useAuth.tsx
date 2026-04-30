import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSession, getAgent, onAuthStateChange, signOut as authSignOut } from '@/services/auth.service'
import type { AgentRow } from '@/types/supabase'

export type Agent = AgentRow

interface AuthContextType {
  user: User | null
  agent: Agent | null
  isAdmin: boolean
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  agent: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = agent?.role === 'admin'

  const loadAgentData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setAgent(null)
      return
    }

    try {
      const agentData = await getAgent(currentUser.id)
      setAgent(agentData)
    } catch {
      setAgent(null)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const session = await getSession()
      if (session?.user) {
        setUser(session.user)
        await loadAgentData(session.user)
      } else {
        setUser(null)
        setAgent(null)
      }
    } catch {
      setUser(null)
      setAgent(null)
    } finally {
      setIsLoading(false)
    }
  }, [loadAgentData])

  useEffect(() => {
    // Check auth on mount
    checkAuth()

    // Listen for auth state changes (login, logout, token refresh)
    const { data } = onAuthStateChange(async (_event, session) => {
      setIsLoading(true)
      if (session?.user) {
        setUser(session.user)
        await loadAgentData(session.user)
      } else {
        setUser(null)
        setAgent(null)
      }
      setIsLoading(false)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [checkAuth, loadAgentData])

  const handleSignOut = useCallback(async () => {
    await authSignOut()
    setUser(null)
    setAgent(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, agent, isAdmin, isLoading, signOut: handleSignOut }}>
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
