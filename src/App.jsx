import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import SendMessage from './pages/SendMessage';
import Sessions from './pages/Sessions';
import Docs from './pages/Docs';
import FAQ from './pages/FAQ';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <Routes>
        {/* Public routes with Navbar (Footer déjà dans Home) */}
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
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        
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
        
        {/* Placeholder routes with Navbar + Footer */}
        <Route
          path="/pricing"
          element={
            <>
              <Navbar />
              <div className="pt-24 px-4 text-center flex-grow">
                <h1 className="text-4xl font-bold">Tarifs</h1>
                <p className="text-gray-600 mt-4">Page en construction...</p>
              </div>
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
    </AuthProvider>
  );
}

export default App;
