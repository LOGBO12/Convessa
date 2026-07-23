import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  CheckCircle,
  Loader,
  QrCode,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  Copy,
  Eye,
  EyeOff,
  XCircle,
} from 'lucide-react';
import { tenantsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useUserSession from '../hooks/useUserSession';
import { connectSocket, onTenantConnected, onTenantQR, disconnectSocket } from '../services/socket';

const Sessions = () => {
  const { user } = useAuth();
  const { session: userSession, loading: sessionLoading, refresh: refreshSession } = useUserSession();
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [pollingStatus, setPollingStatus] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  // Connexion Socket.io et écoute des événements
  useEffect(() => {
    connectSocket();

    // Écouter quand un tenant est connecté
    const unsubscribeConnected = onTenantConnected((data) => {
      console.log('Tenant connecté:', data);
      if (data.tenantId === userSession?.tenantId) {
        setApiKey(data.apiKey);
        setShowQRModal(false);
        setPollingStatus(false);
        refreshSession();
      }
    });

    // Écouter les QR codes des tenants
    const unsubscribeQR = onTenantQR((data) => {
      console.log('Tenant QR reçu:', data);
      if (data.tenantId === userSession?.tenantId && data.qrCode) {
        setQrCode(data.qrCode);
        setQrLoading(false);
      }
    });

    return () => {
      unsubscribeConnected();
      unsubscribeQR();
      disconnectSocket();
    };
  }, [userSession?.tenantId, refreshSession]);

  // Créer la session automatiquement si l'utilisateur n'en a pas
  const handleCreateSession = async () => {
    if (!user?.phone) {
      setError('Numéro de téléphone non trouvé. Reconnectez-vous.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '');
      
      const response = await tenantsAPI.create({
        phone: cleanPhone,
        name: `WhatsApp - ${user.displayName || user.email || 'Utilisateur'}`,
        userUid: user.uid, // Ajout du userUid Firebase
        webhookUrl: undefined,
      });

      // Attendre 3 secondes puis afficher le QR code
      setTimeout(async () => {
        await refreshSession();
        handleShowQR(response.tenantId);
      }, 3000);

    } catch (err) {
      console.error('Erreur création session:', err);
      setError(err.message || 'Erreur lors de la création de la session');
    } finally {
      setCreating(false);
    }
  };

  const handleShowQR = async (tenantId) => {
    setShowQRModal(true);
    setQrLoading(true);
    setQrCode(null);
    setPollingStatus(true);

    try {
      const response = await tenantsAPI.getQRCode(tenantId);
      
      if (response.status === 'connected') {
        setError('Cette session est déjà connectée');
        setQrLoading(false);
        setPollingStatus(false);
        return;
      }

      if (response.status === 'pending_qr' && response.qrCode) {
        setQrCode(response.qrCode);
        setQrLoading(false);
        // Socket.io se chargera de détecter la connexion automatiquement
      }
    } catch (err) {
      console.error('Erreur récupération QR:', err);
      setError(err.message || 'Erreur lors de la récupération du QR code');
      setQrLoading(false);
      setPollingStatus(false);
    }
  };

  const handleRefreshQR = async () => {
    if (!userSession?.tenantId) return;
    setQrLoading(true);
    setQrCode(null);

    try {
      const response = await tenantsAPI.getQRCode(userSession.tenantId);
      if (response.qrCode) {
        setQrCode(response.qrCode);
      }
    } catch (err) {
      console.error('Erreur rafraîchissement QR:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const copyApiKey = () => {
    if (userSession?.apiKeyHint) {
      navigator.clipboard.writeText(userSession.apiKeyHint);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'green',
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200',
          label: 'Connecté',
        };
      case 'pending_qr':
        return {
          icon: Clock,
          color: 'yellow',
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          border: 'border-yellow-200',
          label: 'En attente',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'red',
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200',
          label: 'Déconnecté',
        };
      case 'revoked':
        return {
          icon: XCircle,
          color: 'red',
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200',
          label: 'Révoqué',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'gray',
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          label: status,
        };
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ma Session WhatsApp</h1>
        <p className="text-gray-600 mt-2">
          Connectez votre numéro WhatsApp pour obtenir votre clé API
        </p>
      </div>

      {/* Session Display */}
      {!userSession ? (
        // Pas de session - Afficher le CTA pour créer
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center"
        >
          <Smartphone className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Connectez votre WhatsApp
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Pour utiliser l'API Convessa, vous devez d'abord connecter votre numéro WhatsApp.
            Vous recevrez votre clé API unique après la connexion.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">
              {error}
            </div>
          )}
          
          <button
            onClick={handleCreateSession}
            disabled={creating}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <QrCode size={20} />
                <span className="font-medium">Connecter WhatsApp</span>
              </>
            )}
          </button>
        </motion.div>
      ) : (
        // Session existe - Afficher les détails
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`h-2 ${getStatusConfig(userSession.status).bg}`}></div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-xl ${getStatusConfig(userSession.status).bg} flex items-center justify-center`}>
                    {React.createElement(getStatusConfig(userSession.status).icon, {
                      className: getStatusConfig(userSession.status).text,
                      size: 32,
                    })}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {userSession.name || 'Ma Session WhatsApp'}
                    </h3>
                    <p className="text-gray-600">{userSession.phone}</p>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-2 ${getStatusConfig(userSession.status).bg} ${getStatusConfig(userSession.status).text} px-4 py-2 rounded-full font-medium`}>
                  {React.createElement(getStatusConfig(userSession.status).icon, { size: 18 })}
                  <span>{getStatusConfig(userSession.status).label}</span>
                </div>
              </div>

              {/* API Key Section */}
              {userSession.status === 'connected' && userSession.apiKeyHint && (
                <div className="bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Votre Clé API</span>
                    </h4>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-primary-300">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-gray-900">
                        {showApiKey ? userSession.apiKeyHint : `${userSession.apiKeyHint.substring(0, 8)}${'•'.repeat(20)}`}
                      </code>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title={showApiKey ? "Masquer" : "Afficher"}
                        >
                          {showApiKey ? (
                            <EyeOff size={18} className="text-gray-600" />
                          ) : (
                            <Eye size={18} className="text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={copyApiKey}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Copier"
                        >
                          {copiedApiKey ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <Copy size={18} className="text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-3">
                    ⚠️ Gardez votre clé API secrète. Elle a également été envoyée sur votre WhatsApp.
                  </p>
                </div>
              )}

              {/* Actions */}
              {(userSession.status === 'pending_qr' || userSession.status === 'disconnected') && (
                <button
                  onClick={() => handleShowQR(userSession.tenantId)}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <QrCode size={20} />
                  <span>Scanner le QR Code</span>
                </button>
              )}
              
              {/* Session Info */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 mb-1">ID Session</p>
                  <code className="text-xs text-gray-900">{userSession.tenantId.slice(0, 12)}...</code>
                </div>
                {userSession.connectedAt && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 mb-1">Connecté le</p>
                    <p className="text-gray-900">{new Date(userSession.connectedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Comment utiliser votre clé API</span>
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Copiez votre clé API ci-dessus</li>
              <li>Ajoutez-la dans vos en-têtes HTTP: <code className="bg-blue-100 px-2 py-0.5 rounded">X-Api-Key: VOTRE_CLE</code></li>
              <li>Consultez la documentation pour les endpoints disponibles</li>
              <li>Commencez à envoyer des messages via l'API REST</li>
            </ol>
          </div>
        </motion.div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <QrCode size={24} />
                  <span>Scanner le QR Code</span>
                </h2>
              </div>

              {/* Content */}
              <div className="p-6">
                {qrLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="animate-spin text-primary-600 mb-4" size={48} />
                    <p className="text-gray-600">Génération du QR code...</p>
                  </div>
                ) : qrCode ? (
                  <div className="space-y-4">
                    {/* QR Code Image */}
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 flex justify-center relative">
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                      
                      {/* Polling indicator */}
                      {pollingStatus && (
                        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-2 animate-pulse">
                          <Loader className="animate-spin" size={12} />
                          <span>En attente du scan...</span>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Ouvrez WhatsApp sur votre téléphone</li>
                        <li>Appuyez sur Menu (⋮) puis sur "Appareils liés"</li>
                        <li>Appuyez sur "Lier un appareil"</li>
                        <li>Pointez votre téléphone vers cet écran pour scanner le code</li>
                      </ol>
                      <p className="text-xs text-blue-700 mt-3 flex items-center space-x-1">
                        <AlertCircle size={14} />
                        <span>Le QR code expire après 60 secondes</span>
                      </p>
                      {pollingStatus && (
                        <p className="text-xs text-green-700 mt-2 font-medium flex items-center space-x-1">
                          <CheckCircle size={14} />
                          <span>Après le scan, votre clé API sera générée automatiquement</span>
                        </p>
                      )}
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={handleRefreshQR}
                      disabled={qrLoading}
                      className="w-full flex items-center justify-center space-x-2 border-2 border-primary-600 text-primary-600 px-4 py-3 rounded-lg hover:bg-primary-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={18} className={qrLoading ? 'animate-spin' : ''} />
                      <span>Actualiser le QR code</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="text-yellow-600 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">QR code non disponible</p>
                    <button
                      onClick={handleRefreshQR}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <RefreshCw size={18} />
                      <span>Réessayer</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal - API Key */}
      <AnimatePresence>
        {apiKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center"
                >
                  <CheckCircle className="text-green-600" size={48} />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  🎉 Connexion Réussie !
                </h2>
                <p className="text-green-100">
                  Votre WhatsApp est maintenant connecté à Convessa
                </p>
              </div>

              {/* API Key Content */}
              <div className="p-8">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Votre Clé API Unique</span>
                    </h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border-2 border-purple-400 mb-4">
                    <code className="text-sm font-mono text-gray-900 break-all block">
                      {apiKey}
                    </code>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      setCopiedApiKey(true);
                      setTimeout(() => setCopiedApiKey(false), 2000);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    {copiedApiKey ? (
                      <>
                        <CheckCircle size={20} />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy size={20} />
                        <span>Copier la Clé API</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Important Notice */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-red-900 mb-1">⚠️ Important - À lire attentivement</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• <strong>Cette clé ne sera affichée qu'une seule fois</strong></li>
                        <li>• Copiez-la et stockez-la dans un endroit sûr (gestionnaire de mots de passe, .env, etc.)</li>
                        <li>• Ne la partagez JAMAIS publiquement (GitHub, forums, etc.)</li>
                        <li>• Utilisez-la dans vos requêtes HTTP avec le header: <code className="bg-red-100 px-1 rounded">X-Api-Key</code></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <span>Prochaines étapes</span>
                  </h4>
                  <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
                    <li>Allez dans <strong>Envoyer Message</strong> pour tester l'envoi</li>
                    <li>Consultez la <strong>Documentation</strong> pour intégrer l'API dans votre application</li>
                    <li>Utilisez votre clé API dans toutes vos requêtes HTTP</li>
                  </ol>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setApiKey(null)}
                  className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                >
                  J'ai copié ma clé, continuer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sessions;
