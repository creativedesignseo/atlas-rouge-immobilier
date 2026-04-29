import { Suspense, lazy } from 'react'
import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Layout from './components/Layout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'

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

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProperties = lazy(() => import('./pages/admin/AdminProperties'))
const AdminPropertyNew = lazy(() => import('./pages/admin/AdminPropertyNew'))
const AdminPropertyEdit = lazy(() => import('./pages/admin/AdminPropertyEdit'))
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'))

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

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Admin routes - MUST come before public wildcard */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayoutWrapper />}>
          <Route index element={<AdminDashboard />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/new" element={<AdminPropertyNew />} />
          <Route path="properties/:slug/edit" element={<AdminPropertyEdit />} />
          <Route path="contacts" element={<AdminContacts />} />
        </Route>
        {/* Redirect /admin/ (with trailing slash) to /admin */}
        <Route path="/admin/" element={<Navigate to="/admin" replace />} />

        {/* Public routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/acheter" element={<SearchPage />} />
          <Route path="/louer" element={<SearchPage />} />
          <Route path="/property/:slug" element={<PropertyDetailPage />} />
          <Route path="/vendre" element={<Sell />} />
          <Route path="/guide-achat-maroc" element={<BuyerGuide />} />
          <Route path="/conseils-immobiliers" element={<Blog />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/estimation" element={<Estimation />} />
          <Route path="/gestion-locative" element={<GestionLocative />} />
          <Route path="/estimer" element={<Estimer />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
