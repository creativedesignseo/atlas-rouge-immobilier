import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import i18n from './i18n'
import { resolveInitialLanguage } from '@/lib/geoLanguage'
import './index.css'
import App from './App.tsx'

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
