import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthCredentials {
  email: string
  password: string
}

export async function signIn({ email, password }: AuthCredentials): Promise<{ error: AuthError | null }> {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError }
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}

export async function signUp({ email, password }: AuthCredentials): Promise<{ error: AuthError | null; user: User | null }> {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError, user: null }
  }
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { error, user: data.user }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError }
  }
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function isAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const { data } = await supabase.auth.getUser()
  if (!data.user) return false
  
  const { data: adminData } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', data.user.id)
    .single()
  
  return !!adminData
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}
