import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from './useCurrency'
import type { Property } from '@/data/properties'

/**
 * Returns a formatter that turns a property into its public price label.
 * When `priceOnRequest` is set, it yields a localized "contact us for price"
 * string instead of the number — the price is still stored, only hidden from
 * the public site. Works in JSX and in raw HTML (e.g. map popups) since it
 * returns a plain string.
 */
export function usePropertyPrice() {
  const { formatPrice } = useCurrency()
  const { t } = useTranslation('property')
  return useCallback(
    (property: Pick<Property, 'priceEUR' | 'priceOnRequest'>): string =>
      property.priceOnRequest ? t('priceOnRequest') : formatPrice(property.priceEUR),
    [formatPrice, t],
  )
}
