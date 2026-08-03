import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyLogin from './pages/VerifyLogin';
import VerifyRegister from './pages/VerifyRegister';
import Dashboard from './pages/Dashboard';
import SendMessage from './pages/SendMessage';
import Sessions from './pages/Sessions';
import Docs from './pages/Docs';
import FAQ from './pages/FAQ';
import Pricing from './pages/Pricing';
import PaymentCallback from './pages/PaymentCallback';
import Contact from './pages/Contact';

function App() {
  return (
    <AuthProvider>
      <SessionProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <Routes>
          {/* Public routes with Navbar (Footer already in Home) */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
              </>
            }
          />

          {/* Documentation - with Navbar + Footer */}
          <Route
            path="/docs"
            element={
              <>
                <Navbar />
                <Docs />
                <Footer />
              </>
            }
          />

          {/* Auth routes - no Navbar, no Footer */}

          {/* New dedicated login / register pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/register" element={<Register />} />

          {/* OTP verification pages */}
          <Route path="/verify-register" element={<VerifyRegister />} />
          <Route path="/verify-login" element={<VerifyLogin />} />

          {/* Legacy routes – redirect to new equivalents */}
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/verify-otp" element={<Navigate to="/login" replace />} />

          {/* Protected routes - with Navbar + Footer */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Dashboard />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/send-message"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <div className="pt-16 min-h-screen bg-gray-50 flex-grow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <SendMessage />
                    </div>
                  </div>
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <div className="pt-16 min-h-screen bg-gray-50 flex-grow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <Sessions />
                    </div>
                  </div>
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          {/* Pricing — plans d'abonnement */}
          <Route
            path="/pricing"
            element={
              <>
                <Navbar />
                <div className="pt-16 min-h-screen bg-gray-50 flex-grow">
                  <Pricing />
                </div>
                <Footer />
              </>
            }
          />

          {/* Callback paiement FedaPay */}
          <Route path="/payment/callback" element={<PaymentCallback />} />

          {/* Contact */}
          <Route
            path="/contact"
            element={
              <>
                <Navbar />
                <Contact />
                <Footer />
              </>
            }
          />

          <Route
            path="/faq"
            element={
              <>
                <Navbar />
                <FAQ />
                <Footer />
              </>
            }
          />
        </Routes>
      </div>
      </SessionProvider>
    </AuthProvider>
  );
}

export default App;
