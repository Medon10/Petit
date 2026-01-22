import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AboutPage from './pages/About'
import CategoryPage from './pages/Category'
import CategoriesPage from './pages/Categories'
import CartPage from './pages/Cart'
import CheckoutPage from './pages/Checkout'
import ContactPage from './pages/Contact'
import HomePage from './pages/Home/Home'
import OrderConfirmationPage from './pages/OrderConfirmation'
import ProductPage from './pages/Product'
import CartDrawer from './componentes/cart/CartDrawer'

function App() {
  return (
    <BrowserRouter>
      <CartDrawer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/categorias/:id" element={<CategoryPage />} />
        <Route path="/productos/:id" element={<ProductPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pedido/:id" element={<OrderConfirmationPage />} />
        <Route path="/acerca" element={<AboutPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
