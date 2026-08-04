import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { adminRestRequest } from '@/lib/adminRest'
import { getCached, refetch, invalidate } from '@/lib/queryCache'
import type { ContactSubmissionRow, LeadPriority, LeadStage } from '@/types/supabase'

const CONTACT_SUBMISSIONS = '/rest/v1/contact_submissions'

export interface ContactSubmission {
  id: string
  name: string
  // Null for phone-only leads (see migration 016). Callers must not assume a
  // string — `email.toLowerCase()` on a phone-only lead crashed the search.
  email: string | null
  phone: string | null
  subject: string
  message: string
  property_slug: string | null
  assigned_to_agent_id: string | null
  stage: LeadStage
  priority: LeadPriority
  // Null only on the pre-016 junk row; callers fall back to created_at.
  stage_changed_at: string | null
  next_follow_up_at: string | null
  lost_reason: string | null
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
    assigned_to_agent_id: row.assigned_to_agent_id,
    // `status` is the column; `stage` is what the CRM calls it. Renaming the
    // column would break every insert path (forms, Netlify functions), so the
    // translation happens here, once.
    stage: row.status,
    priority: row.priority,
    stage_changed_at: row.stage_changed_at,
    next_follow_up_at: row.next_follow_up_at,
    lost_reason: row.lost_reason,
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

/**
 * Deletes a lead via direct REST.
 *
 * Not supabase-js: that client refreshes the agent token before every call, so
 * a delete cost two sequential round-trips (~1-1.5s of spinner) and could hang
 * forever if the refresh stalled. adminRestRequest sends one request with an
 * explicit token and an AbortController timeout.
 *
 * `return=representation` also makes RLS refusals visible: PostgREST answers
 * 200 with an empty array when the row exists but policy forbids deleting it,
 * which previously surfaced as a false "deleted" toast.
 */
export async function deleteContact(id: string): Promise<void> {
  const deleted = await adminRestRequest<Pick<ContactSubmissionRow, 'id'>[]>(
    `${CONTACT_SUBMISSIONS}?id=eq.${encodeURIComponent(id)}&select=id`,
    { method: 'DELETE', timeoutMs: 10000 },
  )
  if (!deleted?.length) throw new Error('Nothing was deleted')
  invalidate('contacts:')
}
