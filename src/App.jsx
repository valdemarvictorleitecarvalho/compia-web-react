import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { StoreProvider } from './contexts/StoreContext'
import { CartProvider } from './contexts/CartContext'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmed from './pages/OrderConfirmed'
import MyAccount from './pages/MyAccount'
import Admin from './pages/admin/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <ScrollToTop />
            <div className="flex min-h-screen flex-col bg-paper text-ink">
              <Header />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/produto/:id" element={<ProductDetail />} />
                  <Route path="/carrinho" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/pedido-confirmado/:id" element={<OrderConfirmed />} />
                  <Route path="/minha-conta" element={<MyAccount />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
