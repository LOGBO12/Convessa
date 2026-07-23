import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react';
import { verifyPhoneOTP, sendPhoneOTP } from '../services/authService';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;
  const devOtp = location.state?.devOtp; // Code OTP en mode dev
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [showDevOtp, setShowDevOtp] = useState(false);
  const inputRefs = useRef([]);

  // Rediriger si pas de numéro de téléphone
  useEffect(() => {
    if (!phone) {
      navigate('/auth');
    }
  }, [phone, navigate]);

  // Timer pour le renvoi du code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Accepter uniquement les chiffres
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Passer automatiquement au champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Vérifier automatiquement si tous les champs sont remplis
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Retour arrière pour revenir au champ précédent
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);

    // Focus le dernier champ rempli
    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();

    // Vérifier automatiquement si 6 chiffres collés
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code) => {
    setLoading(true);
    setError('');

    // Vérifier le code OTP avec le backend
    const result = await verifyPhoneOTP(phone, code);

    setLoading(false);

    if (result.success) {
      // Succès - rediriger vers le dashboard
      navigate('/dashboard');
    } else {
      // Erreur
      setError(result.error || 'Code invalide. Veuillez réessayer.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setError('');
    
    // Renvoyer le code OTP
    const result = await sendPhoneOTP(phone, false); // false = connexion (pas inscription)

    if (result.success) {
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      // Notification de succès
      alert('Un nouveau code a été envoyé sur WhatsApp !');
    } else {
      setError(result.error || 'Erreur lors du renvoi du code');
    }
  };

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
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
          {/* WhatsApp Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Vérification
            </h2>
            <p className="text-gray-600">
              Code envoyé sur WhatsApp au
            </p>
            <p className="text-primary-600 font-semibold text-lg mt-1">
              {phone}
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <div className="flex justify-center space-x-3 mb-4">
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
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                    error
                      ? 'border-red-500 text-red-600'
                      : digit
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center space-x-2 text-red-600 text-sm font-medium"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2 text-primary-600"
              >
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Vérification en cours...</span>
              </motion.div>
            )}
          </div>

          {/* Resend Code */}
          <div className="text-center mb-6">
            {resendTimer > 0 ? (
              <p className="text-gray-500 text-sm">
                Renvoyer le code dans <span className="font-bold text-primary-600">{resendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-primary-600 hover:text-primary-700 font-semibold text-sm underline"
              >
                Renvoyer le code
              </button>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Lightbulb className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-blue-800 text-sm">
                <strong>Astuce :</strong> Vérifiez vos messages WhatsApp et entrez le code à 6 chiffres
              </p>
            </div>
          </div>

          {/* Dev Mode - Show OTP Code */}
          {devOtp && (
            <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-yellow-800 text-sm">
                  <strong>Mode Développement</strong>
                  <p className="mt-1">Code OTP de test: <span className="font-mono font-bold text-lg">{devOtp}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span>Changer de numéro</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
