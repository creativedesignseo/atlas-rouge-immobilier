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

// Dedicated ANONYMOUS client for public reads (properties, neighborhoods, blog).
//
// Why a second client: the main `supabase` client carries the logged-in agent's
// session. On the first load after sign-in, supabase-js resolves/refreshes that
// session before every PostgREST request — and when that token refresh stalls,
// EVERY data read queues behind it and times out. That's the "first visit is
// blank, reload fixes it" bug the owner sees (they're logged into /admin, so a
// session exists to refresh). An anonymous visitor never reproduced it.
//
// Public data is readable by the `anon` role via RLS, so these reads don't need
// the agent JWT at all. This client never persists, refreshes, or detects a
// session, so it has nothing to block on — it always uses the anon key directly.
export const supabasePublic = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
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
