// supabasePublic, not supabase — see the note in contact.service.ts: these are
// anonymous writes and must not queue behind a session token refresh.
import { supabasePublic, isSupabaseConfigured } from '@/lib/supabase'
import { notifyLead } from '@/services/contact.service'

// ============================================================================
// Estimation requests + newsletter subscriptions
// Tablas: estimation_requests, newsletter_subscribers (ver migrations/004_leads.sql)
// ============================================================================

export interface EstimationRequest {
  name: string
  phone: string
  email?: string
  preferredDate?: string // ISO date 'YYYY-MM-DD'
  propertyAddress?: string
  notes?: string
}

export interface SubmitResult {
  success: boolean
  error?: string
}

/**
 * Envía una solicitud de estimación. Devuelve { success, error? }.
 * Notificación al agente: la dispara un trigger DB o un webhook
 * (ver netlify/functions/notify-lead.ts en SPRINT 3).
 */
export async function submitEstimationRequest(
  payload: EstimationRequest,
  lang: string = 'fr',
): Promise<SubmitResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase no configurado' }
  }

  if (!payload.name?.trim() || !payload.phone?.trim()) {
    return { success: false, error: 'Nombre y teléfono son obligatorios' }
  }

  const { error } = await supabasePublic.from('estimation_requests').insert({
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || null,
    preferred_date: payload.preferredDate || null,
    property_address: payload.propertyAddress?.trim() || null,
    notes: payload.notes?.trim() || null,
    source_lang: lang.slice(0, 2),
  })

  if (error) {
    console.error('[leads.service] estimation:', error)
    return { success: false, error: error.message }
  }

  notifyLead({
    type: 'estimation',
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    subject: 'Solicitud de estimación',
    message: payload.preferredDate ? `Fecha preferida: ${payload.preferredDate}` : undefined,
    lang,
  })

  return { success: true }
}

/**
 * Suscribe un email al newsletter. Idempotente: si ya existe, no falla.
 */
export async function subscribeNewsletter(
  email: string,
  lang: string = 'fr',
  sourcePage: string = '',
): Promise<SubmitResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase no configurado' }
  }

  const trimmed = email.trim().toLowerCase()
  // Validación básica
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return { success: false, error: 'Email inválido' }
  }

  // upsert por email único — si ya está, no rompe
  // ignoreDuplicates makes this INSERT ... ON CONFLICT DO NOTHING, so the
  // anon INSERT policy is enough — no UPDATE permission is required.
  const { error } = await supabasePublic
    .from('newsletter_subscribers')
    .upsert(
      {
        email: trimmed,
        source_lang: lang.slice(0, 2),
        source_page: sourcePage || null,
      },
      { onConflict: 'email', ignoreDuplicates: true },
    )

  if (error) {
    console.error('[leads.service] newsletter:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}
