import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const STORAGE_KEY = 'atlas-rouge-cookie-consent'

type Choice = 'accepted' | 'rejected' | null

function readChoice(): Choice {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'accepted' || v === 'rejected' ? v : null
  } catch {
    return null
  }
}

function saveChoice(c: 'accepted' | 'rejected') {
  try {
    localStorage.setItem(STORAGE_KEY, c)
  } catch {
    /* ignore — usuario sin localStorage */
  }
}

/**
 * Banner de consentimiento de cookies (RGPD básico).
 * Aparece la primera visita y se oculta al elegir aceptar / rechazar.
 * Mobile-first: full-width inferior, max-h corta, botones 48 px.
 *
 * Para activar GA4 / GTM cuando el usuario acepte, escucha el evento
 * `atlasrouge:cookie-consent` (detail = 'accepted' | 'rejected').
 */
export default function CookieBanner() {
  const { t } = useTranslation('common')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (readChoice() === null) {
      // Pequeño delay para no competir con la primera pintura
      const id = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(id)
    }
  }, [])

  function decide(c: 'accepted' | 'rejected') {
    saveChoice(c)
    setVisible(false)
    // Actualiza el Consent Mode de Google (definido en index.html). Solo con
    // 'accepted' se conceden analytics/ads; con 'rejected' se mantienen
    // denegados, así GTM/GA4 no rastrean sin consentimiento (RGPD).
    const granted = c === 'accepted'
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    w.gtag?.('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: granted ? 'granted' : 'denied',
      analytics_storage: granted ? 'granted' : 'denied',
    })
    window.dispatchEvent(
      new CustomEvent('atlasrouge:cookie-consent', { detail: c }),
    )
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[420px] z-[60] bg-ink text-cream-warm shadow-2xl rounded-card border border-white/10 p-5 sm:p-6"
    >
      <button
        onClick={() => decide('rejected')}
        aria-label="Close"
        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/10 transition-colors"
      >
        <X size={16} />
      </button>
      <h3 className="font-display text-[17px] sm:text-[18px] font-medium mb-2 pr-6">
        {t('cookies.title')}
      </h3>
      <p className="font-inter text-[13px] text-cream-warm/75 leading-relaxed mb-4">
        {t('cookies.body')}
      </p>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={() => decide('accepted')}
          className="flex-1 min-h-[44px] bg-terracotta hover:bg-terracotta/90 active:bg-terracotta/80 text-white px-4 py-2.5 rounded-pill font-inter text-[13px] font-semibold transition-colors"
        >
          {t('cookies.accept')}
        </button>
        <button
          onClick={() => decide('rejected')}
          className="flex-1 min-h-[44px] bg-transparent border border-cream-warm/30 hover:border-cream-warm/60 text-cream-warm px-4 py-2.5 rounded-pill font-inter text-[13px] font-medium transition-colors"
        >
          {t('cookies.reject')}
        </button>
      </div>
    </div>
  )
}
