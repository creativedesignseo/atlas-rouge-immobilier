import { useState, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'

export function useCurrency() {
  const [currency, setCurrency] = useState<'EUR' | 'MAD'>('EUR')

  const formatPriceHook = useCallback(
    (priceEUR: number): string => {
      const price = currency === 'MAD' ? priceEUR * 11 : priceEUR
      return formatPrice(price, currency)
    },
    [currency]
  )

  return { currency, setCurrency, formatPrice: formatPriceHook }
}
