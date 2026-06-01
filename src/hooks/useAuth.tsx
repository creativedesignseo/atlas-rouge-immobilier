import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSession, getAgent, onAuthStateChange, signOut as authSignOut, validateSession } from '@/services/auth.service'
import { clearAll as clearQueryCache } from '@/lib/queryCache'
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
        // Optimistically trust the cached session so the admin renders fast…
        setUser(session.user)
        await loadAgentData(session.user)
        // …then validate it against the server. A token in localStorage can be
        // a "zombie" (server-side session revoked by a prior global sign-out):
        // it looks logged in but every authenticated call returns 401 and the
        // spinners hang. If the server rejects it, purge and bounce to login.
        const { dead } = await validateSession()
        if (dead) {
          setUser(null)
          setAgent(null)
        }
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

    // Listen for auth state changes (login, logout, token refresh).
    // IMPORTANT: do not flip isLoading=true on every event. TOKEN_REFRESHED
    // fires ~hourly and would briefly unmount ProtectedRoute children, making
    // the whole page disappear and show a spinner ("eventual reload" bug).
    // Only update the user/agent in place; isLoading stays false.
    const { data } = onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) setUser(session.user)
        return
      }
      if (session?.user) {
        setUser(session.user)
        await loadAgentData(session.user)
      } else {
        setUser(null)
        setAgent(null)
      }
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [checkAuth, loadAgentData])

  const handleSignOut = useCallback(async () => {
    // Clear local state FIRST so the UI logs out instantly and the user is never
    // trapped if the network call hangs. ProtectedRoute reacts to user=null and
    // redirects to login. The actual sign-out runs after and can't block the UI.
    setUser(null)
    setAgent(null)
    // Clear the SWR cache so the next user (or anonymous browser) doesn't
    // see admin/private data left in memory from the previous session.
    clearQueryCache()
    await authSignOut().catch(() => { /* local state already cleared */ })
  }, [])

  return (
    <AuthContext.Provider value={{ user, agent, isAdmin, isLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
