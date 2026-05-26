import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { AgentRow, AgentUpdate } from '@/types/supabase'

export interface AuthCredentials {
  email: string
  password: string
}

/**
 * Race una promesa contra un timeout. Si la promesa no resuelve antes del
 * timeout, rechaza con Error('TIMEOUT'). Crítico para llamadas Supabase Auth
 * que ocasionalmente se cuelgan sin resolver (por red móvil inestable o
 * navegador despertando de background).
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('TIMEOUT')), ms)
    promise.then(
      (v) => {
        clearTimeout(id)
        resolve(v)
      },
      (e) => {
        clearTimeout(id)
        reject(e)
      },
    )
  })
}

export type Agent = AgentRow

export async function signIn({ email, password }: AuthCredentials): Promise<{ error: AuthError | null }> {
  if (!isSupabaseConfigured) {
    return { error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError }
  }
  try {
    const { error } = await withTimeout(
      Promise.resolve(supabase.auth.signInWithPassword({ email, password })),
      12000,
    )
    return { error }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return {
      error: {
        message: msg === 'TIMEOUT' ? 'Login timed out. Check your connection.' : msg,
        name: 'TimeoutError',
      } as AuthError,
    }
  }
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

/**
 * Envía un email de recuperación de contraseña.
 * El usuario llegará a /admin/reset-password con un token de recovery,
 * y Supabase emitirá un evento PASSWORD_RECOVERY que el componente escucha.
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' }
  const trimmed = email?.trim()
  if (!trimmed) return { success: false, error: 'Email required' }

  try {
    const { error } = await withTimeout(
      Promise.resolve(
        supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        }),
      ),
      12000,
    )
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return {
      success: false,
      error: msg === 'TIMEOUT' ? 'Request timed out. Check your connection.' : msg,
    }
  }
}

/**
 * Establece una nueva contraseña usando la session activa de recovery
 * (sin pedir la contraseña anterior — el flow es "olvidé contraseña").
 * No confundir con updatePassword(current, new) que reautentica.
 */
export async function setNewPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  try {
    // Sanity check: debe existir una session de recovery activa antes de
    // intentar updateUser. Si no, updateUser cuelga indefinidamente porque
    // espera a una session que nunca llegará.
    const { data: sessionData } = await withTimeout(
      Promise.resolve(supabase.auth.getSession()),
      5000,
    )
    if (!sessionData?.session) {
      return {
        success: false,
        error: 'Recovery session expired. Please request a new reset link.',
      }
    }

    const { error } = await withTimeout(
      Promise.resolve(supabase.auth.updateUser({ password: newPassword })),
      15000,
    )
    if (error) {
      console.error('setNewPassword updateUser error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('setNewPassword exception:', e)
    if (msg === 'TIMEOUT') {
      return {
        success: false,
        error: 'Request timed out. Check your connection and try again.',
      }
    }
    return { success: false, error: msg }
  }
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
