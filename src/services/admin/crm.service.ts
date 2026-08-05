import { adminRestRequest } from '@/lib/adminRest'
import { invalidate } from '@/lib/queryCache'
import type {
  LeadActivityRow,
  LeadActivityType,
  LeadNoteRow,
  LeadPriority,
  LeadStage,
} from '@/types/supabase'

// Write path for the CRM pipeline. Everything here goes through
// adminRestRequest (direct PostgREST + explicit token + AbortController), never
// supabase-js: the session client refreshes the token before each call and has
// hung outright in the admin. See ADR-002 and the adminRest header.

const CONTACTS = '/rest/v1/contact_submissions'
const NOTES = '/rest/v1/lead_notes'
const ACTIVITY = '/rest/v1/lead_activity'
const AGENTS = '/rest/v1/agents'

export interface CrmActor {
  id: string
  name: string | null
}

export interface AgentOption {
  id: string
  name: string | null
  email: string
}

/**
 * Records one line of history. Failures are swallowed on purpose: the audit
 * trail is valuable but it must never turn a successful stage change into an
 * error the user has to act on. The console keeps the evidence.
 */
async function logActivity(
  contactId: string,
  actor: CrmActor | null,
  entry: {
    type: LeadActivityType
    from_stage?: string | null
    to_stage?: string | null
    detail?: string | null
  },
): Promise<void> {
  try {
    await adminRestRequest(ACTIVITY, {
      method: 'POST',
      returnRepresentation: false,
      timeoutMs: 10000,
      body: {
        contact_id: contactId,
        agent_id: actor?.id ?? null,
        agent_name: actor?.name ?? null,
        type: entry.type,
        from_stage: entry.from_stage ?? null,
        to_stage: entry.to_stage ?? null,
        detail: entry.detail ?? null,
      },
    })
  } catch (error) {
    console.warn('[crm] activity not recorded', error)
  }
}

/**
 * Moves a lead to another stage.
 *
 * `return=representation` is what makes an RLS refusal visible: PostgREST
 * answers 200 with an empty array when the row exists but policy forbids the
 * update. Without this check an agent moving someone else's lead would see a
 * success toast and a card that snaps back on reload.
 */
export async function updateLeadStage(
  id: string,
  stage: LeadStage,
  actor: CrmActor | null,
  fromStage?: LeadStage,
): Promise<void> {
  const updated = await adminRestRequest<{ id: string }[]>(
    `${CONTACTS}?id=eq.${encodeURIComponent(id)}&select=id`,
    {
      method: 'PATCH',
      timeoutMs: 15000,
      body: { status: stage, stage_changed_at: new Date().toISOString() },
    },
  )
  if (!updated?.length) throw new Error('Stage was not updated')
  invalidate('contacts:')
  await logActivity(id, actor, { type: 'stage_change', from_stage: fromStage ?? null, to_stage: stage })
}

export async function updateLeadPriority(
  id: string,
  priority: LeadPriority,
  actor: CrmActor | null,
): Promise<void> {
  const updated = await adminRestRequest<{ id: string }[]>(
    `${CONTACTS}?id=eq.${encodeURIComponent(id)}&select=id`,
    { method: 'PATCH', timeoutMs: 15000, body: { priority } },
  )
  if (!updated?.length) throw new Error('Priority was not updated')
  invalidate('contacts:')
  await logActivity(id, actor, { type: 'contact', detail: `priority:${priority}` })
}

export async function assignLead(
  id: string,
  agentId: string | null,
  agentName: string | null,
  actor: CrmActor | null,
): Promise<void> {
  const updated = await adminRestRequest<{ id: string }[]>(
    `${CONTACTS}?id=eq.${encodeURIComponent(id)}&select=id`,
    { method: 'PATCH', timeoutMs: 15000, body: { assigned_to_agent_id: agentId } },
  )
  if (!updated?.length) throw new Error('Assignment was not saved')
  invalidate('contacts:')
  await logActivity(id, actor, { type: 'assignment', detail: agentName })
}

