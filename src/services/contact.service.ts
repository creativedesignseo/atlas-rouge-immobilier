import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  propertySlug?: string
}

/**
 * Dispara la Netlify function de notificación. Best-effort — si falla,
 * el lead ya está guardado en BD, no rompemos el flujo del usuario.
 */
export async function notifyLead(payload: {
  type: 'contact' | 'estimation' | 'property_inquiry' | 'newsletter'
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
  propertySlug?: string
  lang?: string
}): Promise<void> {
  try {
    await fetch('/.netlify/functions/notify-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch (err) {
    // No bloquear al usuario por un fallo de notificación
    console.warn('[notify-lead] failed (non-blocking):', err)
  }
}

export async function submitContactForm(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    // Simulate success for development without Supabase
    console.log('Contact form submitted (mock):', data)
    return { success: true }
  }

  const { error } = await supabase.from('contact_submissions').insert({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    subject: data.subject,
    message: data.message,
    property_slug: data.propertySlug || null,
  } as never)

  if (error) {
    console.error('Supabase error:', error)
    return { success: false, error: error.message }
  }

  // Notificación al agente (Resend / Telegram según env disponibles)
  notifyLead({
    type: data.propertySlug ? 'property_inquiry' : 'contact',
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    message: data.message,
    propertySlug: data.propertySlug,
    lang: (typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : 'fr') || 'fr',
  })

  return { success: true }
}
