import { useState, useEffect } from 'react'
import { getSiteSettings, type SiteSettings } from '@/services/settings.service'

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getSiteSettings().then((s) => {
      if (!cancelled) {
        setSettings(s)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  return { settings, loading }
}
