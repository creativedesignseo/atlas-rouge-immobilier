import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'atlas-rouge-auth-token',
        storage: localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Disable the navigator.locks-based lock to avoid orphaned locks
        // that delay every auth call by 5 seconds. The lock is meant to
        // sync auth across tabs but causes "lock not released within 5000ms"
        // warnings on this app's navigation pattern.
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    })
  : (null as unknown as ReturnType<typeof createClient<Database>>)

const ANON_ID_KEY = 'atlas-rouge-anon-id'

export function getAnonymousId(): string {
  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    try {
      id = crypto.randomUUID()
    } catch {
      id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    localStorage.setItem(ANON_ID_KEY, id)
  }
  return id
}
