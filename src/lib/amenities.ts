import type { TFunction } from 'i18next'

/**
 * Amenity values are stored in the DB in French (the canonical strings the
 * filter logic compares against). For display we translate them via the
 * `amenities` i18n namespace, keyed by the slugified French value. Unknown
 * values fall back to the original French string so nothing ever breaks.
 */
export function slugifyAmenity(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Localized label for an amenity value (falls back to the raw value). */
export function amenityLabel(value: string, t: TFunction): string {
  return t(slugifyAmenity(value), { ns: 'amenities', defaultValue: value })
}
