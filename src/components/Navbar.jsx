import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, ChevronDown, User, LogOut, Settings, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../services/authService';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const changeLanguage = (lng) => {
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

  const currentLang = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Convessa</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              // Menu après connexion
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                  Dashboard
                </Link>
                <Link to="/send-message" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                  Messages
                </Link>
                <Link to="/sessions" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                  Sessions
                </Link>
                <Link to="/docs" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                  Documentation
                </Link>
              </>
            ) : (
              // Menu avant connexion
              <>
                <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                  {t('nav.home')}
                </Link>
                <Link to="/docs" className="text-gray-700 hover:text-primary-600 transition-colors">
                  {t('nav.docs')}
                </Link>
                <Link to="/pricing" className="text-gray-700 hover:text-primary-600 transition-colors">
                  {t('nav.pricing')}
                </Link>
                <Link to="/faq" className="text-gray-700 hover:text-primary-600 transition-colors">
                  {t('nav.faq')}
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
                <span className="text-xl">{currentLang.flag}</span>
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
                          i18n.language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
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
                        className="w-9 h-9 rounded-full object-cover border-2 border-primary-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
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
                          <p className="text-xs text-primary-600 mt-1 font-medium">
                            Connecté via {getProviderText()}
                          </p>
                        </div>

                        <div className="py-2">
                          <Link
                            to="/sessions"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User size={16} />
                            <span>Mon profil</span>
                          </Link>
                          <button
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings size={16} />
                            <span>Paramètres</span>
                          </button>
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
                  className="text-gray-700 hover:text-primary-600 transition-colors px-4 py-2"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
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
                    className="block text-gray-700 hover:text-primary-600 transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/send-message"
                    className="block text-gray-700 hover:text-primary-600 transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link
                    to="/sessions"
                    className="block text-gray-700 hover:text-primary-600 transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sessions
                  </Link>
                  <Link
                    to="/docs"
                    className="block text-gray-700 hover:text-primary-600 transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Documentation
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
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
                    className="block text-gray-700 hover:text-primary-600 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.home')}
                  </Link>
                  <Link
                    to="/docs"
                    className="block text-gray-700 hover:text-primary-600 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.docs')}
                  </Link>
                  <Link
                    to="/pricing"
                    className="block text-gray-700 hover:text-primary-600 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.pricing')}
                  </Link>
                  <Link
                    to="/faq"
                    className="block text-gray-700 hover:text-primary-600 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.faq')}
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
                      className="block w-full text-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
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
                      i18n.language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
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
