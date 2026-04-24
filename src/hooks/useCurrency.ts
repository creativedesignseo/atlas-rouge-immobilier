import { useState, useCallback, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'

const STORAGE_KEY = 'atlas-rouge-currency'

export function useCurrency() {
  const [currency, setCurrencyState] = useState<'EUR' | 'MAD'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored === 'MAD' ? 'MAD' : 'EUR'
    } catch {
      return 'EUR'
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency)
  }, [currency])

  const setCurrency = useCallback((c: 'EUR' | 'MAD') => {
    setCurrencyState(c)
  }, [])

  const formatPriceHook = useCallback(
    (priceEUR: number): string => {
      const price = currency === 'MAD' ? priceEUR * 11 : priceEUR
      return formatPrice(price, currency)
    },
    [currency]
  )

  return { currency, setCurrency, formatPrice: formatPriceHook }
}