export async function setFollowUp(
  id: string,
  isoDate: string | null,
  actor: CrmActor | null,
): Promise<void> {
  const updated = await adminRestRequest<{ id: string }[]>(
    `${CONTACTS}?id=eq.${encodeURIComponent(id)}&select=id`,
    { method: 'PATCH', timeoutMs: 15000, body: { next_follow_up_at: isoDate } },
  )
  if (!updated?.length) throw new Error('Follow-up was not saved')
  invalidate('contacts:')
  await logActivity(id, actor, { type: 'follow_up', detail: isoDate })
}

export async function markLeadLost(
  id: string,
  reason: string | null,
  actor: CrmActor | null,
  fromStage?: LeadStage,
): Promise<void> {
  const updated = await adminRestRequest<{ id: string }[]>(
    `${CONTACTS}?id=eq.${encodeURIComponent(id)}&select=id`,
    {
      method: 'PATCH',
      timeoutMs: 15000,
      body: { status: 'lost', lost_reason: reason, stage_changed_at: new Date().toISOString() },
    },
  )
  if (!updated?.length) throw new Error('Lead was not marked as lost')
  invalidate('contacts:')
  await logActivity(id, actor, {
    type: 'stage_change',
    from_stage: fromStage ?? null,
    to_stage: 'lost',
    detail: reason,
  })
}

export async function getLeadNotes(contactId: string): Promise<LeadNoteRow[]> {
  return adminRestRequest<LeadNoteRow[]>(
    `${NOTES}?contact_id=eq.${encodeURIComponent(contactId)}&select=*&order=created_at.desc`,
    { method: 'GET', timeoutMs: 15000 },
  )
}

export async function addLeadNote(
  contactId: string,
  body: string,
  actor: CrmActor | null,
): Promise<LeadNoteRow> {
  const created = await adminRestRequest<LeadNoteRow[]>(NOTES, {
    method: 'POST',
    timeoutMs: 15000,
    body: { contact_id: contactId, agent_id: actor?.id ?? null, body },
  })
  if (!created?.length) throw new Error('Note was not saved')
  await logActivity(contactId, actor, { type: 'note', detail: body.slice(0, 140) })
  return created[0]
}

/**
 * Removes a note. RLS (migration 017) only lets the author or an admin through;
 * `return=representation` is what makes a refusal visible — PostgREST answers
 * 200 with an empty array when the row exists but policy forbids the delete,
 * which would otherwise show a false "deleted" toast.
 *
 * Notes have no UPDATE policy on purpose: a note records what was said, so it
 * is delete-and-rewrite, never edit-in-place.
 */
export async function deleteLeadNote(id: string): Promise<void> {
  const deleted = await adminRestRequest<{ id: string }[]>(
    `${NOTES}?id=eq.${encodeURIComponent(id)}&select=id`,
    { method: 'DELETE', timeoutMs: 10000 },
  )
  if (!deleted?.length) throw new Error('Note was not deleted')
}

export async function getLeadActivity(contactId: string): Promise<LeadActivityRow[]> {
  return adminRestRequest<LeadActivityRow[]>(
    `${ACTIVITY}?contact_id=eq.${encodeURIComponent(contactId)}&select=*&order=created_at.desc&limit=50`,
    { method: 'GET', timeoutMs: 15000 },
  )
}

/**
 * Agents available for assignment. RLS (migration 001) only lets an admin read
 * every agent row — an agent reading this gets just its own. That is the
 * intended permission model, so the caller shows the picker to admins only.
 */
export async function getAssignableAgents(): Promise<AgentOption[]> {
  return adminRestRequest<AgentOption[]>(
    `${AGENTS}?select=id,name,email&is_active=eq.true&order=name.asc`,
    { method: 'GET', timeoutMs: 15000 },
  )
}
