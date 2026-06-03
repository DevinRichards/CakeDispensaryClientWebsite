import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { UserProvider } from './context/UserContext'
import AgeGate from './components/AgeGate'
import Nav from './components/Nav'
import Footer from './components/Footer'
import CartSidebar from './components/CartSidebar'
import CookieConsent from './components/CookieConsent'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Menu from './pages/Menu'
import About from './pages/About'
import Deals from './pages/Deals'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import Admin from './pages/Admin'
import SignIn from './pages/SignIn'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Accessibility from './pages/Accessibility'
import ResponsibleUse from './pages/ResponsibleUse'

export function AppContent() {
  return (
    <CartProvider>
      <UserProvider>
        <AgeGate>
          <div className="min-h-screen bg-background text-on-surface flex flex-col">
            <ScrollToTop />
            <Nav />
            <CartSidebar />
            <main className="flex-1 pt-16">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/deals" element={<Deals />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/admin" element={<Admin />} />
                  {/* Customer account */}
                  <Route path="/signin/*" element={<SignIn />} />
                  <Route path="/profile" element={<Profile />} />
                  {/* Legal & Compliance */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/accessibility" element={<Accessibility />} />
                  <Route path="/responsible-use" element={<ResponsibleUse />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </main>
            <Footer />
            <CookieConsent />
          </div>
        </AgeGate>
      </UserProvider>
    </CartProvider>
  )
}

export function AppWithRouter({ Router, routerProps = {} }) {
  return (
    <Router {...routerProps}>
      <AppContent />
    </Router>
  )
}

export default function App() {
  return <AppWithRouter Router={BrowserRouter} />
}
