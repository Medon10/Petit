import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import CategoriesPage from './pages/Categories/Categories'
import CategoryPage from './pages/Category/Category'
import CartPage from './pages/Cart/Cart'
import CheckoutPage from './pages/Checkout/Checkout'
import HomePage from './pages/Home/Home'
import OrderPage from './pages/Order/Order'
import ProductPage from './pages/Product/Product'
import CartDrawer from './componentes/cart/CartDrawer'
import AdminLoginPage from './pages/AdminLogin/AdminLogin'
import AdminCatalogPage from './pages/AdminCatalog/AdminCatalog'
import AdminOrdersPage from './pages/AdminOrders/AdminOrders'
import ProtectedAdminRoute from './shared/ProtectedAdminRoute'
import WhatsAppButton from './componentes/WhatsAppButton/WhatsAppButton'

function App() {
  return (
    <BrowserRouter>
      <CartDrawer />
      <WhatsAppButton />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/categorias/:id" element={<CategoryPage />} />
        <Route path="/productos/:id" element={<ProductPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pedido/:id" element={<OrderPage />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/catalogo" element={<ProtectedAdminRoute><AdminCatalogPage /></ProtectedAdminRoute>} />
        <Route path="/admin/pedidos" element={<ProtectedAdminRoute><AdminOrdersPage /></ProtectedAdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
