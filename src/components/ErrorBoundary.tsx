import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

// Mirror of the stale-chunk detector in main.tsx. After a deploy, an open tab
// imports lazy chunks whose hashes no longer exist; that should reload, not
// show the fallback. Kept here to avoid a circular import with main.tsx.
function isStaleChunkError(reason: unknown): boolean {
  const msg = reason instanceof Error ? reason.message : String(reason ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(
    msg,
  )
}

function ErrorFallback() {
  // useTranslation is safe here: this is a function component rendered by the
  // class boundary. fallbackLng='fr' covers the case where a key is missing.
  const { t } = useTranslation('errors')
  return (
    <div
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: '-apple-system, Segoe UI, sans-serif',
        color: '#1A1A1A',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t('boundary.title')}</h1>
      <p style={{ maxWidth: 480, color: '#666' }}>{t('boundary.message')}</p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: '#B5533A',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.65rem 1.25rem',
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          {t('boundary.reload')}
        </button>
        <a
          href="/"
          style={{
            color: '#B5533A',
            border: '1px solid #B5533A',
            borderRadius: 8,
            padding: '0.65rem 1.25rem',
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          {t('boundary.home')}
        </a>
      </div>
    </div>
  )
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: unknown): State {
    // A stale-chunk error is handled by the global reload logic in main.tsx;
    // don't trap it in the fallback (the page is about to reload).
    if (isStaleChunkError(error)) return { hasError: false }
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) return <ErrorFallback />
    return this.props.children
  }
}

export default ErrorBoundary
