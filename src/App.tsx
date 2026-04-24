import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

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

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
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
        </Routes>
      </Suspense>
    </Layout>
  )
}
