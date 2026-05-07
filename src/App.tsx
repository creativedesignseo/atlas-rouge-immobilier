import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Outlet, Navigate, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from '@/components/ui/sonner'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './i18n'
import { getAllSlugsForKey } from './lib/routes'

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

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProperties = lazy(() => import('./pages/admin/AdminProperties'))
const AdminPropertyNew = lazy(() => import('./pages/admin/AdminPropertyNew'))
const AdminPropertyEdit = lazy(() => import('./pages/admin/AdminPropertyEdit'))
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'))
const AgentProfile = lazy(() => import('./pages/admin/AgentProfile'))

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

// Sets the i18n language based on the :lang URL param
function LangWrapper() {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!lang || !SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
      navigate(`/en/`, { replace: true })
      return
    }
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
    document.documentElement.lang = lang
  }, [lang, i18n, navigate])

  return <Outlet />
}

// Detects browser language and redirects to /:lang/
function LangDetector() {
  const { i18n } = useTranslation()
  const detected = i18n.language?.slice(0, 2) as SupportedLanguage
  const lang = SUPPORTED_LANGUAGES.includes(detected) ? detected : 'en'
  return <Navigate to={`/${lang}/`} replace />
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Root: detect language and redirect */}
        <Route path="/" element={<LangDetector />} />

        {/* Admin routes — no lang prefix, outside public layout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayoutWrapper />}>
          <Route index element={<AdminDashboard />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/new" element={<AdminPropertyNew />} />
          <Route path="properties/:slug/edit" element={<AdminPropertyEdit />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="profile" element={<AgentProfile />} />
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
    </>
  )
}
