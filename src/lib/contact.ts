// ────────────────────────────────────────────────────────────────────
// Contact constants — single source of truth for WhatsApp / phone CTAs
// across the site. Update WHATSAPP_NUMBER and PHONE_NUMBER here and
// every CTA on every page reflects the change.
// ────────────────────────────────────────────────────────────────────

// WhatsApp number in international E.164 format WITHOUT the leading "+".
// Replace with the real Atlas Rouge mobile number when known.
export const WHATSAPP_NUMBER = '212600000000'

// Display number for tel: links (with the +).
export const PHONE_NUMBER = '+212524000000'

/**
 * Build a WhatsApp click-to-chat URL with a pre-filled message.
 * Uses the wa.me short-link form so it works on web and in the WhatsApp
 * mobile app without further redirects.
 */
export function buildWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
}
