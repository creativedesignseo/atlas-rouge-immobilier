import { adminRestRequest } from '@/lib/adminRest'

// Admin reads for the secondary lead tables (estimation requests + newsletter
// subscribers). RLS (migration 004) lets any active agent SELECT both, so we
// use the shared authenticated PostgREST helper. Columns mirror
// supabase/migrations/004_leads.sql exactly.

const ESTIMATION_REQUESTS = '/rest/v1/estimation_requests'
const NEWSLETTER_SUBSCRIBERS = '/rest/v1/newsletter_subscribers'

export interface EstimationRequest {
  id: string
  name: string
  phone: string
  email: string | null
  preferred_date: string | null
  property_address: string | null
  notes: string | null
  source_lang: string | null
  status: 'new' | 'contacted' | 'scheduled' | 'closed'
  assigned_to_agent_id: string | null
  created_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  source_lang: string | null
  source_page: string | null
  confirmed: boolean
  unsubscribed_at: string | null
  created_at: string
}

/** All estimation requests, newest first. Visible to any active agent. */
export async function listEstimationRequests(): Promise<EstimationRequest[]> {
  return adminRestRequest<EstimationRequest[]>(
    `${ESTIMATION_REQUESTS}?select=*&order=created_at.desc`,
    { method: 'GET' },
  )
}

/** All newsletter subscribers, newest first. Visible to any active agent. */
export async function listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  return adminRestRequest<NewsletterSubscriber[]>(
    `${NEWSLETTER_SUBSCRIBERS}?select=*&order=created_at.desc`,
    { method: 'GET' },
  )
}
