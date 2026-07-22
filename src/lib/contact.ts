// ────────────────────────────────────────────────────────────────────
// Contact constants — single source of truth for WhatsApp / phone CTAs
// across the site. Update WHATSAPP_NUMBER and PHONE_NUMBER here and
// every CTA on every page reflects the change.
// ────────────────────────────────────────────────────────────────────

// WhatsApp number in international E.164 format WITHOUT the leading "+".
export const WHATSAPP_NUMBER = '212648024156'

// Display number for tel: links (with the +).
export const PHONE_NUMBER = '+212648024156'

// Human-readable, spaced format for visible text (buttons, footer, etc.).
export const PHONE_NUMBER_DISPLAY = '+212 648 02 41 56'

// Corporate email (Zoho Mail on atlasrouge.com).
export const EMAIL = 'info@atlasrouge.com'

// ────────────────────────────────────────────────────────────────────
// Social networks — the ONLY two active accounts. Update here and both
// the footer and the contact page reflect the change.
// ────────────────────────────────────────────────────────────────────
export const INSTAGRAM_URL = 'https://www.instagram.com/atlasrougeimmo/'
export const TIKTOK_URL = 'https://www.tiktok.com/@atlas.rouge.immo'

/**
 * Build a WhatsApp click-to-chat URL with a pre-filled message.
 * Uses the wa.me short-link form so it works on web and in the WhatsApp
 * mobile app without further redirects.
 */
export function buildWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
}
