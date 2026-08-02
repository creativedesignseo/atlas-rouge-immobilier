/**
 * Conversion tracking for the React app.
 *
 * The two static campaign landings (public/vendre/, public/proprietaires/)
 * already push `generate_lead` to the dataLayer after a successful insert, and
 * GTM (container GTM-TW5NLSKR) fans that single event out to three places:
 *
 *   - Google Ads conversion "Atlas Rouge - Lead formulario (web)"
 *     (id 17958357718, label KUABCKCQrdocENaVm_NC)
 *   - GA4 event `generate_lead` on G-DW0QTJH33V
 *   - TikTok pixel `SubmitForm` on D9MSR03C77U9D4RN76K0
 *
 * The React pages never pushed it, so leads arriving through /fr/estimation
 * and /fr/contact were saved and emailed but reported ZERO conversions to
 * every ad platform. Two of the campaign sitelinks point straight at those
 * pages, so the campaign would have looked dead while actually producing
 * leads. This closes that gap by reusing the exact same event name — no new
 * GTM tag is required.
 *
 * Fire ONLY after the lead is confirmed persisted, never on submit intent.
 */

type LeadSource =
  | 'contact'
  | 'estimation'
  | 'property_inquiry'

export function trackLead(source: LeadSource, detail: Record<string, unknown> = {}) {
  try {
    const w = window as unknown as { dataLayer?: Record<string, unknown>[] }
    w.dataLayer = w.dataLayer || []
    w.dataLayer.push({ event: 'generate_lead', form_location: source, ...detail })
  } catch {
    /* tracking must never break the user's flow */
  }
}
