import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SearchPage from './pages/Search'
import PropertyDetailPage from './pages/PropertyDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import Estimation from './pages/Estimation'
import GestionLocative from './pages/GestionLocative'
import Estimer from './pages/Estimer'
import Favorites from './pages/Favorites'
import Sell from './pages/Sell'
import BuyerGuide from './pages/BuyerGuide'
import Blog from './pages/Blog'

export default function App() {
  return (
    <Layout>
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
      </Routes>
    </Layout>
  )
}
