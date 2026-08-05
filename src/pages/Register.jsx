import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Smartphone, AlertCircle, LogIn } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { signInWithGoogle, signInWithGithub, sendRegisterOTP } from '../services/authService';

// Error codes that hint at "switch to login" instead
const LOGIN_HINT_CODES = ['DEVICE_ALREADY_REGISTERED', 'PHONE_ALREADY_REGISTERED'];

const Register = () => {
  const navigate = useNavigate();
  usePageTitle('Créer un compte');
  const [phoneValue, setPhoneValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState(null);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'github' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneValue) {
      setError('Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    setLoading(true);
    setError('');
    setErrorCode(null);

    const cleanPhone = phoneValue.replace(/[^0-9]/g, '');
    const result = await sendRegisterOTP(cleanPhone);

    if (result.success) {
      navigate('/verify-register', {
        state: { phone: cleanPhone, devOtp: result.devOtp },
      });
    } else {
      setError(result.error || 'Erreur lors de l\'envoi du code.');
      setErrorCode(result.code || null);
    }

    setLoading(false);
  };

  const handleSocialAuth = async (provider) => {
    setSocialLoading(provider);
    setError('');
    setErrorCode(null);

    const result =
      provider === 'google' ? await signInWithGoogle() : await signInWithGithub();

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || `Erreur lors de la connexion avec ${provider}.`);
    }

    setSocialLoading(null);
  };

  const showLoginHint = errorCode && LOGIN_HINT_CODES.includes(errorCode);
  const isDisabled = loading || socialLoading !== null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background moderne avec gradients et formes */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-primary-50" />
      
      {/* Cercles décoratifs animés */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-200/40 to-primary-300/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-green-200/40 to-whatsapp/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-r from-primary-100/30 to-green-100/30 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      
      {/* Motif de points */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />
      
      {/* Lignes décoratives */}
      <div className="absolute top-20 left-10 w-32 h-0.5 bg-gradient-to-r from-transparent via-primary-300 to-transparent opacity-40 rotate-45" />
      <div className="absolute bottom-32 right-16 w-40 h-0.5 bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-40 -rotate-45" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-14 h-14 bg-whatsapp rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">Convessa</span>
          </Link>
        </div>

        {/* Card avec effet glassmorphism */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
          {/* Effet de brillance en haut */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h2>
            <p className="text-gray-600">Rejoignez Convessa en quelques secondes</p>
          </div>

          {/* Error alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
                {showLoginHint && (
                  <div className="mt-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center space-x-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <LogIn size={15} />
                      <span>Se connecter</span>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social auth */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialAuth('google')}
              disabled={isDisabled}
              className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>Continuer avec Google</span>
            </button>

            <button
              onClick={() => handleSocialAuth('github')}
              disabled={isDisabled}
              className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'github' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>Continuer avec GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Ou avec votre téléphone</span>
            </div>
          </div>

          {/* Phone form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                <Smartphone size={18} />
                <span>Numéro de téléphone WhatsApp</span>
              </label>
              <PhoneInput
                international
                defaultCountry="BJ"
                value={phoneValue}
                onChange={setPhoneValue}
                className="phone-input-auth"
                placeholder="+229 94 11 94 76"
                disabled={isDisabled}
              />
              <p className="mt-2 text-xs text-gray-500">
                Nous enverrons un code de vérification sur WhatsApp
              </p>
            </div>

            <button
              type="submit"
              disabled={isDisabled || !phoneValue}
              className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold text-lg ${
                isDisabled || !phoneValue
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-whatsapp text-white hover:bg-whatsapp-dark transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <span>Recevoir le code</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Switch to login */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Se connecter
            </Link>
          </p>

          {/* Terms */}
          <div className="mt-4 text-center text-xs text-gray-500">
            En continuant, vous acceptez nos{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
              Conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
              Politique de confidentialité
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
