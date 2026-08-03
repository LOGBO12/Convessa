import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react';
import { verifyRegisterOTP, sendRegisterOTP } from '../services/authService';
import { usePageTitle } from '../hooks/usePageTitle';

const VerifyRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle("Confirmation d'inscription");
  const phone = location.state?.phone;
  const devOtp = location.state?.devOtp;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const inputRefs = useRef([]);

  // Guard – redirect if no phone in state
  useEffect(() => {
    if (!phone) {
      navigate('/signup', { replace: true });
    }
  }, [phone, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = pasted.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);

    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    if (loading) return;
    setLoading(true);
    setError('');

    const result = await verifyRegisterOTP(phone, code);

    setLoading(false);

    if (result.success) {
      if (result.isNewAccount) {
        navigate('/dashboard', {
          state: { toast: 'Compte créé avec succès ! Bienvenue sur Convessa.' },
          replace: true,
        });
      } else {
        // Account already existed – user was logged in
        navigate('/dashboard', {
          state: { toast: 'Compte existant trouvé. Vous êtes connecté.' },
          replace: true,
        });
      }
    } else {
      setError(result.error || 'Code invalide. Veuillez réessayer.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;

    setResendLoading(true);
    setError('');

    const result = await sendRegisterOTP(phone);

    setResendLoading(false);

    if (result.success) {
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setSuccessMessage('Un nouveau code a été envoyé sur WhatsApp.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setError(result.error || 'Erreur lors du renvoi du code.');
    }
  };

  const allFilled = otp.every((d) => d !== '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">Convessa</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 sm:p-8 border-2 border-gray-100">
          {/* WhatsApp icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Confirmer votre inscription</h2>
            <p className="text-gray-600">
              Un code a été envoyé sur WhatsApp pour activer votre compte
            </p>
            {phone && (
              <p className="text-primary-600 font-semibold text-lg mt-2">{phone}</p>
            )}
          </div>

          {/* Dev OTP box */}
          {devOtp && (
            <div className="mb-5 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-yellow-800 text-sm">
                  <strong>Mode Développement</strong>
                  <p className="mt-1">
                    Code OTP de test :{' '}
                    <span className="font-mono font-bold text-lg tracking-widest">{devOtp}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success notification */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2"
              >
                <CheckCircle size={18} />
                <span className="text-sm">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP inputs */}
          <div className="mb-6">
            <div className="flex justify-center gap-1.5 sm:gap-3 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className={`w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                    error
                      ? 'border-red-500 text-red-600 bg-red-50'
                      : digit
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="otp-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center justify-center space-x-2 text-red-600 text-sm font-medium"
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2 text-primary-600 mt-3"
              >
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Vérification en cours...</span>
              </motion.div>
            )}
          </div>

          {/* Manual verify button (visible when all filled but not yet auto-submitted) */}
          {allFilled && !loading && (
            <button
              onClick={() => handleVerify(otp.join(''))}
              className="w-full mb-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
            >
              Confirmer le code
            </button>
          )}

          {/* Resend */}
          <div className="text-center mb-6">
            {resendTimer > 0 ? (
              <p className="text-gray-500 text-sm">
                Renvoyer le code dans{' '}
                <span className="font-bold text-primary-600">{resendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-primary-600 hover:text-primary-700 font-semibold text-sm underline disabled:opacity-50"
              >
                {resendLoading ? 'Envoi en cours...' : 'Renvoyer le code'}
              </button>
            )}
          </div>

          {/* Hint */}
          <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Lightbulb className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-blue-800 text-sm">
                <strong>Astuce :</strong> Vérifiez vos messages WhatsApp et entrez le code à 6
                chiffres pour activer votre compte.
              </p>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span>Changer de numéro</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyRegister;
