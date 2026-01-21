import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AboutPage from './pages/About'
import CategoryPage from './pages/Category'
import CategoriesPage from './pages/Categories'
import ContactPage from './pages/Contact'
import HomePage from './pages/Home/Home'
import ProductPage from './pages/Product'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/categorias/:id" element={<CategoryPage />} />
        <Route path="/productos/:id" element={<ProductPage />} />
        <Route path="/acerca" element={<AboutPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
