import React, { useState, useEffect, useRef } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { usePageTitle } from '../hooks/usePageTitle';
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
  Key,
  X,
} from 'lucide-react';
import { tenantsAPI, saveTenantApiKey, getTenantApiKey, communityAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useUserSession from '../hooks/useUserSession';
import {
  connectSocket,
  onTenantConnected,
  onTenantQR,
  onTenantError,
} from '../services/socket';

const Sessions = () => {
  const { user } = useAuth();
  usePageTitle('Mes sessions WhatsApp');
  const { session: userSession, loading: sessionLoading, refresh: refreshSession } = useUserSession();

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pollingStatus, setPollingStatus] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  // Modal clé API après connexion réussie
  const [apiKeyModal, setApiKeyModal] = useState(null); // { key, hint, expiresAt } | null
  const [apiKeyModalCopied, setApiKeyModalCopied] = useState(false);
  const [errorFromSocket, setErrorFromSocket] = useState('');

  // Modal communauté — affiché après fermeture du modal clé API
  const [communityModal, setCommunityModal] = useState(false);
  const [communityForm, setCommunityForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [communitySubmitting, setCommunitySubmitting] = useState(false);
  const [communityDone, setCommunityDone] = useState(false);

  // Modal "code de parrainage" — affiché juste après le scan réussi du QR,
  // avant la génération de la clé API.
  const [activationModal, setActivationModal] = useState(false);
  const [hasReferralCode, setHasReferralCode] = useState(null); // true | false | null (pas encore choisi)
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState('');

  // Ref pour avoir accès au tenantId courant dans les callbacks socket
  // sans recréer les listeners à chaque render
  const activeTenantIdRef = useRef(null);
  // Ref pour avoir accès au user.uid dans les callbacks socket (stable)
  const userUidRef = useRef(user?.uid ?? null);

  useEffect(() => {
    activeTenantIdRef.current = userSession?.tenantId ?? null;
  }, [userSession?.tenantId]);

  useEffect(() => {
    userUidRef.current = user?.uid ?? null;
  }, [user?.uid]);

  // Au chargement : si session connectée et pas de clé en localStorage → la récupérer depuis le backend
  useEffect(() => {
    if (!userSession || userSession.status !== 'connected' || !user?.uid) return;
    const existing = getTenantApiKey(user.uid);
    if (!existing) {
      // La clé n'est pas en localStorage → la récupérer via l'API (self-service, "moi")
      tenantsAPI.getApiKey()
        .then(res => {
          if (res.apiKey) {
            saveTenantApiKey(user.uid, res.apiKey);
          }
        })
        .catch(err => console.warn('Impossible de récupérer la clé API:', err));
    }
  }, [userSession, user?.uid]);

  // Ref pour annuler le polling de QR si le socket livre le QR avant
  const qrPollTimerRef = useRef(null);
  // Ref pour le polling de statut (fallback socket)
  const statusPollRef  = useRef(null);

  const stopQrPolling = () => {
    if (qrPollTimerRef.current) {
      clearTimeout(qrPollTimerRef.current);
      qrPollTimerRef.current = null;
    }
  };

  // Polling HTTP de fallback — utilisé quand le socket ne répond pas
  // (alwaysdata mutualisé bloque souvent les WebSockets persistants)
  const startStatusPolling = () => {
    if (statusPollRef.current) return; // déjà actif
    statusPollRef.current = setInterval(async () => {
      try {
        const session = await tenantsAPI.getMe();
        if (session?.status === 'connected') {
          stopStatusPolling();
          setShowQRModal(false);
          setPollingStatus(false);
          stopQrPolling();
          await refreshSession();
          if (!session.apiKeyHint) {
            setActivationError('');
            setHasReferralCode(null);
            setReferralCodeInput('');
            setActivationModal(true);
          } else {
            setSuccessMsg('✅ WhatsApp connecté avec succès ! Votre clé API a été générée.');
          }
        }
      } catch { /* ignorer les erreurs réseau passagères */ }
    }, 3000);
  };

  const stopStatusPolling = () => {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
  };

  useEffect(() => {
    connectSocket();

    const unsubConnected = onTenantConnected((data) => {
      console.log('[Socket] tenant_connected', data);
      const currentId = activeTenantIdRef.current;
      if (!currentId || data.tenantId === currentId) {
        stopStatusPolling(); // socket a répondu — plus besoin du polling HTTP
        setShowQRModal(false);
        setPollingStatus(false);

        // QR scanné avec succès, mais la clé API n'est pas encore générée :
        // on demande d'abord à l'utilisateur s'il possède un code de parrainage.
        if (data.awaitingActivation) {
          setActivationError('');
          setHasReferralCode(null);
          setReferralCodeInput('');
          setActivationModal(true);
          refreshSession();
          return;
        }

        // Sauvegarder la clé API en localStorage
        if (data.apiKey && userUidRef.current) {
          saveTenantApiKey(userUidRef.current, data.apiKey);
        }
        // Ouvrir le modal clé API si la clé est dans l'event
        if (data.apiKey || data.apiKeyHint) {
          setApiKeyModal({
            key:       data.apiKey ?? null,
            hint:      data.apiKeyHint ?? null,
            expiresAt: data.apiKeyExpiresAt ?? null,
          });
          // Proposer la communauté 3s après l'affichage de la clé
          setTimeout(() => {
            const phone = userSession?.phone ?? '';
            setCommunityForm(prev => ({ ...prev, phone: phone && phone !== '—' ? phone : '' }));
            setCommunityModal(true);
          }, 3000);
        } else {
          setSuccessMsg('✅ WhatsApp connecté avec succès ! Votre clé API a été générée.');
        }
        refreshSession();
      }
    });

    const unsubQR = onTenantQR((data) => {
      console.log('[Socket] tenant_qr', data);
      const currentId = activeTenantIdRef.current;
      if (!currentId || data.tenantId === currentId) {
        if (data.qrCode) {
          stopQrPolling(); // le socket a livré le QR, plus besoin de poller
          setQrCode(data.qrCode);
          setQrLoading(false);
        }
      }
    });

    const unsubError = onTenantError((data) => {
      console.log('[Socket] tenant_error', data);
      const currentId = activeTenantIdRef.current;
      if (!currentId || data.tenantId === currentId) {
        const msg = data.message || data.error || 'Une erreur est survenue.';
        setErrorFromSocket(msg);
        setShowQRModal(false);
        setPollingStatus(false);
        setQrLoading(false);
      }
    });

    return () => {
      unsubConnected();
      unsubQR();
      unsubError();
      stopQrPolling();
      stopStatusPolling();
      // Ne pas déconnecter le socket ici — il est partagé
    };
  }, []); // ← dépendances vides : listeners créés une seule fois, la ref se met à jour en dehors

  /**
   * Crée SA session et lance directement le scan — plus aucune saisie de
   * numéro : le vrai numéro WhatsApp est déduit automatiquement du compte
   * scanné (le backend le déduit du JID Baileys après connexion).
   *
   * Si l'utilisateur a déjà une session (409 USER_ALREADY_HAS_SESSION), on
   * récupère directement son QR/état existant plutôt que d'échouer.
   */
  const handleCreateSession = async () => {
    setCreating(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await tenantsAPI.create({
        name: `WhatsApp - ${user.displayName || user.email || 'Utilisateur'}`,
      });

      activeTenantIdRef.current = response.tenantId;
      setTimeout(() => handleShowQR(), 1500);

    } catch (err) {
      if (err.code === 'USER_ALREADY_HAS_SESSION') {
        activeTenantIdRef.current = err.data?.tenantId ?? activeTenantIdRef.current;
        if (err.data?.status === 'connected') {
          await refreshSession();
          setSuccessMsg('Session déjà active récupérée.');
        } else {
          setTimeout(() => handleShowQR(), 300);
        }
      } else {
        console.error('Erreur création session:', err);
        setError(err.message || 'Erreur lors de la création de la session');
      }
    } finally {
      setCreating(false);
    }
  };

  // Récupère MON QR code (self-service — jamais de tenantId dans l'appel :
  // le backend résout "moi" depuis le token Firebase).
  // Si le QR n'est pas encore dispo (Baileys pas encore prêt), on réessaie
  // toutes les 2s jusqu'à l'obtenir ou jusqu'à 30s max.
  const handleShowQR = async (attempt = 1) => {
    const MAX_ATTEMPTS = 15; // 15 × 2s = 30s max

    if (attempt === 1) {
      setShowQRModal(true);
      setQrLoading(true);
      setQrCode(null);
      setPollingStatus(true);
      stopQrPolling();
      // Démarrer le polling HTTP en parallèle du socket
      // (fallback pour les hébergements qui bloquent les WebSockets)
      startStatusPolling();
    }

    try {
      const response = await tenantsAPI.getQRCode();

      if (response.status === 'connected') {
        setQrLoading(false);
        setPollingStatus(false);
        setShowQRModal(false);
        await refreshSession();
        return;
      }

      if (response.qrCode) {
        // QR disponible immédiatement (mis en cache côté backend)
        setQrCode(response.qrCode);
        setQrLoading(false);
        return;
      }

      // QR pas encore prêt (Baileys initialise) — réessayer dans 2s
      if (attempt < MAX_ATTEMPTS) {
        qrPollTimerRef.current = setTimeout(() => handleShowQR(attempt + 1), 2000);
      } else {
        // Timeout — on arrête le spinner, l'utilisateur peut cliquer "Réessayer"
        setQrLoading(false);
        setPollingStatus(false);
      }
    } catch (err) {
      console.error('Erreur récupération QR:', err);
      setError(err.message || 'Erreur lors de la récupération du QR code');
      setQrLoading(false);
      setPollingStatus(false);
      stopQrPolling();
    }
  };

  const handleRefreshQR = async () => {
    setQrLoading(true);
    setQrCode(null);

    try {
      const response = await tenantsAPI.getQRCode();
      if (response.qrCode) {
        setQrCode(response.qrCode);
      }
    } catch (err) {
      console.error('Erreur rafraîchissement QR:', err);
    } finally {
      setQrLoading(false);
    }
  };

  /**
   * Envoie la décision de l'utilisateur (avec ou sans code de parrainage) et
   * génère la clé API définitive avec les privilèges correspondants.
   */
  const handleActivate = async () => {
    if (hasReferralCode === true && !referralCodeInput.trim()) {
      setActivationError('Veuillez saisir votre code de parrainage, ou choisir "Non" si vous n\'en avez pas.');
      return;
    }

    setActivating(true);
    setActivationError('');

    try {
      const codeToSend = hasReferralCode === true ? referralCodeInput.trim() : '';
      const response = await tenantsAPI.activate(codeToSend);

      if (response.apiKey && user?.uid) {
        saveTenantApiKey(user.uid, response.apiKey);
      }

      setActivationModal(false);
      setHasReferralCode(null);
      setReferralCodeInput('');

      setApiKeyModal({
        key:       response.apiKey ?? null,
        hint:      response.apiKeyHint ?? null,
        expiresAt: response.apiKeyExpiresAt ?? null,
      });

      refreshSession();
    } catch (err) {
      console.error('Erreur activation session:', err);
      if (err.code === 'INVALID_REFERRAL_CODE') {
        setActivationError('Ce code de parrainage est invalide ou introuvable. Vérifiez-le, ou continuez sans code.');
      } else if (err.code === 'ALREADY_ACTIVATED') {
        // Déjà activée entre-temps (ex: double clic) — on ferme simplement le modal.
        setActivationModal(false);
        await refreshSession();
      } else {
        setActivationError(err.message || "Erreur lors de l'activation de votre session");
      }
    } finally {
      setActivating(false);
    }
  };

  const handleCloseApiKeyModal = () => {
    setApiKeyModal(null);
    // Proposer la communauté après fermeture si pas déjà fait
    if (!communityDone) {
      setTimeout(() => {
        // Pré-remplir le téléphone depuis la session si disponible
        const sessionPhone = userSession?.phone && userSession.phone !== '—' ? userSession.phone : '';
        setCommunityForm({ firstName: '', lastName: '', phone: sessionPhone });
        setCommunityModal(true);
      }, 400);
    }
  };

  const handleJoinCommunity = async (e) => {
    e.preventDefault();
    if (!communityForm.firstName.trim() || !communityForm.lastName.trim() || !communityForm.phone.trim()) return;

    setCommunitySubmitting(true);
    try {
      await communityAPI.join({
        firstName: communityForm.firstName.trim(),
        lastName: communityForm.lastName.trim(),
        phone: communityForm.phone.trim(),
        userUid: user?.uid,
      });
      setCommunityDone(true);
    } catch {
      // Ignorer les erreurs silencieusement (déjà membre, etc.)
      setCommunityDone(true);
    } finally {
      setCommunitySubmitting(false);
    }
  };

  const copyApiKey = () => {
    // Copier la vraie clé complète depuis localStorage, ou le hint en fallback
    const fullKey = getTenantApiKey(user?.uid);
    const keyToCopy = fullKey || userSession?.apiKeyHint;
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return { icon: Wifi, bg: 'bg-green-50', text: 'text-green-600', label: 'Connecté' };
      case 'pending_qr':
        return { icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'En attente' };
      case 'disconnected':
        return { icon: WifiOff, bg: 'bg-red-50', text: 'text-red-600', label: 'Déconnecté' };
      case 'revoked':
        return { icon: XCircle, bg: 'bg-red-50', text: 'text-red-600', label: 'Révoqué' };
      default:
        return { icon: AlertCircle, bg: 'bg-gray-50', text: 'text-gray-600', label: status };
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
          Connectez votre WhatsApp en un clic pour obtenir votre clé API
        </p>
      </div>

      {/* Banner succès connexion WhatsApp */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800"
        >
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-600 hover:text-green-800">✕</button>
        </motion.div>
      )}

      {/* Erreur Socket.io (ex: session error) */}
      {errorFromSocket && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800"
        >
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span className="flex-1 font-medium">{errorFromSocket}</span>
          <button onClick={() => setErrorFromSocket('')} className="ml-auto text-red-500 hover:text-red-700">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {/* Session Display */}
      {!userSession ? (
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
            Cliquez sur le bouton ci-dessous, puis scannez le QR code avec le WhatsApp
            que vous souhaitez connecter — n'importe quel numéro fonctionne, vous n'avez
            rien à saisir à l'avance.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateSession}
            disabled={creating}
            className="inline-flex items-center space-x-2 bg-whatsapp text-white px-8 py-4 rounded-lg hover:bg-whatsapp-dark transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <><Loader className="animate-spin" size={20} /><span>Préparation...</span></>
            ) : (
              <><QrCode size={20} /><span className="font-medium">Connecter WhatsApp</span></>
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
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
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
                    <p className="text-gray-600">
                      {userSession.phone && userSession.phone !== '—' ? userSession.phone : 'Numéro en attente de scan'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center space-x-2 ${getStatusConfig(userSession.status).bg} ${getStatusConfig(userSession.status).text} px-4 py-2 rounded-full font-medium`}>
                  {React.createElement(getStatusConfig(userSession.status).icon, { size: 18 })}
                  <span>{getStatusConfig(userSession.status).label}</span>
                </div>
              </div>

              {/* API Key Section */}
              {userSession.status === 'connected' && userSession.apiKeyHint && (() => {
                const fullKey = getTenantApiKey(user?.uid);
                const displayKey = fullKey || userSession.apiKeyHint;
                return (
                <div className="bg-whatsapp-light border-2 border-primary-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Votre Clé API</span>
                    </h4>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-primary-300">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-gray-900 flex-1 break-all">
                        {showApiKey ? displayKey : `${displayKey.substring(0, 20)}${'•'.repeat(16)}`}
                      </code>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title={showApiKey ? "Masquer" : "Afficher"}
                        >
                          {showApiKey ? <EyeOff size={18} className="text-gray-600" /> : <Eye size={18} className="text-gray-600" />}
                        </button>
                        <button
                          onClick={copyApiKey}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Copier la clé complète"
                        >
                          {copiedApiKey ? <CheckCircle size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-3">Gardez votre clé API secrète.</p>
                </div>
                );
              })()}

              {/* Actions */}
              {(userSession.status === 'pending_qr' || userSession.status === 'disconnected') && (
                <button
                  onClick={() => handleShowQR()}
                  className="w-full flex items-center justify-center space-x-2 bg-whatsapp text-white px-6 py-4 rounded-lg hover:bg-whatsapp-dark transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <QrCode size={20} />
                  <span>Scanner le QR Code</span>
                </button>
              )}

              {/* Session Info */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
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
            onClick={() => { setShowQRModal(false); stopStatusPolling(); stopQrPolling(); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-whatsapp px-6 py-4">
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
                    <p className="text-xs text-gray-400 mt-2">Connexion à WhatsApp en cours</p>
                  </div>
                ) : qrCode ? (
                  <div className="space-y-4">
                    {/* QR Code Image */}
                    <div className="bg-gray-50 p-3 sm:p-6 rounded-xl border-2 border-gray-200 flex justify-center relative">
                      <img src={qrCode} alt="QR Code" className="w-48 h-48 sm:w-64 sm:h-64" />

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

                    {/* Erreur socket dans le modal QR */}
                    {errorFromSocket && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{errorFromSocket}</p>
                      </div>
                    )}
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

      {/* Modal code de parrainage — affiché juste après le scan QR réussi,
          avant la génération de la clé API */}
      <AnimatePresence>
        {activationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-whatsapp px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <CheckCircle size={24} />
                  <span>WhatsApp connecté !</span>
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                <p className="text-sm text-gray-700">
                  Une dernière étape avant de générer votre clé API : possédez-vous un
                  <strong> code de parrainage</strong> ?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setHasReferralCode(true); setActivationError(''); }}
                    className={`py-2.5 rounded-lg border-2 font-medium transition-colors ${
                      hasReferralCode === true
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHasReferralCode(false); setReferralCodeInput(''); setActivationError(''); }}
                    className={`py-2.5 rounded-lg border-2 font-medium transition-colors ${
                      hasReferralCode === false
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Non
                  </button>
                </div>

                {hasReferralCode === true && (
                  <div>
                    <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Entrez votre code de parrainage
                    </label>
                    <input
                      id="referralCode"
                      type="text"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      placeholder="Ex: CONVESSA2026"
                      autoFocus
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none uppercase tracking-wide"
                    />
                  </div>
                )}

                {hasReferralCode === false && (
                  <p className="text-xs text-gray-500">
                    Pas de souci — votre clé sera générée avec les privilèges de notre offre gratuite.
                  </p>
                )}

                {activationError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{activationError}</p>
                  </div>
                )}

                <button
                  onClick={handleActivate}
                  disabled={activating || hasReferralCode === null}
                  className="w-full flex items-center justify-center space-x-2 bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activating ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      <span>Génération de la clé...</span>
                    </>
                  ) : (
                    <span>Générer ma clé API</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal clé API — affiché après connexion WhatsApp réussie */}
      <AnimatePresence>
        {apiKeyModal && (
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
              {/* Header */}
              <div className="relative bg-whatsapp px-8 py-6">
                <button
                  onClick={handleCloseApiKeyModal}
                  className="absolute top-4 right-4 text-white/80 hover:text-white"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 text-white pr-8">
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-snug">WhatsApp connecté avec succès !</h2>
                    <p className="text-green-100 text-sm">Votre clé API a été générée.</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Key size={16} className="text-green-700" />
                    <span>Votre clé API</span>
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-sm font-mono text-gray-900 flex-1 break-all">
                        {apiKeyModal.key || apiKeyModal.hint}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(apiKeyModal.key || apiKeyModal.hint || '');
                          setApiKeyModalCopied(true);
                          setTimeout(() => setApiKeyModalCopied(false), 2000);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 transition-colors flex-shrink-0"
                        aria-label="Copier la clé API"
                        title="Copier"
                      >
                        {apiKeyModalCopied ? <CheckCircle size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
                      </button>
                    </div>
                  </div>
                  {apiKeyModalCopied && (
                    <p className="text-xs text-green-700 mt-1.5">Clé copiée dans le presse-papiers</p>
                  )}
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="font-bold text-red-900 mb-1 text-sm"> Important : À lire attentivement</h4>
                      <ul className="text-xs text-red-800 space-y-1">
                        <li>• Cette clé ne sera plus affichée en clair par la suite</li>
                        <li>• Copiez-la et stockez-la dans un endroit sûr (gestionnaire de mots de passe, .env, etc.)</li>
                        <li>• Ne la partagez JAMAIS publiquement (GitHub, forums, etc.)</li>
                        <li>• Utilisez-la dans vos requêtes HTTP avec le header : <code className="bg-red-100 px-1 rounded">X-Api-Key</code></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {apiKeyModal.expiresAt && (
                  <p className="text-xs text-gray-500">
                    Valide jusqu'au{' '}
                    <span className="font-medium text-gray-700">
                      {new Date(apiKeyModal.expiresAt).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                  </p>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <span>Prochaines étapes</span>
                  </h4>
                  <ol className="text-xs text-blue-900 space-y-1 list-decimal list-inside">
                    <li>Allez dans <strong>Envoyer Message</strong> pour tester l'envoi</li>
                    <li>Consultez la <strong>Documentation</strong> pour intégrer l'API</li>
                    <li>Utilisez votre clé API dans toutes vos requêtes HTTP</li>
                  </ol>
                </div>

                <button
                  onClick={handleCloseApiKeyModal}
                  className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors font-medium"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal communauté — affiché après fermeture du modal clé API */}
      <AnimatePresence>
        {communityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-whatsapp px-6 py-5">
                <h2 className="text-xl font-bold text-white">
                  🚀 Rejoignez la communauté Convessa !
                </h2>
              </div>

              {/* Content */}
              <div className="p-6">
                {communityDone ? (
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Bienvenue dans la communauté ! 🎉</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Vous faites maintenant partie de la communauté Convessa. À bientôt !
                    </p>
                    <button
                      onClick={() => { setCommunityModal(false); }}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-6">
                      Connectez-vous avec d'autres développeurs, partagez vos projets et restez informé des nouveautés.
                    </p>

                    <form onSubmit={handleJoinCommunity} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="community-first-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Prénom <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="community-first-name"
                            type="text"
                            value={communityForm.firstName}
                            onChange={(e) => setCommunityForm((p) => ({ ...p, firstName: e.target.value }))}
                            placeholder="Jean"
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="community-last-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="community-last-name"
                            type="text"
                            value={communityForm.lastName}
                            onChange={(e) => setCommunityForm((p) => ({ ...p, lastName: e.target.value }))}
                            placeholder="Dupont"
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Téléphone WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <PhoneInput
                          international
                          defaultCountry="BJ"
                          value={communityForm.phone}
                          onChange={(val) => setCommunityForm((p) => ({ ...p, phone: val || '' }))}
                          className="phone-input-sessions"
                          placeholder="94 00 00 00"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={communitySubmitting || !communityForm.firstName.trim() || !communityForm.lastName.trim() || !communityForm.phone.trim()}
                          className="flex-1 flex items-center justify-center gap-2 bg-whatsapp text-white py-3 rounded-lg hover:bg-whatsapp-dark transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {communitySubmitting ? (
                            <><Loader className="animate-spin" size={16} /><span>Inscription...</span></>
                          ) : (
                            <span>Rejoindre</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommunityModal(false)}
                          className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Plus tard
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sessions;