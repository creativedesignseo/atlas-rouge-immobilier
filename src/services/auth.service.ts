import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { AgentRow, AgentUpdate } from '@/types/supabase'

export interface AuthCredentials {
  email: string
  password: string
}

export type Agent = AgentRow

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

export async function getAgent(userId: string): Promise<Agent | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.error('getAgent error:', error)
    return null
  }

  return data as Agent
}

export async function isAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const { data } = await supabase.auth.getUser()
  if (!data.user) return false

  const agent = await getAgent(data.user.id)
  return agent?.role === 'admin'
}

export async function updateAgent(userId: string, updates: AgentUpdate): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: 'Supabase not configured' }

  const { error } = await supabase
    .from('agents')
    .update(updates)
    .eq('user_id', userId)

  if (error) {
    console.error('updateAgent error:', error)
    return { error: error.message }
  }

  return { error: null }
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: 'Supabase not configured' }

  // Supabase requiere reautenticación para cambiar contraseña
  // Primero obtenemos el email del usuario actual
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user?.email) return { error: 'No user logged in' }

  // Reautenticar con la contraseña actual
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Current password is incorrect' }
  }

  // Actualizar contraseña
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function uploadAvatar(file: File, userId: string): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured) return { url: null, error: 'Supabase not configured' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('agent-avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('uploadAvatar error:', uploadError)
    return { url: null, error: uploadError.message }
  }

  const { data } = supabase.storage.from('agent-avatars').getPublicUrl(filePath)

  return { url: data.publicUrl, error: null }
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}
