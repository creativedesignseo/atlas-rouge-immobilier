import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  propertySlug?: string
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

  return { success: true }
}
