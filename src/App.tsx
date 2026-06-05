import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Outlet, Navigate, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from '@/components/ui/sonner'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminPasswordReset from './pages/admin/AdminPasswordReset'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './i18n'
import { getAllSlugsForKey } from './lib/routes'
import { FavoritesProvider } from './hooks/useFavorites'
import CookieBanner from './components/CookieBanner'

const Home = lazy(() => import('./pages/Home'))
const SearchPage = lazy(() => import('./pages/Search'))
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetail'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Estimation = lazy(() => import('./pages/Estimation'))
const GestionLocative = lazy(() => import('./pages/GestionLocative'))
const Estimer = lazy(() => import('./pages/Estimer'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Sell = lazy(() => import('./pages/Sell'))
const BuyerGuide = lazy(() => import('./pages/BuyerGuide'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProperties = lazy(() => import('./pages/admin/AdminProperties'))
const AdminPropertyNew = lazy(() => import('./pages/admin/AdminPropertyNew'))
const AdminPropertyEdit = lazy(() => import('./pages/admin/AdminPropertyEdit'))
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'))
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'))
const AdminNeighborhoods = lazy(() => import('./pages/admin/AdminNeighborhoods'))
const AgentProfile = lazy(() => import('./pages/admin/AgentProfile'))
const AdminBlog = lazy(() => import('./pages/admin/AdminBlog'))
const AdminBlogForm = lazy(() => import('./pages/admin/AdminBlogForm'))

function AdminLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AdminLayoutWrapper() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Suspense fallback={<AdminLoader />}>
          <Outlet />
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  )
}

// Sets the i18n language based on the :lang URL param.
// CRÍTICO: el cambio debe ocurrir SÍNCRONO antes de que se rendericen los
// hijos, NO en useEffect (que corre después). Si esperáramos al effect,
// los componentes que leen t() en su primer render verían el idioma viejo
// (típicamente 'en' por detección) y mostrarían fallback inglés. Bug
// recurrente reportado por cliente: 'Hello, I am interested...' en /es/.
function LangWrapper() {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  // Si la URL trae un idioma soportado y no coincide con i18n, lo cambiamos
  // INMEDIATAMENTE — en el render actual. i18n.changeLanguage es síncrono
  // cuando los recursos están bundleados (lo están en este proyecto).
  const urlLangValid = lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
  if (urlLangValid && i18n.language !== lang) {
    i18n.changeLanguage(lang)
  }

  // Actualizar <html lang="..."> + redirigir si URL inválida
  useEffect(() => {
    if (!urlLangValid) {
      navigate('/fr/', { replace: true })
      return
    }
    document.documentElement.lang = lang!
  }, [lang, urlLangValid, navigate])

  // Bloquear render hasta que i18n esté en el idioma correcto.
  // En la práctica esto pasa en el mismo tick porque changeLanguage es
  // síncrono, pero es defensivo: garantiza que ningún hijo vea EN cuando
  // la URL dice ES.
  if (urlLangValid && i18n.language !== lang) {
    return null
  }

  return <Outlet />
}

// Detecta idioma desde el navegador y redirige a /:lang/.
// Solo se monta cuando la URL NO contiene /:lang (raíz /, o 404).
// Fallback FR (no EN) — idioma base del proyecto.
//
// Resolución SÍNCRONA: el idioma del navegador ya está disponible en el primer
// render (i18next lo detecta vía navigator), así que redirigimos en el mismo
// tick. Antes esto esperaba a una race async (hasta 1500ms) y renderizaba `null`
// mientras decidía → pantalla en blanco en `/`. La detección geo-IP remota se
// eliminó (RGPD), así que ya no hay nada async que esperar: navigator.language
// es exactamente lo que computamos aquí.
function LangDetector() {
  const { i18n } = useTranslation()
  const browserLang = (i18n.language?.slice(0, 2) || 'fr') as SupportedLanguage
  const target = SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : 'fr'
  return <Navigate to={`/${target}/`} replace />
}

export default function App() {
  return (
    <FavoritesProvider>
      <Toaster position="top-right" richColors />
      <CookieBanner />
      <Routes>
        {/* Root: detect language and redirect */}
        <Route path="/" element={<LangDetector />} />

        {/* Admin routes — no lang prefix, outside public layout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<AdminPasswordReset />} />
        <Route path="/admin" element={<AdminLayoutWrapper />}>
          <Route index element={<AdminDashboard />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/new" element={<AdminPropertyNew />} />
          <Route path="properties/:slug/edit" element={<AdminPropertyEdit />} />
          <Route path="neighborhoods" element={<AdminNeighborhoods />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="profile" element={<AgentProfile />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="blog/new" element={<AdminBlogForm />} />
          <Route path="blog/:slug/edit" element={<AdminBlogForm />} />
        </Route>
        <Route path="/admin/" element={<Navigate to="/admin" replace />} />

        {/* Public routes with lang prefix.
            Each canonical route is registered under every language slug
            (e.g. /es/vender, /fr/vendre, /en/sell all render <Sell />).
            This is more permissive than canonicalizing — a user typing
            /es/vendre still gets the page in Spanish, no 404. */}
        <Route path="/:lang" element={<LangWrapper />}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            {getAllSlugsForKey('buy').map((slug) => (
              <Route key={`buy-${slug}`} path={slug} element={<SearchPage />} />
            ))}
            {getAllSlugsForKey('rent').map((slug) => (
              <Route key={`rent-${slug}`} path={slug} element={<SearchPage />} />
            ))}
            {getAllSlugsForKey('propertyDetail').map((slug) => (
              <Route key={`prop-${slug}`} path={`${slug}/:slug`} element={<PropertyDetailPage />} />
            ))}
            {getAllSlugsForKey('sell').map((slug) => (
              <Route key={`sell-${slug}`} path={slug} element={<Sell />} />
            ))}
            {getAllSlugsForKey('buyerGuide').map((slug) => (
              <Route key={`guide-${slug}`} path={slug} element={<BuyerGuide />} />
            ))}
            {getAllSlugsForKey('blog').map((slug) => (
              <Route key={`blog-${slug}`} path={slug} element={<Blog />} />
            ))}
            {/* Individual blog post: <blog-slug>/<post-slug>. Uses the
                same blog route slugs as the listing — el path añadido es
                /:slug debajo, donde :slug es el slug del post. */}
            {getAllSlugsForKey('blog').map((slug) => (
              <Route
                key={`blogpost-${slug}`}
                path={`${slug}/:slug`}
                element={<BlogPost />}
              />
            ))}
            {/* También /blog/:slug en cualquier idioma como atajo cómodo */}
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPost />} />
            {getAllSlugsForKey('about').map((slug) => (
              <Route key={`about-${slug}`} path={slug} element={<About />} />
            ))}
            {getAllSlugsForKey('contact').map((slug) => (
              <Route key={`contact-${slug}`} path={slug} element={<Contact />} />
            ))}
            {getAllSlugsForKey('favorites').map((slug) => (
              <Route key={`fav-${slug}`} path={slug} element={<Favorites />} />
            ))}
            {getAllSlugsForKey('valuation').map((slug) => (
              <Route key={`val-${slug}`} path={slug} element={<Estimation />} />
            ))}
            {getAllSlugsForKey('propertyManagement').map((slug) => (
              <Route key={`mgmt-${slug}`} path={slug} element={<GestionLocative />} />
            ))}
            {getAllSlugsForKey('valuationStart').map((slug) => (
              <Route key={`valstart-${slug}`} path={slug} element={<Estimer />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        {/* Catch-all: redirect to language detection */}
        <Route path="*" element={<LangDetector />} />
      </Routes>
    </FavoritesProvider>
  )
}
