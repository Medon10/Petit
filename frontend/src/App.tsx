import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import CategoriesPage from './pages/Categories/Categories'
import CategoryPage from './pages/Category/Category'
import CartPage from './pages/Cart/Cart'
import CheckoutPage from './pages/Checkout/Checkout'
import HomePage from './pages/Home/Home'
import OrderPage from './pages/Order/Order'
import ProductPage from './pages/Product/Product'
import CartDrawer from './componentes/cart/CartDrawer'
// Panel admin: se carga bajo demanda para no sumar peso a la tienda pública.
const AdminLoginPage = lazy(() => import('./pages/AdminLogin/AdminLogin'))
const AdminCatalogPage = lazy(() => import('./pages/AdminCatalog/AdminCatalog'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrders/AdminOrders'))
const AdminStatsPage = lazy(() => import('./pages/AdminStats/AdminStats'))
const AdminExpensesPage = lazy(() => import('./pages/AdminExpenses/AdminExpenses'))
const AdminInventoryPage = lazy(() => import('./pages/AdminInventory/AdminInventory'))
const AdminPricingPage = lazy(() => import('./pages/AdminPricing/AdminPricing'))
const AdminIncomesPage = lazy(() => import('./pages/AdminIncomes/AdminIncomes'))
import ProtectedAdminRoute from './shared/ProtectedAdminRoute'
import WhatsAppButton from './componentes/WhatsAppButton/WhatsAppButton'
import QuienesSomosPage from './pages/QuienesSomos/QuienesSomos'
import ComoComprarPage from './pages/ComoComprar/ComoComprar'
import TerminosCondicionesPage from './pages/Legal/TerminosCondiciones'
import PoliticaPrivacidadPage from './pages/Legal/PoliticaPrivacidad'

function App() {
  return (
    <BrowserRouter>
      <CartDrawer />
      <WhatsAppButton />
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/categorias/:id" element={<CategoryPage />} />
        <Route path="/productos/:id" element={<ProductPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pedido/:id" element={<OrderPage />} />
        <Route path="/quienes-somos" element={<QuienesSomosPage />} />
        <Route path="/como-comprar" element={<ComoComprarPage />} />
        <Route path="/terminos" element={<TerminosCondicionesPage />} />
        <Route path="/privacidad" element={<PoliticaPrivacidadPage />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/catalogo" element={<ProtectedAdminRoute><AdminCatalogPage /></ProtectedAdminRoute>} />
        <Route path="/admin/inventario" element={<ProtectedAdminRoute><AdminInventoryPage /></ProtectedAdminRoute>} />
        <Route path="/admin/precios" element={<ProtectedAdminRoute><AdminPricingPage /></ProtectedAdminRoute>} />
        <Route path="/admin/pedidos" element={<ProtectedAdminRoute><AdminOrdersPage /></ProtectedAdminRoute>} />
        <Route path="/admin/estadisticas" element={<ProtectedAdminRoute><AdminStatsPage /></ProtectedAdminRoute>} />
        <Route path="/admin/gastos" element={<ProtectedAdminRoute><AdminExpensesPage /></ProtectedAdminRoute>} />
        <Route path="/admin/ingresos" element={<ProtectedAdminRoute><AdminIncomesPage /></ProtectedAdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
