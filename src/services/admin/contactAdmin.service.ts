import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getCached, refetch, invalidate } from '@/lib/queryCache'
import type { ContactSubmissionRow } from '@/types/supabase'

export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  property_slug: string | null
  created_at: string
}

function mapRow(row: ContactSubmissionRow): ContactSubmission {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    property_slug: row.property_slug,
    created_at: row.created_at,
  }
}

async function fetchContactSubmissions(
  agentId: string,
  isAdmin: boolean,
  limit: number,
  offset: number
): Promise<{ contacts: ContactSubmission[]; count: number }> {
  if (!isSupabaseConfigured) return { contacts: [], count: 0 }

  let query = supabase
    .from('contact_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (!isAdmin) query = query.eq('assigned_to_agent_id', agentId)
  const { data, error, count } = await query
  if (error) throw error
  return {
    contacts: (data || []).map(mapRow),
    count: count || 0,
  }
}

export async function getContactSubmissions(
  agentId: string,
  isAdmin: boolean,
  limit = 50,
  offset = 0
): Promise<{ contacts: ContactSubmission[]; count: number }> {
  const key = `contacts:${agentId}:${isAdmin ? 'all' : 'own'}:${limit}:${offset}`
  type R = { contacts: ContactSubmission[]; count: number }
  const cached = getCached<R>(key)
  const fresh = refetch(key, () => fetchContactSubmissions(agentId, isAdmin, limit, offset))
  if (cached !== undefined) {
    fresh.catch(() => {})
    return cached
  }
  return fresh
}

export async function deleteContact(id: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('contact_submissions')
    .delete()
    .eq('id', id)

  if (error) throw error
  invalidate('contacts:')
}
