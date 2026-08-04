import { LEAD_STAGES, type LeadStage } from '@/types/supabase'

/**
 * Pipeline definition.
 *
 * The `id` is the value stored in `contact_submissions.status` and must never
 * change — labels are translated at render time (`crm.stages.<id>.label`), so
 * renaming a stage in the interface is a locale edit, not a migration.
 *
 * Order here is the order on screen. Adding a stage means: add the id to
 * LEAD_STAGES, widen the CHECK constraint in a new migration, add an entry
 * below, and add its labels to the three locales. Nothing else reads a
 * hardcoded stage list.
 */
export interface StageDef {
  id: LeadStage
  /** Tailwind classes for the index chip of this stage. */
  tone: string
  /** Background class for the small stage dot. Kept explicit — deriving it
   *  from `tone` by string surgery breaks the moment a tone changes. */
  dot: string
  /** Terminal stages sit apart: they close the lead instead of advancing it. */
  terminal?: boolean
}

export const STAGES: StageDef[] = [
  { id: 'new', tone: 'bg-stone/15 text-stone', dot: 'bg-stone/50' },
  { id: 'contacted', tone: 'bg-ink/10 text-ink', dot: 'bg-ink/60' },
  { id: 'qualified', tone: 'bg-gold/25 text-[#8A6E32]', dot: 'bg-gold' },
  { id: 'proposal', tone: 'bg-terracotta/15 text-terracotta', dot: 'bg-terracotta' },
  { id: 'won', tone: 'bg-palm/15 text-palm', dot: 'bg-palm', terminal: true },
  { id: 'lost', tone: 'bg-red-100 text-red-700', dot: 'bg-red-400', terminal: true },
]

export const ACTIVE_STAGES = STAGES.filter((s) => !s.terminal)

export function stageDef(id: LeadStage): StageDef {
  return STAGES.find((s) => s.id === id) ?? STAGES[0]
}

export function isLeadStage(value: string): value is LeadStage {
  return (LEAD_STAGES as readonly string[]).includes(value)
}

// ── Presentation helpers shared by the card and the drawer ──────────────────

const AVATAR_TINTS = [
  'bg-terracotta/12 text-terracotta',
  'bg-palm/12 text-palm',
  'bg-gold/20 text-[#8A6E32]',
  'bg-midnight/10 text-midnight',
] as const

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/** Same lead always gets the same tint, so a long board stays scannable. */
export function tintFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_TINTS[hash % AVATAR_TINTS.length]
}

/** wa.me wants digits only: no "+", no "00" international prefix. */
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('00') ? digits.slice(2) : digits
}

/**
 * Campaign attribution is not a column — the landings write it into the message
 * body as `utm_campaign=...`. Reading it here keeps the card honest: it shows
 * the campaign when the lead really carries one, and nothing when it does not.
 */
export function campaignOf(message: string | null): string | null {
  const match = message?.match(/utm_campaign=([^\s·]+)/)
  return match ? match[1] : null
}

export function sourceOf(message: string | null): string | null {
  const match = message?.match(/utm_source=([^\s·]+)/)
  return match ? match[1] : null
}
