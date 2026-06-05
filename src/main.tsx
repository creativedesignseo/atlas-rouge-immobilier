import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { isStaleChunkError } from '@/lib/staleChunk'
import { reportError } from '@/lib/reportError'
import './i18n'
import './index.css'
import App from './App.tsx'

// Stale-chunk recovery. After a new deploy, an open tab still runs the old
// index.js — that bundle imports lazy chunks (Search-XXX.js, ...) whose content
// hashes no longer exist on the server. The dynamic import fails; one reload
// pulls the new index.js and the right chunk hashes.
//
// We store the TIMESTAMP of the last auto-reload (not a one-shot flag). Within a
// short cooldown a repeat failure means the reload didn't help → stop, to avoid
// a reload loop. Outside the cooldown, every genuine stale chunk (e.g. a SECOND
// deploy later in the same tab session) gets its own one-shot reload. The old
// one-shot flag never reset, so the second occurrence left users stuck on a
// blank page until a manual reload — that's the bug this fixes.
const RELOAD_AT_KEY = 'atlas-rouge-stale-chunk-reload-at'
const RELOAD_COOLDOWN_MS = 10_000

function recoverFromStaleChunk(reason: unknown) {
  if (!isStaleChunkError(reason)) return
  reportError('chunk', reason)
  const last = Number(sessionStorage.getItem(RELOAD_AT_KEY) || 0)
  if (Date.now() - last < RELOAD_COOLDOWN_MS) return
  sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()))
  window.location.reload()
}
window.addEventListener('error', (e) => {
  if (isStaleChunkError(e.error || e.message)) recoverFromStaleChunk(e.error || e.message)
  else reportError('render', e.error || e.message)
})
window.addEventListener('unhandledrejection', (e) => {
  if (isStaleChunkError(e.reason)) recoverFromStaleChunk(e.reason)
  else reportError('render', e.reason)
})

// NOTA: la geo-IP detection se movió al LangDetector component
// (src/App.tsx) — solo aplica cuando la URL NO contiene /:lang.
// Antes, esto corría asíncrono y pisaba el idioma de la URL después
// del primer render, causando que /es/... mostrara inglés.

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>,
)
