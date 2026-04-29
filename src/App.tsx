import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Outlet, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from '@/components/ui/sonner'
import Layout from './components/Layout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './i18n'

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
  const { pathname } = useLocation()

  useEffect(() => {
    // Safety guard: never treat "admin" or other reserved words as a lang code
    if (!lang || !SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
      navigate(`/en/`, { replace: true })
      return
    }
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
    document.documentElement.lang = lang
  }, [lang, i18n, navigate, pathname])

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

        {/* Public routes with lang prefix */}
        <Route path="/:lang" element={<LangWrapper />}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="acheter" element={<SearchPage />} />
            <Route path="louer" element={<SearchPage />} />
            <Route path="property/:slug" element={<PropertyDetailPage />} />
            <Route path="vendre" element={<Sell />} />
            <Route path="guide-achat-maroc" element={<BuyerGuide />} />
            <Route path="conseils-immobiliers" element={<Blog />} />
            <Route path="a-propos" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="favoris" element={<Favorites />} />
            <Route path="estimation" element={<Estimation />} />
            <Route path="gestion-locative" element={<GestionLocative />} />
            <Route path="estimer" element={<Estimer />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        {/* Catch-all: redirect to language detection */}
        <Route path="*" element={<LangDetector />} />
      </Routes>
    </>
  )
}
