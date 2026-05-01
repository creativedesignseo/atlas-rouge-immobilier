import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import i18n from './i18n'
import { resolveInitialLanguage } from '@/lib/geoLanguage'
import './index.css'
import App from './App.tsx'

// Stale-chunk recovery. After a new deploy, an open tab still has the old
// index.js cached — that old bundle imports lazy chunks (Search-XXX.js,
// PropertyDetail-XXX.js, ...) whose hashes no longer exist. The fetch fails
// with "Failed to fetch dynamically imported module". One reload pulls the
// new index.js and the right chunk hashes. We use sessionStorage to avoid
// reload loops if the failure has another cause.
const RELOAD_FLAG = 'atlas-rouge-stale-chunk-reload'
function isStaleChunkError(reason: unknown): boolean {
  const msg = reason instanceof Error ? reason.message : String(reason ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg)
}
function recoverFromStaleChunk(reason: unknown) {
  if (!isStaleChunkError(reason)) return
  if (sessionStorage.getItem(RELOAD_FLAG)) return
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.reload()
}
window.addEventListener('error', (e) => recoverFromStaleChunk(e.error || e.message))
window.addEventListener('unhandledrejection', (e) => recoverFromStaleChunk(e.reason))

// Refine initial language via Geo-IP on the very first visit (no localStorage
// entry yet). Non-blocking: if a different language is resolved, i18next
// swaps strings reactively.
resolveInitialLanguage(i18n.language).then((geoLang) => {
  if (geoLang) i18n.changeLanguage(geoLang)
})

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
)
