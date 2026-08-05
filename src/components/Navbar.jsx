import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, ChevronDown, User, LogOut, Settings, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../services/authService';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      setUserMenuOpen(false);
      navigate('/');
    }
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return user?.displayName || user?.email || user?.phone || 'Utilisateur';
  };

  const getProviderText = () => {
    if (user?.provider === 'google.com') return 'Google';
    if (user?.provider === 'github.com') return 'GitHub';
    if (user?.provider === 'phone') return 'Téléphone';
    return user?.provider || 'Compte';
  };

  // Fonction pour vérifier si un lien est actif
  const isActive = (path) => {
    return location.pathname === path;
  };

  const currentLang = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{ backgroundColor: '#128C7E' }}>
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Convessa</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              // Menu après connexion
              <>
                <Link 
                  to="/dashboard" 
                  className={`relative text-gray-700 transition-colors font-medium ${
                    isActive('/dashboard') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/dashboard') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/dashboard') && (e.target.style.color = '')}
                >
                  Dashboard
                  {isActive('/dashboard') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
                <Link 
                  to="/send-message" 
                  className={`relative text-gray-700 transition-colors font-medium ${
                    isActive('/send-message') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/send-message') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/send-message') && (e.target.style.color = '')}
                >
                  Messages
                  {isActive('/send-message') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
                <Link 
                  to="/sessions" 
                  className={`relative text-gray-700 transition-colors font-medium ${
                    isActive('/sessions') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/sessions') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/sessions') && (e.target.style.color = '')}
                >
                  Sessions
                  {isActive('/sessions') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
                <Link 
                  to="/docs" 
                  className={`relative text-gray-700 transition-colors font-medium ${
                    isActive('/docs') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/docs') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/docs') && (e.target.style.color = '')}
                >
                  Documentation
                  {isActive('/docs') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
                <Link 
                  to="/contact" 
                  className={`relative text-gray-700 transition-colors font-medium ${
                    isActive('/contact') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/contact') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/contact') && (e.target.style.color = '')}
                >
                  Contact
                  {isActive('/contact') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
              </>
            ) : (
              // Menu avant connexion
              <>
                <Link 
                  to="/" 
                  className={`relative text-gray-700 transition-colors ${
                    isActive('/') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/') && (e.target.style.color = '')}
                >
                  {t('nav.home')}
                  {isActive('/') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
                <Link 
                  to="/docs" 
                  className={`relative text-gray-700 transition-colors ${
                    isActive('/docs') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/docs') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/docs') && (e.target.style.color = '')}
                >
                  {t('nav.docs')}
                  {isActive('/docs') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
                <Link 
                  to="/pricing" 
                  className={`relative text-gray-700 transition-colors ${
                    isActive('/pricing') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/pricing') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/pricing') && (e.target.style.color = '')}
                >
                  {t('nav.pricing')}
                  {isActive('/pricing') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
                <Link 
                  to="/faq" 
                  className={`relative text-gray-700 transition-colors ${
                    isActive('/faq') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/faq') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/faq') && (e.target.style.color = '')}
                >
                  {t('nav.faq')}
                  {isActive('/faq') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
                <Link 
                  to="/contact" 
                  className={`relative text-gray-700 transition-colors ${
                    isActive('/contact') ? 'font-semibold' : ''
                  }`}
                  style={isActive('/contact') ? { color: '#128C7E' } : {}}
                  onMouseEnter={(e) => e.target.style.color = '#128C7E'}
                  onMouseLeave={(e) => !isActive('/contact') && (e.target.style.color = '')}
                >
                  Contact
                  {isActive('/contact') && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5" style={{ backgroundColor: '#128C7E' }}></span>
                  )}
                </Link>
              </>
            )}
          </div>

          {/* Right Side - Language & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Globe size={20} className="text-gray-600" />
                <span className="text-sm text-gray-700">{currentLang.name}</span>
                <ChevronDown size={16} className="text-gray-600" />
              </button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                    onMouseLeave={() => setLangMenuOpen(false)}
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                          i18n.language === lang.code ? 'text-gray-700' : 'text-gray-700'
                        }`}
                        style={i18n.language === lang.code ? { backgroundColor: '#e6f4f3', color: '#128C7E' } : {}}
                      >
                        <Globe size={16} />
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAuthenticated ? (
              // User Menu (après connexion)
              <>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {user?.photoUrl ? (
                      <img 
                        src={user.photoUrl} 
                        alt={getDisplayName()} 
                        className="w-9 h-9 rounded-full object-cover border-2 border-whatsapp-light"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: '#128C7E' }}>
                        <span className="text-white font-medium text-sm">{getUserInitials()}</span>
                      </div>
                    )}
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-xs text-gray-500">{getProviderText()}</p>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2"
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {user?.email || user?.phone || 'Aucun email'}
                          </p>
                          <p className="text-xs mt-1 font-medium" style={{ color: '#128C7E' }}>
                            Connecté via {getProviderText()}
                          </p>
                        </div>

                        <div className="py-2">
                          {/* Boutons Mon profil et Paramètres supprimés */}
                        </div>

                        <div className="border-t border-gray-100 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={16} />
                            <span>Se déconnecter</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              // Auth buttons (avant connexion)
              <>
                <Link
                  to="/login"
                  className={`relative text-gray-700 hover:text-whatsapp-dark transition-colors px-4 py-2 ${
                    isActive('/login') ? 'text-whatsapp-dark font-semibold' : ''
                  }`}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="text-white px-6 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
                  style={{ backgroundColor: '#128C7E' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0d6459'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#128C7E'}
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-4">
              {isAuthenticated ? (
                // Menu mobile après connexion
                <>
                  <Link
                    to="/dashboard"
                    className={`block py-2 font-medium transition-colors ${
                      isActive('/dashboard') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/dashboard') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/send-message"
                    className={`block py-2 font-medium transition-colors ${
                      isActive('/send-message') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/send-message') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link
                    to="/sessions"
                    className={`block py-2 font-medium transition-colors ${
                      isActive('/sessions') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/sessions') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sessions
                  </Link>
                  <Link
                    to="/docs"
                    className={`block py-2 font-medium transition-colors ${
                      isActive('/docs') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/docs') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Documentation
                  </Link>
                  <Link
                    to="/contact"
                    className={`block py-2 font-medium transition-colors ${
                      isActive('/contact') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/contact') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center space-x-3 px-2 py-2 mb-3">
                      {user?.photoUrl ? (
                        <img 
                          src={user.photoUrl} 
                          alt={getDisplayName()} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#128C7E' }}>
                          <span className="text-white font-medium">{getUserInitials()}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                        <p className="text-xs text-gray-500">{user?.email || user?.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-6 py-3 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <LogOut size={18} />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </>
              ) : (
                // Menu mobile avant connexion
                <>
                  <Link
                    to="/"
                    className={`block py-2 transition-colors ${
                      isActive('/') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.home')}
                  </Link>
                  <Link
                    to="/docs"
                    className={`block py-2 transition-colors ${
                      isActive('/docs') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/docs') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.docs')}
                  </Link>
                  <Link
                    to="/pricing"
                    className={`block py-2 transition-colors ${
                      isActive('/pricing') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/pricing') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.pricing')}
                  </Link>
                  <Link
                    to="/faq"
                    className={`block py-2 transition-colors ${
                      isActive('/faq') 
                        ? 'px-3 rounded-lg font-semibold' 
                        : 'text-gray-700'
                    }`}
                    style={isActive('/faq') ? { color: '#128C7E', backgroundColor: '#e6f4f3' } : {}}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.faq')}
                  </Link>
                  <Link
                    to="/contact"
                    className={`block py-2 transition-colors ${
                      isActive('/contact') 
                        ? 'text-whatsapp-dark bg-whatsapp-light px-3 rounded-lg font-semibold' 
                        : 'text-gray-700 hover:text-whatsapp-dark'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <Link
                      to="/login"
                      className="block w-full text-center text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/signup"
                      className="block w-full text-center bg-whatsapp-dark text-white px-6 py-3 rounded-lg hover:bg-whatsapp transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.signup')}
                    </Link>
                  </div>
                </>
              )}

              {/* Language Selector (toujours visible) */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                      i18n.language === lang.code ? 'bg-whatsapp-light text-whatsapp-dark' : 'text-gray-700'
                    }`}
                  >
                    <Globe size={16} />
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
